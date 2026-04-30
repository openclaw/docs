---
read_when:
    - OpenClaw'u bir LiteLLM vekil sunucusu üzerinden yönlendirmek istiyorsunuz
    - Maliyet takibine, günlüklemeye veya LiteLLM üzerinden model yönlendirmeye ihtiyacınız var
summary: Birleşik model erişimi ve maliyet takibi için OpenClaw'ı LiteLLM Proxy üzerinden çalıştırın
title: LiteLLM
x-i18n:
    generated_at: "2026-04-30T09:40:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 26b5150cfca92c9cd425c864c711efb3ab62ef94377b9d1e5d6476b07bf4c800
    source_path: providers/litellm.md
    workflow: 16
---

[LiteLLM](https://litellm.ai), 100+ model sağlayıcısına birleşik API sunan açık kaynaklı bir LLM Gateway’idir. Merkezi maliyet takibi, günlükleme ve OpenClaw yapılandırmanızı değiştirmeden arka uçlar arasında geçiş esnekliği elde etmek için OpenClaw’ı LiteLLM üzerinden yönlendirin.

<Tip>
**OpenClaw ile LiteLLM neden kullanılır?**

- **Maliyet takibi** — OpenClaw’ın tüm modellerde tam olarak ne harcadığını görün
- **Model yönlendirme** — Yapılandırma değişiklikleri olmadan Claude, GPT-4, Gemini, Bedrock arasında geçiş yapın
- **Sanal anahtarlar** — OpenClaw için harcama limitli anahtarlar oluşturun
- **Günlükleme** — Hata ayıklama için tam istek/yanıt günlükleri
- **Geri dönüşler** — Birincil sağlayıcınız devre dışıysa otomatik yük devretme

</Tip>

## Hızlı başlangıç

<Tabs>
  <Tab title="Başlangıç kurulumu (önerilir)">
    **Şunun için en iyisi:** çalışan bir LiteLLM kurulumuna en hızlı yol.

    <Steps>
      <Step title="Başlangıç kurulumunu çalıştırın">
        ```bash
        openclaw onboard --auth-choice litellm-api-key
        ```

        Uzak bir proxy’ye karşı etkileşimsiz kurulum için proxy URL’sini açıkça iletin:

        ```bash
        openclaw onboard --non-interactive --auth-choice litellm-api-key --litellm-api-key "$LITELLM_API_KEY" --custom-base-url "https://litellm.example/v1"
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Manuel kurulum">
    **Şunun için en iyisi:** kurulum ve yapılandırma üzerinde tam denetim.

    <Steps>
      <Step title="LiteLLM Proxy’yi başlatın">
        ```bash
        pip install 'litellm[proxy]'
        litellm --model claude-opus-4-6
        ```
      </Step>
      <Step title="OpenClaw’ı LiteLLM’e yönlendirin">
        ```bash
        export LITELLM_API_KEY="your-litellm-key"

        openclaw
        ```

        Hepsi bu. OpenClaw artık LiteLLM üzerinden yönlendirilir.
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

## Gelişmiş yapılandırma

### Görsel üretimi

LiteLLM, OpenAI uyumlu `/images/generations` ve `/images/edits` rotaları üzerinden
`image_generate` aracını da destekleyebilir. `agents.defaults.imageGenerationModel`
altında bir LiteLLM görsel modeli yapılandırın:

```json5
{
  models: {
    providers: {
      litellm: {
        baseUrl: "http://localhost:4000",
        apiKey: "${LITELLM_API_KEY}",
      },
    },
  },
  agents: {
    defaults: {
      imageGenerationModel: {
        primary: "litellm/gpt-image-2",
        timeoutMs: 180_000,
      },
    },
  },
}
```

`http://localhost:4000` gibi loopback LiteLLM URL’leri genel bir özel ağ
geçersiz kılması olmadan çalışır. LAN’da barındırılan bir proxy için
`models.providers.litellm.request.allowPrivateNetwork: true` ayarını yapın; çünkü API anahtarı
yapılandırılmış proxy ana makinesine gönderilecektir.

<AccordionGroup>
  <Accordion title="Sanal anahtarlar">
    OpenClaw için harcama limitleri olan özel bir anahtar oluşturun:

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

    Üretilen anahtarı `LITELLM_API_KEY` olarak kullanın.

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
    LiteLLM’in panosunu veya API’sini kontrol edin:

    ```bash
    # Key info
    curl "http://localhost:4000/key/info" \
      -H "Authorization: Bearer sk-litellm-key"

    # Spend logs
    curl "http://localhost:4000/spend/logs" \
      -H "Authorization: Bearer $LITELLM_MASTER_KEY"
    ```

  </Accordion>

  <Accordion title="Proxy davranışı notları">
    - LiteLLM varsayılan olarak `http://localhost:4000` üzerinde çalışır
    - OpenClaw, LiteLLM’in proxy tarzı OpenAI uyumlu `/v1`
      uç noktası üzerinden bağlanır
    - Yerel OpenAI’ye özel istek biçimlendirmesi LiteLLM üzerinden uygulanmaz:
      `service_tier` yok, Responses `store` yok, prompt cache ipuçları yok ve
      OpenAI reasoning uyumluluk yükü biçimlendirmesi yok
    - Gizli OpenClaw atıf başlıkları (`originator`, `version`, `User-Agent`)
      özel LiteLLM temel URL’lerine eklenmez
  </Accordion>
</AccordionGroup>

<Note>
Genel sağlayıcı yapılandırması ve yük devretme davranışı için bkz. [Model Sağlayıcıları](/tr/concepts/model-providers).
</Note>

## İlgili

<CardGroup cols={2}>
  <Card title="LiteLLM Belgeleri" href="https://docs.litellm.ai" icon="book">
    Resmi LiteLLM belgeleri ve API başvurusu.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/model-providers" icon="layers">
    Tüm sağlayıcılara, model referanslarına ve yük devretme davranışına genel bakış.
  </Card>
  <Card title="Yapılandırma" href="/tr/gateway/configuration" icon="gear">
    Tam yapılandırma başvurusu.
  </Card>
  <Card title="Model seçimi" href="/tr/concepts/models" icon="brain">
    Modellerin nasıl seçileceği ve yapılandırılacağı.
  </Card>
</CardGroup>
