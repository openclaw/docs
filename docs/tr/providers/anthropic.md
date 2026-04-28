---
read_when:
    - OpenClaw içinde Anthropic modellerini kullanmak istiyorsunuz
summary: OpenClaw içinde Anthropic Claude’u API anahtarları veya Claude CLI aracılığıyla kullanın
title: Anthropic
x-i18n:
    generated_at: "2026-04-26T11:38:41Z"
    model: gpt-5.4
    provider: openai
    source_hash: f26f117cb4f98790c323e056d39267c18f1278b0a7a8d3d43a7cbaddbb4523c1
    source_path: providers/anthropic.md
    workflow: 15
---

Anthropic, **Claude** model ailesini geliştirir. OpenClaw iki kimlik doğrulama yolunu destekler:

- **API anahtarı** — kullanım bazlı faturalandırma ile doğrudan Anthropic API erişimi (`anthropic/*` modelleri)
- **Claude CLI** — aynı ana makinede mevcut bir Claude CLI oturum açmasını yeniden kullanma

<Warning>
Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi, bu yüzden
Anthropic yeni bir politika yayımlamadığı sürece OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını
onaylanmış kabul eder.

Uzun ömürlü ağ geçidi ana makineleri için Anthropic API anahtarları hâlâ en açık ve
en öngörülebilir üretim yoludur.

Anthropic’in güncel herkese açık belgeleri:

- [Claude Code CLI referansı](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK genel bakış](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Claude Code’u Pro veya Max planınızla kullanma](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Claude Code’u Team veya Enterprise planınızla kullanma](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Başlangıç

<Tabs>
  <Tab title="API key">
    **En iyisi:** standart API erişimi ve kullanım bazlı faturalandırma.

    <Steps>
      <Step title="API anahtarınızı alın">
        [Anthropic Console](https://console.anthropic.com/) içinde bir API anahtarı oluşturun.
      </Step>
      <Step title="Onboarding’i çalıştırın">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
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
    **En iyisi:** ayrı bir API anahtarı olmadan mevcut bir Claude CLI oturum açmasını yeniden kullanmak.

    <Steps>
      <Step title="Claude CLI’nin kurulu ve oturum açılmış olduğundan emin olun">
        Şununla doğrulayın:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Onboarding’i çalıştırın">
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
    Claude CLI arka ucu için kurulum ve çalışma zamanı ayrıntıları [CLI Backends](/tr/gateway/cli-backends) sayfasındadır.
    </Note>

    ### Yapılandırma örneği

    Kanonik Anthropic model referansını ve bir CLI çalışma zamanı geçersiz kılmasını tercih edin:

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

    Eski `claude-cli/claude-opus-4-7` model referansları uyumluluk için hâlâ çalışır,
    ancak yeni yapılandırma sağlayıcı/model seçimini
    `anthropic/*` olarak tutmalı ve yürütme arka ucunu `agentRuntime.id` içine koymalıdır.

    <Tip>
    En açık faturalandırma yolunu istiyorsanız bunun yerine Anthropic API anahtarı kullanın. OpenClaw ayrıca [OpenAI Codex](/tr/providers/openai), [Qwen Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [Z.AI / GLM](/tr/providers/glm) üzerinden abonelik tarzı seçenekleri de destekler.
    </Tip>

  </Tab>
</Tabs>

## Düşünme varsayılanları (Claude 4.6)

Claude 4.6 modelleri, açık bir düşünme düzeyi ayarlanmadığında OpenClaw içinde varsayılan olarak `adaptive` düşünmeyi kullanır.

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

## İstem önbellekleme

OpenClaw, API anahtarı kimlik doğrulaması için Anthropic’in istem önbellekleme özelliğini destekler.

| Değer               | Önbellek süresi | Açıklama                                |
| ------------------- | --------------- | --------------------------------------- |
| `"short"` (varsayılan) | 5 dakika        | API anahtarı kimlik doğrulaması için otomatik uygulanır |
| `"long"`            | 1 saat          | Genişletilmiş önbellek                  |
| `"none"`            | Önbellekleme yok | İstem önbelleklemeyi devre dışı bırakır |

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
  <Accordion title="Aracı başına önbellek geçersiz kılmaları">
    Temel çizginiz olarak model düzeyinde parametreleri kullanın, ardından belirli aracıları `agents.list[].params` ile geçersiz kılın:

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

    Bu, aynı modeldeki bir aracının uzun ömürlü bir önbelleği korurken başka bir aracının ani artış gösteren/düşük yeniden kullanım trafiği için önbelleği devre dışı bırakmasına olanak tanır.

  </Accordion>

  <Accordion title="Bedrock Claude notları">
    - Bedrock üzerindeki Anthropic Claude modelleri (`amazon-bedrock/*anthropic.claude*`) yapılandırıldığında `cacheRetention` aktarımını kabul eder.
    - Anthropic dışı Bedrock modelleri çalışma zamanında zorla `cacheRetention: "none"` yapılır.
    - API anahtarı akıllı varsayılanları, açık bir değer ayarlanmadığında Claude-on-Bedrock referansları için `cacheRetention: "short"` değerini de başlangıç olarak ayarlar.

  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Hızlı mod">
    OpenClaw’in paylaşılan `/fast` geçişi, doğrudan Anthropic trafiğini (`api.anthropic.com` için API anahtarı ve OAuth) destekler.

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
    - Yalnızca doğrudan `api.anthropic.com` isteklerine enjekte edilir. Proxy rotaları `service_tier` alanını dokunmadan bırakır.
    - Hem açık `serviceTier` hem de `service_tier` parametreleri ayarlanmışsa, bunlar `/fast` ayarını geçersiz kılar.
    - Priority Tier kapasitesi olmayan hesaplarda `service_tier: "auto"` değeri `standard` olarak çözülebilir.

    </Note>

  </Accordion>

  <Accordion title="Medya anlama (görüntü ve PDF)">
    Paketlenmiş Anthropic plugin’i görüntü ve PDF anlama kaydı yapar. OpenClaw,
    yapılandırılmış Anthropic kimlik doğrulamasından medya yeteneklerini otomatik olarak çözümler — ek
    yapılandırma gerekmez.

    | Özellik       | Değer                |
    | ------------- | -------------------- |
    | Varsayılan model  | `claude-opus-4-6`    |
    | Desteklenen girdi | Görüntüler, PDF belgeleri |

    Bir konuşmaya görüntü veya PDF eklendiğinde, OpenClaw bunu otomatik olarak
    Anthropic medya anlama sağlayıcısı üzerinden yönlendirir.

  </Accordion>

  <Accordion title="1M bağlam penceresi (beta)">
    Anthropic’in 1M bağlam penceresi beta ile sınırlıdır. Bunu model başına etkinleştirin:

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

    `params.context1m: true`, uygun Opus ve Sonnet modelleri için
    Claude CLI arka ucuna da (`claude-cli/*`) uygulanır ve bu CLI oturumlarının çalışma zamanı
    bağlam penceresini doğrudan API davranışıyla eşleşecek şekilde genişletir.

    <Warning>
    Anthropic kimlik bilginizde uzun bağlam erişimi gerektirir. Eski token kimlik doğrulaması (`sk-ant-oat-*`), 1M bağlam istekleri için reddedilir — OpenClaw bir uyarı günlüğe kaydeder ve standart bağlam penceresine geri döner.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M bağlam">
    `anthropic/claude-opus-4.7` ve onun `claude-cli` varyantı varsayılan olarak 1M bağlam
    penceresine sahiptir — `params.context1m: true` gerekmez.
  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="401 hataları / token birden geçersiz oldu">
    Anthropic token kimlik doğrulamasının süresi dolar ve iptal edilebilir. Yeni kurulumlar için bunun yerine bir Anthropic API anahtarı kullanın.
  </Accordion>

  <Accordion title='Sağlayıcı "anthropic" için API anahtarı bulunamadı'>
    Anthropic kimlik doğrulaması **aracı başınadır** — yeni aracılar ana aracının anahtarlarını devralmaz. Bu aracı için onboarding’i yeniden çalıştırın (veya ağ geçidi ana makinesinde bir API anahtarı yapılandırın), sonra `openclaw models status` ile doğrulayın.
  </Accordion>

  <Accordion title='Profil "anthropic:default" için kimlik bilgisi bulunamadı'>
    Hangi auth profilinin etkin olduğunu görmek için `openclaw models status` çalıştırın. Onboarding’i yeniden çalıştırın veya o profil yolu için bir API anahtarı yapılandırın.
  </Accordion>

  <Accordion title="Kullanılabilir auth profili yok (hepsi bekleme süresinde)">
    `auth.unusableProfiles` değerini görmek için `openclaw models status --json` kullanın. Anthropic oran sınırı bekleme süreleri model kapsamlı olabilir, bu yüzden kardeş bir Anthropic modeli yine de kullanılabilir olabilir. Başka bir Anthropic profili ekleyin veya bekleme süresinin bitmesini bekleyin.
  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve devralma davranışını seçme.
  </Card>
  <Card title="CLI arka uçları" href="/tr/gateway/cli-backends" icon="terminal">
    Claude CLI arka ucu kurulumu ve çalışma zamanı ayrıntıları.
  </Card>
  <Card title="İstem önbellekleme" href="/tr/reference/prompt-caching" icon="database">
    İstem önbelleklemenin sağlayıcılar arasında nasıl çalıştığı.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
