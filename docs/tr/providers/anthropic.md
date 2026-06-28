---
read_when:
    - OpenClaw'da Anthropic modellerini kullanmak istiyorsunuz
summary: OpenClaw'da API anahtarları veya Claude CLI aracılığıyla Anthropic Claude kullanın
title: Anthropic
x-i18n:
    generated_at: "2026-06-28T20:44:41Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 48a2792e464175b3ebe6acd92606c20231fd31940f56e2432bb45657eb0a68d7
    source_path: providers/anthropic.md
    workflow: 16
---

Anthropic, **Claude** model ailesini geliştirir. OpenClaw iki kimlik doğrulama rotasını destekler:

- **API anahtarı** — kullanıma dayalı faturalandırmayla doğrudan Anthropic API erişimi (`anthropic/*` modelleri)
- **Claude CLI** — aynı ana makinedeki mevcut Claude Code oturumunu yeniden kullanma

<Warning>
OpenClaw'ın Claude CLI arka ucu, kurulu Claude Code CLI'yi etkileşimsiz
yazdırma modunda çalıştırır. Anthropic'in güncel Claude Code dokümanları
`claude -p` komutunu Agent SDK/programatik kullanım olarak tanımlar. Anthropic'in 15 Haziran 2026 destek
güncellemesi, duyurulan Agent SDK faturalandırma değişikliğini duraklattı. Şimdilik Anthropic,
Claude Agent SDK, `claude -p` ve üçüncü taraf uygulama kullanımının hâlâ bir
aboneliğin kullanım limitlerinden düştüğünü söylüyor. Daha önce duyurulan aylık Agent SDK kredisi,
Anthropic bu planı revize ederken kullanılamaz.

Etkileşimli Claude Code hâlâ oturum açılmış Claude planı limitlerinden düşer. API
anahtarı kimlik doğrulaması doğrudan kullandıkça öde API faturalandırması olarak kalır. Uzun ömürlü Gateway ana makineleri,
paylaşılan otomasyon ve öngörülebilir üretim harcaması için bir Anthropic API anahtarı kullanın.

Abonelik faturalandırma davranışına güvenmeden önce Anthropic'in güncel destek
makalelerini kontrol edin:

- [Claude Code CLI başvurusu](https://code.claude.com/docs/en/cli-usage)
- [Claude Agent SDK'yı Claude planınızla kullanın](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan)
- [Claude Code'u Pro veya Max planınızla kullanın](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
- [Claude Code'u Team veya Enterprise planınızla kullanın](https://support.claude.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan)
- [Claude Code maliyetlerini yönetin](https://code.claude.com/docs/en/costs)

</Warning>

## Başlarken

<Tabs>
  <Tab title="API key">
    **En uygun olduğu durum:** standart API erişimi ve kullanıma dayalı faturalandırma.

    <Steps>
      <Step title="Get your API key">
        [Anthropic Console](https://console.anthropic.com/) içinde bir API anahtarı oluşturun.
      </Step>
      <Step title="Run onboarding">
        ```bash
        openclaw onboard
        # choose: Anthropic API key
        ```

        Ya da anahtarı doğrudan iletin:

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
    **En uygun olduğu durum:** ayrı bir API anahtarı olmadan mevcut bir Claude CLI oturumunu yeniden kullanma.

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

        OpenClaw mevcut Claude CLI kimlik bilgilerini algılar ve yeniden kullanır.
      </Step>
      <Step title="Verify the model is available">
        ```bash
        openclaw models list --provider anthropic
        ```
      </Step>
    </Steps>

    <Note>
    Claude CLI arka ucu için kurulum ve çalışma zamanı ayrıntıları [CLI Arka Uçları](/tr/gateway/cli-backends) bölümündedir.
    </Note>

    <Warning>
    Claude CLI yeniden kullanımı, OpenClaw sürecinin Claude CLI oturumuyla aynı
    ana makinede çalışmasını bekler. Docker kurulumları bir konteyner ana dizinini kalıcı hale getirip
    Claude Code'a orada oturum açabilir; bkz.
    [Docker'da Claude CLI arka ucu](/tr/install/docker#claude-cli-backend-in-docker).
    [Podman](/tr/install/podman) gibi diğer konteyner kurulumları ana makine
    `~/.claude` dizinini kurulum veya çalışma zamanına bağlamaz; orada bir Anthropic API anahtarı kullanın veya
    [OpenAI Codex](/tr/providers/openai) gibi OpenClaw tarafından yönetilen OAuth'a sahip
    bir sağlayıcı seçin.
    </Warning>

    ### Yapılandırma örneği

    Kanonik Anthropic model referansını ve bir CLI çalışma zamanı geçersiz kılmasını tercih edin:

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

    Eski `claude-cli/claude-opus-4-7` model referansları uyumluluk için hâlâ çalışır,
    ancak yeni yapılandırma sağlayıcı/model seçimini `anthropic/*` olarak tutmalı
    ve yürütme arka ucunu sağlayıcı/model çalışma zamanı politikasına koymalıdır.

    ### Faturalandırma ve `claude -p`

    OpenClaw, Claude CLI çalıştırmaları için Claude Code'un etkileşimsiz `claude -p`
    yolunu kullanır. Anthropic şu anda bu yolu Agent SDK/programatik kullanım olarak değerlendirir:

    - Anthropic'in 15 Haziran 2026 destek güncellemesi, daha önce duyurulan
      ayrı Agent SDK kredi planını duraklattı.
    - Şimdilik abonelik planı Claude Agent SDK, `claude -p` ve üçüncü taraf
      uygulama kullanımı hâlâ oturum açılmış aboneliğin kullanım limitlerinden düşer.
    - Daha önce duyurulan aylık Agent SDK kredisi, Anthropic bu planı revize ederken
      kullanılamaz.
    - Console/API anahtarı oturumları kullandıkça öde API faturalandırmasını kullanır ve
      abonelik Agent SDK kredisini almaz.

    Duraklatma bildirimi için Anthropic'in [Agent SDK planı
    makalesine](https://support.claude.com/en/articles/15036540-use-the-claude-agent-sdk-with-your-claude-plan),
    [Pro/Max](https://support.claude.com/en/articles/11145838-use-claude-code-with-your-pro-or-max-plan)
    ve
    [Team/Enterprise](https://support.claude.com/en/articles/11845131-use-claude-code-with-your-team-or-enterprise-plan)
    abonelik davranışı için Claude Code planı makalelerine bakın.

    Anthropic, OpenClaw sürümü olmadan Claude Code faturalandırmasını ve hız limiti davranışını değiştirebilir.
    Faturalandırma öngörülebilirliği önemli olduğunda `claude auth status`, `/status` ve
    Anthropic'in bağlantılı dokümanlarını kontrol edin.

    <Tip>
    Paylaşılan üretim otomasyonu için Claude CLI yerine bir Anthropic API anahtarı kullanın.
    OpenClaw ayrıca [OpenAI Codex](/tr/providers/openai), [Qwen Cloud](/tr/providers/qwen),
    [MiniMax](/tr/providers/minimax) ve [Z.AI / GLM](/tr/providers/zai) üzerinden
    abonelik tarzı seçenekleri destekler.
    </Tip>

  </Tab>
</Tabs>

## Düşünme varsayılanları (Claude Fable 5, 4.8 ve 4.6)

`anthropic/claude-fable-5` her zaman uyarlamalı düşünmeyi kullanır ve varsayılan olarak `high`
çaba düzeyini seçer. Anthropic bu model için düşünmenin devre dışı bırakılmasına izin vermediğinden,
`/think off` ve `/think minimal` `low` çaba düzeyini kullanır. OpenClaw ayrıca Fable 5 istekleri için özel
sıcaklık değerlerini atlar.

Claude Opus 4.8, OpenClaw'da varsayılan olarak düşünmeyi kapalı tutar. `/think high|xhigh|max` ile uyarlamalı düşünmeyi açıkça etkinleştirdiğinizde OpenClaw, Anthropic'in Opus 4.8 çaba değerlerini gönderir; Claude 4.6 modelleri varsayılan olarak `adaptive` kullanır.

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
İlgili Anthropic dokümanları:
- [Uyarlamalı düşünme](https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking)
- [Genişletilmiş düşünme](https://platform.claude.com/docs/en/build-with-claude/extended-thinking)

</Note>

## Prompt önbelleğe alma

OpenClaw, API anahtarı kimlik doğrulaması için Anthropic'in prompt önbelleğe alma özelliğini destekler.

| Değer               | Önbellek süresi | Açıklama                              |
| ------------------- | -------------- | ------------------------------------ |
| `"short"` (varsayılan) | 5 dakika       | API anahtarı kimlik doğrulaması için otomatik uygulanır |
| `"long"`            | 1 saat         | Genişletilmiş önbellek               |
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
  <Accordion title="Per-agent cache overrides">
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

    Bu, aynı modeldeki başka bir ajanın ani/az yeniden kullanılan trafik için önbelleğe almayı devre dışı bırakırken bir ajanın uzun ömürlü önbelleği korumasını sağlar.

  </Accordion>

  <Accordion title="Bedrock Claude notes">
    - Bedrock üzerindeki Anthropic Claude modelleri (`amazon-bedrock/*anthropic.claude*`) yapılandırıldığında `cacheRetention` geçişini kabul eder.
    - Anthropic olmayan Bedrock modelleri çalışma zamanında `cacheRetention: "none"` değerine zorlanır.
    - API anahtarı akıllı varsayılanları, açık bir değer ayarlanmadığında Claude-on-Bedrock referansları için `cacheRetention: "short"` değerini de başlangıç olarak kullanır.

  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Fast mode">
    OpenClaw'ın paylaşılan `/fast` anahtarı, doğrudan Anthropic trafiğini destekler (API anahtarı ve `api.anthropic.com` için OAuth).

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
    - Priority Tier kapasitesi olmayan hesaplarda `service_tier: "auto"` `standard` değerine çözümlenebilir.

    </Note>

  </Accordion>

  <Accordion title="Media understanding (image and PDF)">
    Paketlenen Anthropic Plugin, görüntü ve PDF anlamayı kaydeder. OpenClaw
    medya yeteneklerini yapılandırılmış Anthropic kimlik doğrulamasından otomatik çözümler; ek
    yapılandırma gerekmez.

    | Özellik        | Değer                 |
    | --------------- | --------------------- |
    | Varsayılan model | `claude-opus-4-8`     |
    | Desteklenen girdi | Görseller, PDF belgeleri |

    Bir konuşmaya görsel veya PDF eklendiğinde OpenClaw bunu otomatik olarak
    Anthropic medya anlama sağlayıcısı üzerinden yönlendirir.

  </Accordion>

  <Accordion title="1M context window">
    Anthropic'in 1M bağlam penceresi, Opus 4.8, Opus 4.7, Opus 4.6 ve Sonnet 4.6 gibi
    GA yetenekli Claude 4.x modellerinde kullanılabilir. OpenClaw bu modelleri
    otomatik olarak 1M boyutlandırır:

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

    Eski yapılandırmalar `params.context1m: true` değerini koruyabilir, ancak OpenClaw artık
    kullanımdan kaldırılmış `context-1m-2025-08-07` beta başlığını göndermez. Bu değere sahip eski `anthropicBeta` yapılandırma
    girdileri istek başlığı çözümlemesi sırasında yok sayılır ve desteklenmeyen eski Claude modelleri normal bağlam pencerelerinde kalır.

    `params.context1m: true`, uygun GA yetenekli Opus ve Sonnet modelleri için Claude CLI arka ucuna
    (`claude-cli/*`) da uygulanır; böylece bu CLI oturumlarının çalışma zamanı bağlam penceresi doğrudan API
    davranışıyla eşleşecek şekilde korunur.

    <Warning>
    Anthropic kimlik bilgilerinizde uzun bağlam erişimi gerektirir. OAuth/abonelik token kimlik doğrulaması gerekli Anthropic beta başlıklarını korur, ancak OpenClaw eski yapılandırmada kalmışsa kullanımdan kaldırılmış 1M beta başlığını çıkarır.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.8 1M context">
    `anthropic/claude-opus-4-8` ve onun `claude-cli` varyantı varsayılan olarak 1M bağlam
    penceresine sahiptir; `params.context1m: true` gerekmez.
  </Accordion>
</AccordionGroup>

## Sorun Giderme

<AccordionGroup>
  <Accordion title="401 errors / token suddenly invalid">
    Anthropic token kimlik doğrulamasının süresi dolar ve iptal edilebilir. Yeni kurulumlar için bunun yerine bir Anthropic API anahtarı kullanın.
  </Accordion>

  <Accordion title='No API key found for provider "anthropic"'>
    Anthropic kimlik doğrulaması **ajan başınadır**; yeni ajanlar ana ajanın anahtarlarını devralmaz. Bu ajan için onboarding işlemini yeniden çalıştırın (veya gateway ana makinesinde bir API anahtarı yapılandırın), ardından `openclaw models status` ile doğrulayın.
  </Accordion>

  <Accordion title='No credentials found for profile "anthropic:default"'>
    Hangi kimlik doğrulama profilinin etkin olduğunu görmek için `openclaw models status` çalıştırın. Onboarding işlemini yeniden çalıştırın veya bu profil yolu için bir API anahtarı yapılandırın.
  </Accordion>

  <Accordion title="No available auth profile (all in cooldown)">
    `auth.unusableProfiles` için `openclaw models status --json` çıktısını kontrol edin. Anthropic hız sınırı bekleme süreleri model kapsamlı olabilir, bu nedenle kardeş bir Anthropic modeli hâlâ kullanılabilir olabilir. Başka bir Anthropic profili ekleyin veya bekleme süresinin bitmesini bekleyin.
  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun Giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model selection" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="CLI backends" href="/tr/gateway/cli-backends" icon="terminal">
    Claude CLI backend kurulumu ve çalışma zamanı ayrıntıları.
  </Card>
  <Card title="Prompt caching" href="/tr/reference/prompt-caching" icon="database">
    Prompt önbelleğe almanın sağlayıcılar arasında nasıl çalıştığı.
  </Card>
  <Card title="OAuth and auth" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
