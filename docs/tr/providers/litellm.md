---
read_when:
    - OpenClaw’u bir LiteLLM proxy üzerinden yönlendirmek istiyorsunuz
    - LiteLLM üzerinden maliyet takibi, günlükleme veya model yönlendirmesine ihtiyacınız var
summary: Birleşik model erişimi ve maliyet takibi için OpenClaw’u LiteLLM Proxy üzerinden çalıştırın
title: LiteLLM
x-i18n:
    generated_at: "2026-04-12T23:31:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 766692eb83a1be83811d8e09a970697530ffdd4f3392247cfb2927fd590364a0
    source_path: providers/litellm.md
    workflow: 15
---

# LiteLLM

[LiteLLM](https://litellm.ai), 100’den fazla model sağlayıcısına birleşik bir API sunan açık kaynaklı bir LLM gateway’idir. Merkezi maliyet takibi, günlükleme ve OpenClaw yapılandırmanızı değiştirmeden arka uçlar arasında geçiş yapma esnekliği elde etmek için OpenClaw’u LiteLLM üzerinden yönlendirin.

<Tip>
**OpenClaw ile neden LiteLLM kullanmalısınız?**

- **Maliyet takibi** — OpenClaw’un tüm modeller genelinde tam olarak ne harcadığını görün
- **Model yönlendirme** — Yapılandırma değişikliği olmadan Claude, GPT-4, Gemini, Bedrock arasında geçiş yapın
- **Sanal anahtarlar** — OpenClaw için harcama limitli anahtarlar oluşturun
- **Günlükleme** — Hata ayıklama için tam istek/yanıt günlükleri
- **Geri dönüşler** — Birincil sağlayıcınız kapalıysa otomatik yük devretme
  </Tip>

## Hızlı başlangıç

<Tabs>
  <Tab title="Başlangıç kurulumu (önerilen)">
    **En iyisi:** çalışan bir LiteLLM kurulumu için en hızlı yol.

    <Steps>
      <Step title="Başlangıç kurulumunu çalıştırın">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manuel kurulum">
    **En iyisi:** kurulum ve yapılandırma üzerinde tam denetim.

    <Steps>
      <Step title="LiteLLM Proxy'yi başlatın">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="OpenClaw’u LiteLLM’ye yönlendirin">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        Hepsi bu kadar. OpenClaw artık LiteLLM üzerinden yönlendirilir.
      </Step>
    </Steps>

  </Tab>
</Tabs>

## Yapılandırma

### Ortam değişkenleri

```bash
export LITELLM_API_KEY="sk-litellm-key"
```

### Yapılandırma dosyası

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
        api: "openai-completions",
        models: [
          {
            id: "claude-opus-4-6",
            name: "Claude Opus 4.6",
            reasoning: true,
            input: ["text", "image"],
            contextWindow: 200000,
            maxTokens: 64000,
          },
          {
            id: "gpt-4o",
            name: "GPT-4o",
            reasoning: false,
            input: ["text", "image"],
            contextWindow: 128000,
            maxTokens: 8192,
          },
        ],
      },
    },
  },
  agents: {
    defaults: {
      model: { primary: "litellm/claude-opus-4-6" },
    },
  },
}
```

## Gelişmiş konular

<AccordionGroup>
  <Accordion title="Sanal anahtarlar">
    Harcama limitleriyle OpenClaw için özel bir anahtar oluşturun:

    ```bash
    curl -X POST "http://localhost:4000/key/generate" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY" \
      -H "Content-Type: application/json" \
      -d '{
        "key_alias": "openclaw",
        "max_budget": 50.00,
        "budget_duration": "monthly"
      }'
    ```

    Oluşturulan anahtarı `LITELLM_API_KEY` olarak kullanın.

  </Accordion>

  <Accordion title="Model yönlendirme">
    LiteLLM, model isteklerini farklı arka uçlara yönlendirebilir. LiteLLM `config.yaml` dosyanızda yapılandırın:

    ```yaml
    model_list:
      - model_name: claude-opus-4-6
        litellm_params:
          model: claude-opus-4-6
          api_key: os.environ/ANTHROPIC_API_KEY

      - model_name: gpt-4o
        litellm_params:
          model: gpt-4o
          api_key: os.environ/OPENAI_API_KEY
    ```

    OpenClaw `claude-opus-4-6` istemeye devam eder — yönlendirmeyi LiteLLM yönetir.

  </Accordion>

  <Accordion title="Kullanımı görüntüleme">
    LiteLLM’nin panosunu veya API’sini kontrol edin:

    ```bash
    # Anahtar bilgileri
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Harcama günlükleri
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy davranışı notları">
    - LiteLLM varsayılan olarak `http://localhost:4000` üzerinde çalışır
    - OpenClaw, LiteLLM’nin proxy tarzı OpenAI uyumlu `/v1`
      uç noktası üzerinden bağlanır
    - Yerel yalnızca OpenAI istek şekillendirmesi LiteLLM üzerinden uygulanmaz:
      `service_tier` yok, Responses `store` yok, prompt-cache ipuçları yok ve
      OpenAI reasoning-compat payload shaping yok
    - Gizli OpenClaw atıf üst bilgileri (`originator`, `version`, `User-Agent`)
      özel LiteLLM temel URL’lerine eklenmez
  </Accordion>
</AccordionGroup>

<Note>
Genel sağlayıcı yapılandırması ve yük devretme davranışı için [Model Providers](/tr/concepts/model-providers) bölümüne bakın.
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="LiteLLM Belgeleri" href="https://docs.litellm.ai" icon="book">
    Resmî LiteLLM belgeleri ve API başvurusu.
  </Card>
  <Card title="Model sağlayıcıları" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcıların, model referanslarının ve yük devretme davranışının genel görünümü.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam yapılandırma başvurusu.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modellerin nasıl seçileceği ve yapılandırılacağı.
  </Card>
</CardGroup>
