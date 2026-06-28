---
read_when:
    - OpenClaw içinde Anthropic modellerini kullanmak istiyorsunuz
summary: OpenClaw'da API anahtarları veya Claude CLI aracılığıyla Anthropic Claude kullanın
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T01:08:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 299bb8661bb894c57ca7a60f350494d22f6b726061ffcb70df053c40a3f842b0
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic, **Claude** model ailesini geliştirir. OpenClaw iki kimlik doğrulama yolunu destekler:

- **API anahtarı** — kullanım tabanlı faturalandırmayla doğrudan Anthropic API erişimi (`anthropic/*` modelleri)
- **Claude CLI** — aynı ana makinede mevcut bir Claude Code oturum açma bilgisini yeniden kullanma

<Warning>
OpenClaw'ın Claude CLI arka ucu, yüklü Claude Code CLI'ını etkileşimsiz yazdırma modunda çalıştırır. Anthropic'in mevcut Claude Code belgeleri, `claude -p` kullanımını Agent SDK/programatik kullanım olarak tanımlar. 15 Haziran 2026'dan itibaren Anthropic, abonelik planı kapsamındaki `claude -p` kullanımının artık normal Claude plan sınırlarından düşülmediğini; önce ayrı bir aylık Agent SDK kredisinden, ardından bu krediler etkinleştirildiğinde standart API ücretleriyle kullanım kredilerinden düştüğünü belirtir.

Etkileşimli Claude Code, oturum açılmış Claude plan sınırlarından düşülmeye devam eder. API anahtarıyla kimlik doğrulama, doğrudan kullandıkça öde API faturalandırması olarak kalır. Uzun ömürlü gateway ana makineleri, paylaşılan otomasyon ve öngörülebilir üretim harcaması için bir Anthropic API anahtarı kullanın.

Anthropic'in mevcut herkese açık belgeleri:

- [Claude Code CLI başvurusu](https://code.claude.com/docs/en/cli-usage)
- [Claude Agent SDK'yı Claude planınızla kullanma](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Claude Code'u Pro veya Max planınızla kullanma](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Claude Code'u Team veya Enterprise planınızla kullanma](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code maliyetlerini yönetme](https://code.claude.com/docs/en/costs)

</Warning>

## Başlarken

<Tabs>
  <Tab title="API key">
    **En uygun kullanım:** standart API erişimi ve kullanım tabanlı faturalandırma.

    <Steps>
      <Step title="Get your API key">
        [Anthropic Console](https://console.anthropic.com/) içinde bir API anahtarı oluşturun.
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Veya anahtarı doğrudan iletin:

        ```bash
        openclaw onboard --anthropic-api-key "$ANTHROPIC_API_KEY"
        ```
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    ### Yapılandırma örneği

    ```json5
    {
      env: { ANTHROPIC_API_KEY: "example-anthropic-key-not-real" },
      agents: { defaults: { model: { primary: "anthropic/claude-opus-4-8" } } },
    }
    ```

  </Tab>

  <Tab title="Claude CLI">
    **En uygun kullanım:** ayrı bir API anahtarı olmadan mevcut bir Claude CLI oturum açma bilgisini yeniden kullanma.

    <Steps>
      <Step title="Ensure Claude CLI is installed and logged in">
        Şununla doğrulayın:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Claude CLI
        ```

        OpenClaw, mevcut Claude CLI kimlik bilgilerini algılar ve yeniden kullanır.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI arka ucuna ilişkin kurulum ve çalışma zamanı ayrıntıları [CLI Arka Uçları](/tr/gateway/cli-backends) sayfasındadır.
    </Note>

    <Warning>
    Claude CLI yeniden kullanımı, OpenClaw sürecinin Claude CLI oturum açma bilgisiyle aynı ana makinede çalışmasını bekler. Docker kurulumları bir container ana dizinini kalıcı hale getirip orada Claude Code oturumu açabilir; bkz. [Docker'da Claude CLI arka ucu](/tr/install/docker#claude-cli-backend-in-docker). [Podman](/tr/install/podman) gibi diğer container kurulumları, ana makinedeki `~/.claude` dizinini kurulum veya çalışma zamanına bağlamaz; burada bir Anthropic API anahtarı kullanın veya [OpenAI Codex](/tr/providers/openai) gibi OpenClaw tarafından yönetilen OAuth'a sahip bir sağlayıcı seçin.
    </Warning>

    ### Yapılandırma örneği

    Bir CLI çalışma zamanı geçersiz kılmasıyla birlikte kanonik Anthropic model ref'ini tercih edin:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "anthropic/claude-opus-4-8" },
          models: {
            "anthropic/claude-opus-4-8": {
              agentRuntime: { id: "claude-cli" },
            },
          },
        },
      },
    }
    ```

    Eski `claude-cli/claude-opus-4-7` model ref'leri uyumluluk için hâlâ çalışır, ancak yeni yapılandırma sağlayıcı/model seçimini `anthropic/*` olarak tutmalı ve yürütme arka ucunu sağlayıcı/model çalışma zamanı politikasına koymalıdır.

    ### Faturalandırma ve `claude -p`

    OpenClaw, Claude CLI çalıştırmaları için Claude Code'un etkileşimsiz `claude -p` yolunu kullanır. Anthropic şu anda bu yolu Agent SDK/programatik kullanım olarak ele alır:

    - 15 Haziran 2026'ya kadar, abonelik planı işleme oturum açılmış hesap için Anthropic'in etkin Claude Code kurallarını izler.
    - 15 Haziran 2026'dan itibaren, abonelik planı kapsamındaki `claude -p` kullanımı önce kullanıcının aylık Agent SDK kredisinden, ardından kullanım kredileri etkinleştirilmişse standart API ücretleriyle kullanım kredilerinden düşer.
    - Console/API anahtarı oturumları kullandıkça öde API faturalandırmasını kullanır ve abonelik Agent SDK kredisini almaz.

    Anthropic, bir OpenClaw sürümü olmadan Claude Code faturalandırmasını ve hız sınırı davranışını değiştirebilir. Faturalandırma öngörülebilirliği önemli olduğunda `claude auth status`, `/status` ve Anthropic'in bağlantılı belgelerini kontrol edin.

    <Tip>
    Paylaşılan üretim otomasyonu için Claude CLI yerine bir Anthropic API anahtarı kullanın. OpenClaw ayrıca [OpenAI Codex](/tr/providers/openai), [Qwen Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [Z.AI / GLM](/tr/providers/zai) tarafından sunulan abonelik tarzı seçenekleri de destekler.
    </Tip>

  </Tab>
</Tabs>

## Düşünme varsayılanları (Claude Fable 5, 4.8 ve 4.6)

`anthropic/claude-fable-5` her zaman uyarlanabilir düşünme kullanır ve varsayılan olarak `high` eforuna ayarlanır. Anthropic bu model için düşünmenin devre dışı bırakılmasına izin vermediğinden, `/think off` ve `/think minimal` `low` eforunu kullanır. OpenClaw ayrıca Fable 5 istekleri için özel sıcaklık değerlerini atlar.

Claude Opus 4.8, OpenClaw'da varsayılan olarak düşünmeyi kapalı tutar. `/think high|xhigh|max` ile uyarlanabilir düşünmeyi açıkça etkinleştirdiğinizde OpenClaw, Anthropic'in Opus 4.8 efor değerlerini gönderir; Claude 4.6 modelleri varsayılan olarak `adaptive` kullanır.

İleti başına `/think:<level>` ile veya model parametrelerinde geçersiz kılın:

```json5
{
  agents: {
    defaults: {
      models: {
        "anthropic/claude-opus-4-8": {
          params: { thinking: "high" },
        },
      },
    },
  },
}
```

<Note>
İlgili Anthropic belgeleri:
- [Uyarlanabilir düşünme](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Genişletilmiş düşünme](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## İstem önbelleğe alma

OpenClaw, API anahtarıyla kimlik doğrulama için Anthropic'in istem önbelleğe alma özelliğini destekler.

| Değer               | Önbellek süresi | Açıklama                                  |
| ------------------- | -------------- | ----------------------------------------- |
| `"short"` (varsayılan) | 5 dakika    | API anahtarı kimlik doğrulaması için otomatik uygulanır |
| `"long"`            | 1 saat         | Genişletilmiş önbellek                    |
| `"none"`            | Önbellekleme yok | İstem önbelleğe almayı devre dışı bırakır |

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
  <Accordion title="Per-agent cache overrides">
    Temel değer olarak model düzeyi parametreleri kullanın, ardından belirli agents'ları `agents.list[].params` üzerinden geçersiz kılın:

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

    Bu, aynı modeldeki başka bir agent yoğun/düşük yeniden kullanım trafiği için önbelleğe almayı devre dışı bırakırken bir agent'ın uzun ömürlü bir önbelleği korumasına olanak tanır.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Bedrock üzerindeki Anthropic Claude modelleri (`amazon-bedrock/*anthropic.claude*`) yapılandırıldığında `cacheRetention` geçişini kabul eder.
    - Anthropic olmayan Bedrock modelleri çalışma zamanında `cacheRetention: "none"` değerine zorlanır.
    - API anahtarı akıllı varsayılanları, açık bir değer ayarlanmamışsa Claude-on-Bedrock ref'leri için `cacheRetention: "short"` değerini de başlatır.

  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Fast mode">
    OpenClaw'ın paylaşılan `/fast` anahtarı, doğrudan Anthropic trafiğini destekler (API anahtarı ve `api.anthropic.com` için OAuth).

    | Komut | Eşlendiği değer |
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
    - Yalnızca doğrudan `api.anthropic.com` istekleri için eklenir. Proxy yolları `service_tier` değerini değiştirmez.
    - Açık `serviceTier` veya `service_tier` parametreleri, ikisi de ayarlandığında `/fast` değerini geçersiz kılar.
    - Priority Tier kapasitesi olmayan hesaplarda `service_tier: "auto"` `standard` değerine çözümlenebilir.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Paketle gelen Anthropic Plugin, görüntü ve PDF anlama özelliklerini kaydeder. OpenClaw, yapılandırılmış Anthropic kimlik doğrulamasından medya yeteneklerini otomatik olarak çözümler; ek yapılandırma gerekmez.

    | Özellik        | Değer                 |
    | --------------- | --------------------- |
    | Varsayılan model   | `claude-opus-4-8`     |
    | Desteklenen giriş | Görseller, PDF belgeleri |

    Bir konuşmaya görsel veya PDF eklendiğinde OpenClaw bunu otomatik olarak Anthropic medya anlama sağlayıcısı üzerinden yönlendirir.

  </Accordion>

  <Accordion title="1M context window">
    Anthropic'in 1M bağlam penceresi, Opus 4.8, Opus 4.7, Opus 4.6 ve Sonnet 4.6 gibi GA destekli Claude 4.x modellerinde kullanılabilir. OpenClaw bu modelleri otomatik olarak 1M olarak boyutlandırır:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "anthropic/claude-opus-4-6": {},
          },
        },
      },
    }
    ```

    Eski yapılandırmalar `params.context1m: true` değerini koruyabilir, ancak OpenClaw artık kullanımdan kaldırılmış `context-1m-2025-08-07` beta başlığını göndermez. Bu değere sahip eski `anthropicBeta` yapılandırma girdileri istek başlığı çözümlemesi sırasında yok sayılır ve desteklenmeyen daha eski Claude modelleri normal bağlam pencerelerinde kalır.

    `params.context1m: true`, uygun GA destekli Opus ve Sonnet modelleri için Claude CLI arka ucuna (`claude-cli/*`) da uygulanır ve bu CLI oturumlarının çalışma zamanı bağlam penceresini doğrudan API davranışıyla eşleşecek şekilde korur.

    <Warning>
    Anthropic kimlik bilginizde uzun bağlam erişimi gerektirir. OAuth/abonelik token kimlik doğrulaması gerekli Anthropic beta başlıklarını korur, ancak eski yapılandırmada kalmışsa OpenClaw kullanımdan kaldırılmış 1M beta başlığını çıkarır.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M context">
    `anthropic/claude-opus-4-8` ve onun `claude-cli` varyantı varsayılan olarak 1M bağlam penceresine sahiptir; `params.context1m: true` gerekmez.
  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    Anthropic token kimlik doğrulamasının süresi dolar ve iptal edilebilir. Yeni kurulumlar için bunun yerine bir Anthropic API anahtarı kullanın.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Anthropic kimlik doğrulaması **ajan başınadır** — yeni ajanlar ana ajanın anahtarlarını devralmaz. Bu ajan için onboarding işlemini yeniden çalıştırın (veya gateway host üzerinde bir API anahtarı yapılandırın), ardından `openclaw models status` ile doğrulayın.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Hangi kimlik doğrulama profilinin etkin olduğunu görmek için `openclaw models status` çalıştırın. Onboarding işlemini yeniden çalıştırın veya bu profil yolu için bir API anahtarı yapılandırın.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    `auth.unusableProfiles` için `openclaw models status --json` çıktısını kontrol edin. Anthropic hız sınırı bekleme süreleri model kapsamlı olabilir, bu nedenle kardeş bir Anthropic modeli hâlâ kullanılabilir olabilir. Başka bir Anthropic profili ekleyin veya bekleme süresinin dolmasını bekleyin.
  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model referanslarını ve yük devretme davranışını seçme.
  </Card>
  <Card title="CLI backends" href="/tr/gateway/cli-backends" icon="terminal">
    Claude CLI backend kurulumu ve çalışma zamanı ayrıntıları.
  </Card>
  <Card title="Prompt caching" href="/tr/reference/prompt-caching" icon="database">
    Prompt önbelleğe almanın sağlayıcılar genelinde nasıl çalıştığı.
  </Card>
  <Card title="OAuth and auth" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgilerini yeniden kullanma kuralları.
  </Card>
</CardGroup>
