---
read_when:
    - OpenClaw'da Anthropic modellerini kullanmak istiyorsunuz
summary: OpenClaw’da Anthropic Claude’u API anahtarları veya Claude CLI aracılığıyla kullanın
title: Anthropic
x-i18n:
    generated_at: "2026-04-30T09:38:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: dfaba2eea6a2d263d76036d1e6859fc3b487e886ec460ef2ced83e5e8e834327
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic, **Claude** model ailesini geliştirir. OpenClaw iki kimlik doğrulama rotasını destekler:

- **API anahtarı** — kullanıma dayalı faturalandırmayla doğrudan Anthropic API erişimi (`anthropic/*` modelleri)
- **Claude CLI** — aynı ana makinedeki mevcut bir Claude CLI oturumunu yeniden kullanma

<Warning>
Anthropic personeli bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi, bu nedenle
Anthropic yeni bir ilke yayımlamadığı sürece OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını onaylı kabul eder.

Uzun ömürlü gateway ana makineleri için Anthropic API anahtarları hâlâ en net ve
en öngörülebilir üretim yoludur.

Anthropic'in güncel herkese açık belgeleri:

- [Claude Code CLI referansı](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK genel bakışı](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Claude Code'u Pro veya Max planınızla kullanma](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Claude Code'u Team veya Enterprise planınızla kullanma](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Başlarken

<Tabs>
  <Tab title="API anahtarı">
    **En uygunu:** standart API erişimi ve kullanıma dayalı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [Anthropic Console](https://console.anthropic.com/) içinde bir API anahtarı oluşturun.
      </Step>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Ya da anahtarı doğrudan geçirin:

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
    **En uygunu:** ayrı bir API anahtarı olmadan mevcut bir Claude CLI oturumunu yeniden kullanma.

    <Steps>
      <Step title="Claude CLI'nin kurulu ve oturum açmış olduğundan emin olun">
        Şununla doğrulayın:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard
        # choose: Claude CLI
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
    Claude CLI backend için kurulum ve çalışma zamanı ayrıntıları [CLI Backend'leri](/tr/gateway/cli-backends) bölümündedir.
    </Note>

    ### Yapılandırma örneği

    Kanonik Anthropic model başvurusunu ve bir CLI çalışma zamanı geçersiz kılmasını tercih edin:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-7" },
          agentRuntime: { id: "claude-cli" },
        },
      },
    }
    ```

    Eski `claude-cli/claude-opus-4-7` model başvuruları uyumluluk için hâlâ çalışır,
    ancak yeni yapılandırma sağlayıcı/model seçimini `anthropic/*` olarak tutmalı ve yürütme backend'ini `agentRuntime.id` içine koymalıdır.

    <Tip>
    En net faturalandırma yolunu istiyorsanız bunun yerine bir Anthropic API anahtarı kullanın. OpenClaw ayrıca [OpenAI Codex](/tr/providers/openai), [Qwen Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [Z.AI / GLM](/tr/providers/glm) üzerinden abonelik tarzı seçenekleri de destekler.
    </Tip>

  </Tab>
</Tabs>

## Düşünme varsayılanları (Claude 4.6)

Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmadığında OpenClaw içinde varsayılan olarak `adaptive` düşünmeyi kullanır.

İleti başına `/think:<level>` ile veya model parametrelerinde geçersiz kılın:

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
- [Uyarlamalı düşünme](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Genişletilmiş düşünme](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Prompt önbelleğe alma

OpenClaw, API anahtarı kimlik doğrulaması için Anthropic'in prompt önbelleğe alma özelliğini destekler.

| Değer               | Önbellek süresi | Açıklama                                      |
| ------------------- | --------------- | --------------------------------------------- |
| `"short"` (varsayılan) | 5 dakika      | API anahtarı kimlik doğrulaması için otomatik uygulanır |
| `"long"`            | 1 saat          | Genişletilmiş önbellek                         |
| `"none"`            | Önbelleğe alma yok | Prompt önbelleğe almayı devre dışı bırakır |

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
    Temeliniz olarak model düzeyi parametreleri kullanın, ardından belirli ajanları `agents.list[].params` üzerinden geçersiz kılın:

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

    Bu, aynı modeldeki başka bir ajan ani/az yeniden kullanılan trafik için önbelleğe almayı devre dışı bırakırken bir ajanın uzun ömürlü bir önbellek tutmasına olanak tanır.

  </Accordion>

  <Accordion title="Bedrock Claude notları">
    - Bedrock üzerindeki Anthropic Claude modelleri (`amazon-bedrock/*anthropic.claude*`), yapılandırıldığında `cacheRetention` geçişini kabul eder.
    - Anthropic dışı Bedrock modelleri çalışma zamanında `cacheRetention: "none"` değerine zorlanır.
    - API anahtarı akıllı varsayılanları, açık bir değer ayarlanmadığında Claude-on-Bedrock başvuruları için `cacheRetention: "short"` değerini de başlangıçta ayarlar.

  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Hızlı mod">
    OpenClaw'ın paylaşılan `/fast` açma kapama denetimi, doğrudan Anthropic trafiğini destekler (API anahtarı ve `api.anthropic.com` için OAuth).

    | Komut | Şuna eşlenir |
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
    - Yalnızca doğrudan `api.anthropic.com` istekleri için enjekte edilir. Proxy rotaları `service_tier` değerine dokunmaz.
    - Açık `serviceTier` veya `service_tier` parametreleri, ikisi de ayarlandığında `/fast` değerini geçersiz kılar.
    - Priority Tier kapasitesi olmayan hesaplarda `service_tier: "auto"` değeri `standard` olarak çözümlenebilir.

    </Note>

  </Accordion>

  <Accordion title="Medya anlama (görüntü ve PDF)">
    Birlikte gelen Anthropic Plugin'i görüntü ve PDF anlama özelliğini kaydeder. OpenClaw
    medya yeteneklerini yapılandırılmış Anthropic kimlik doğrulamasından otomatik olarak çözümler; ek yapılandırma gerekmez.

    | Özellik       | Değer                |
    | -------------- | -------------------- |
    | Varsayılan model  | `claude-opus-4-6`    |
    | Desteklenen girdi | Görüntüler, PDF belgeleri |

    Bir konuşmaya görüntü veya PDF eklendiğinde OpenClaw bunu otomatik olarak
    Anthropic medya anlama sağlayıcısı üzerinden yönlendirir.

  </Accordion>

  <Accordion title="1M bağlam penceresi (beta)">
    Anthropic'in 1M bağlam penceresi beta kapılıdır. Bunu model başına etkinleştirin:

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

    OpenClaw bunu isteklerde `anthropic-beta: context-1m-2025-08-07` değerine eşler.

    `params.context1m: true`, uygun Opus ve Sonnet modelleri için Claude CLI backend'ine
    (`claude-cli/*`) de uygulanır ve bu CLI oturumlarının çalışma zamanı
    bağlam penceresini doğrudan API davranışıyla eşleşecek şekilde genişletir.

    <Warning>
    Anthropic kimlik bilginizde uzun bağlam erişimi gerektirir. Eski token kimlik doğrulaması (`sk-ant-oat-*`) 1M bağlam istekleri için reddedilir; OpenClaw bir uyarı günlüğe yazar ve standart bağlam penceresine geri döner.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M bağlam">
    `anthropic/claude-opus-4.7` ve bunun `claude-cli` varyantı varsayılan olarak 1M bağlam
    penceresine sahiptir; `params.context1m: true` gerekmez.
  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="401 hataları / token aniden geçersiz">
    Anthropic token kimlik doğrulamasının süresi dolar ve iptal edilebilir. Yeni kurulumlar için bunun yerine bir Anthropic API anahtarı kullanın.
  </Accordion>

  <Accordion title='"anthropic" sağlayıcısı için API anahtarı bulunamadı'>
    Anthropic kimlik doğrulaması **ajan başınadır**; yeni ajanlar ana ajanın anahtarlarını devralmaz. Bu ajan için onboarding'i yeniden çalıştırın (veya gateway ana makinesinde bir API anahtarı yapılandırın), ardından `openclaw models status` ile doğrulayın.
  </Accordion>

  <Accordion title='"anthropic:default" profili için kimlik bilgisi bulunamadı'>
    Hangi kimlik doğrulama profilinin etkin olduğunu görmek için `openclaw models status` çalıştırın. Onboarding'i yeniden çalıştırın veya bu profil yolu için bir API anahtarı yapılandırın.
  </Accordion>

  <Accordion title="Kullanılabilir kimlik doğrulama profili yok (tümü bekleme süresinde)">
    `auth.unusableProfiles` için `openclaw models status --json` denetleyin. Anthropic hız sınırı bekleme süreleri model kapsamlı olabilir, bu nedenle kardeş bir Anthropic modeli hâlâ kullanılabilir olabilir. Başka bir Anthropic profili ekleyin veya bekleme süresini bekleyin.
  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve yük devretme davranışını seçme.
  </Card>
  <Card title="CLI backend'leri" href="/tr/gateway/cli-backends" icon="terminal">
    Claude CLI backend kurulumu ve çalışma zamanı ayrıntıları.
  </Card>
  <Card title="Prompt önbelleğe alma" href="/tr/reference/prompt-caching" icon="database">
    Prompt önbelleğe almanın sağlayıcılar arasında nasıl çalıştığı.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
