---
read_when:
    - OpenClaw'da Anthropic modellerini kullanmak istiyorsunuz
summary: OpenClaw'da API anahtarları veya Claude CLI aracılığıyla Anthropic Claude kullanın
title: Anthropic
x-i18n:
    generated_at: "2026-04-24T09:24:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: 9db63fd33dce27b18f5807c995d9ce71b9d14fde55064f745bace31d7991b985
    source_path: providers/anthropic.md
    workflow: 15
---

# Anthropic (Claude)

Anthropic, **Claude** model ailesini geliştirir. OpenClaw iki kimlik doğrulama yolunu destekler:

- **API key** — kullanım bazlı faturalandırmayla doğrudan Anthropic API erişimi (`anthropic/*` modelleri)
- **Claude CLI** — aynı ana makinede mevcut bir Claude CLI oturumunu yeniden kullanın

<Warning>
Anthropic çalışanları bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi, bu yüzden
Anthropic yeni bir politika yayımlamadığı sürece OpenClaw, Claude CLI yeniden kullanımını ve `claude -p` kullanımını
onaylanmış olarak değerlendirir.

Uzun ömürlü Gateway ana makineleri için Anthropic API key'leri hâlâ en açık ve
öngörülebilir üretim yoludur.

Anthropic'in güncel herkese açık belgeleri:

- [Claude Code CLI reference](https://code.claude.com/docs/en/cli-reference)
- [Claude Agent SDK overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Using Claude Code with your Pro or Max plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
- [Using Claude Code with your Team or Enterprise plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/)

</Warning>

## Başlarken

<Tabs>
  <Tab title="API key">
    **Şunlar için en uygunu:** standart API erişimi ve kullanım bazlı faturalandırma.

    <Steps>
      <Step title="API key'inizi alın">
        [Anthropic Console](https://console.anthropic.com/) içinde bir API key oluşturun.
      </Step>
      <Step title="Onboarding'i çalıştırın">
        ```bash
        openclaw onboard
        # seçin: Anthropic API key
        ```

        Veya anahtarı doğrudan iletin:

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
    **Şunlar için en uygunu:** ayrı bir API key olmadan mevcut bir Claude CLI oturumunu yeniden kullanmak.

    <Steps>
      <Step title="Claude CLI'nin kurulu ve oturum açılmış olduğundan emin olun">
        Şununla doğrulayın:

        ```bash
        claude --version
        ```
      </Step>
      <Step title="Onboarding'i çalıştırın">
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
    Claude CLI arka ucuna ilişkin kurulum ve çalışma zamanı ayrıntıları [CLI Backends](/tr/gateway/cli-backends) bölümündedir.
    </Note>

    <Tip>
    En açık faturalandırma yolunu istiyorsanız bunun yerine bir Anthropic API key kullanın. OpenClaw ayrıca [OpenAI Codex](/tr/providers/openai), [Qwen Cloud](/tr/providers/qwen), [MiniMax](/tr/providers/minimax) ve [Z.AI / GLM](/tr/providers/glm) için abonelik tarzı seçenekleri de destekler.
    </Tip>

  </Tab>
</Tabs>

## Thinking varsayılanları (Claude 4.6)

Claude 4.6 modelleri, açık bir thinking düzeyi ayarlanmadığında OpenClaw'da varsayılan olarak `adaptive` kullanır.

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

| Değer               | Önbellek süresi | Açıklama                              |
| ------------------- | --------------- | ------------------------------------- |
| `"short"` (varsayılan) | 5 dakika      | API key kimlik doğrulaması için otomatik uygulanır |
| `"long"`            | 1 saat          | Genişletilmiş önbellek                |
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
    Temeliniz olarak model düzeyindeki parametreleri kullanın, ardından belirli ajanları `agents.list[].params` üzerinden geçersiz kılın:

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
    2. `agents.list[].params` (`id` eşleşir, anahtara göre geçersiz kılar)

    Bu, bir ajanın uzun ömürlü bir önbellek tutmasına, aynı modeldeki başka bir ajanın ise ani/düşük yeniden kullanım trafiği için önbelleği devre dışı bırakmasına olanak tanır.

  </Accordion>

  <Accordion title="Bedrock Claude notları">
    - Bedrock üzerindeki Anthropic Claude modelleri (`amazon-bedrock/*anthropic.claude*`), yapılandırıldığında `cacheRetention` geçişini kabul eder.
    - Anthropic dışındaki Bedrock modelleri çalışma zamanında zorunlu olarak `cacheRetention: "none"` olur.
    - API key akıllı varsayılanları ayrıca açık bir değer ayarlanmadığında Bedrock üzerindeki Claude başvuruları için `cacheRetention: "short"` değeri de ekler.
  </Accordion>
</AccordionGroup>

## Gelişmiş yapılandırma

<AccordionGroup>
  <Accordion title="Hızlı mod">
    OpenClaw'ın paylaşılan `/fast` anahtarı, doğrudan Anthropic trafiğini (`api.anthropic.com` için API key ve OAuth) destekler.

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
    - Yalnızca doğrudan `api.anthropic.com` istekleri için eklenir. Proxy rotaları `service_tier` alanını değiştirmez.
    - Açık `serviceTier` veya `service_tier` parametreleri, ikisi birden ayarlandığında `/fast` değerini geçersiz kılar.
    - Priority Tier kapasitesi olmayan hesaplarda `service_tier: "auto"` değeri `standard` olarak çözümlenebilir.
    </Note>

  </Accordion>

  <Accordion title="Medya anlama (görsel ve PDF)">
    Paketlenmiş Anthropic Plugin'i görsel ve PDF anlama özelliğini kaydeder. OpenClaw,
    yapılandırılmış Anthropic kimlik doğrulamasından medya yeteneklerini otomatik olarak çözümler —
    ek yapılandırma gerekmez.

    | Özellik       | Değer                |
    | -------------- | -------------------- |
    | Varsayılan model  | `claude-opus-4-6`    |
    | Desteklenen girdi | Görseller, PDF belgeleri |

    Bir konuşmaya görsel veya PDF eklendiğinde OpenClaw bunu otomatik olarak
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
    Anthropic kimlik bilginizde uzun bağlam erişimi gerektirir. Eski belirteç kimlik doğrulaması (`sk-ant-oat-*`) 1M bağlam istekleri için reddedilir — OpenClaw bir uyarı günlüğe kaydeder ve standart bağlam penceresine geri döner.
    </Warning>

  </Accordion>

  <Accordion title="Claude Opus 4.7 1M bağlam">
    `anthropic/claude-opus-4.7` ve onun `claude-cli` varyantı varsayılan olarak 1M bağlam
    penceresine sahiptir — `params.context1m: true` gerekmez.
  </Accordion>
</AccordionGroup>

## Sorun giderme

<AccordionGroup>
  <Accordion title="401 hataları / belirteç aniden geçersiz">
    Anthropic belirteç kimlik doğrulamasının süresi dolar ve iptal edilebilir. Yeni kurulumlar için bunun yerine bir Anthropic API key kullanın.
  </Accordion>

  <Accordion title='Sağlayıcı "anthropic" için API key bulunamadı'>
    Anthropic kimlik doğrulaması **ajan başınadır** — yeni ajanlar ana ajanın anahtarlarını devralmaz. Bu ajan için onboarding'i yeniden çalıştırın (veya Gateway ana makinesinde bir API key yapılandırın), sonra `openclaw models status` ile doğrulayın.
  </Accordion>

  <Accordion title='Profil "anthropic:default" için kimlik bilgisi bulunamadı'>
    Hangi kimlik doğrulama profilinin etkin olduğunu görmek için `openclaw models status` komutunu çalıştırın. Onboarding'i yeniden çalıştırın veya bu profil yolu için bir API key yapılandırın.
  </Accordion>

  <Accordion title="Kullanılabilir kimlik doğrulama profili yok (hepsi bekleme süresinde)">
    `auth.unusableProfiles` değerini görmek için `openclaw models status --json` komutunu denetleyin. Anthropic hız sınırı bekleme süreleri model kapsamlı olabilir, bu nedenle kardeş bir Anthropic modeli yine de kullanılabilir olabilir. Başka bir Anthropic profili ekleyin veya bekleme süresinin bitmesini bekleyin.
  </Accordion>
</AccordionGroup>

<Note>
Daha fazla yardım: [Sorun Giderme](/tr/help/troubleshooting) ve [SSS](/tr/help/faq).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Sağlayıcıları, model başvurularını ve failover davranışını seçme.
  </Card>
  <Card title="CLI arka uçları" href="/tr/gateway/cli-backends" icon="terminal">
    Claude CLI arka ucu kurulumu ve çalışma zamanı ayrıntıları.
  </Card>
  <Card title="Prompt caching" href="/tr/reference/prompt-caching" icon="database">
    Prompt caching'in sağlayıcılar arasında nasıl çalıştığı.
  </Card>
  <Card title="OAuth ve kimlik doğrulama" href="/tr/gateway/authentication" icon="key">
    Kimlik doğrulama ayrıntıları ve kimlik bilgisi yeniden kullanım kuralları.
  </Card>
</CardGroup>
