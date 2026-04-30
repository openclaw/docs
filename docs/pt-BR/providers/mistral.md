---
read_when:
    - Você quer usar modelos Mistral no OpenClaw
    - Você quer transcrição em tempo real do Voxtral para chamada de voz
    - Você precisa da integração da chave de API da Mistral e das referências de modelos
summary: Use modelos Mistral e a transcrição Voxtral com o OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-30T10:05:12Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fdba72a5a526bed78ef3a6ea633839634efca3f9d2e96b305315d534d115122
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw oferece suporte à Mistral tanto para roteamento de modelos de texto/imagem (`mistral/...`) quanto para
transcrição de áudio via Voxtral na compreensão de mídia.
A Mistral também pode ser usada para embeddings de memória (`memorySearch.provider = "mistral"`).

- Provedor: `mistral`
- Autenticação: `MISTRAL_API_KEY`
- API: Chat Completions da Mistral (`https://api.mistral.ai/v1`)

## Primeiros passos

<Steps>
  <Step title="Obtenha sua chave de API">
    Crie uma chave de API no [Console da Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Execute o onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Ou passe a chave diretamente:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Defina um modelo padrão">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verifique se o modelo está disponível">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Catálogo de LLM integrado

Atualmente, o OpenClaw inclui este catálogo integrado da Mistral:

| Referência do modelo             | Entrada     | Contexto | Saída máxima | Observações                                                      |
| -------------------------------- | ----------- | -------- | ------------ | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | texto, imagem | 262,144 | 16,384     | Modelo padrão                                                    |
| `mistral/mistral-medium-2508`    | texto, imagem | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | texto, imagem | 128,000 | 16,384     | Mistral Small 4; raciocínio ajustável via API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | texto, imagem | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | texto        | 256,000 | 4,096      | Programação                                                      |
| `mistral/devstral-medium-latest` | texto        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | texto        | 128,000 | 40,000     | Com raciocínio habilitado                                        |

## Transcrição de áudio (Voxtral)

Use o Voxtral para transcrição de áudio em lote por meio do pipeline de
compreensão de mídia.

```json5
{
  tools: {
    media: {
      audio: {
        enabled: true,
        models: [{ provider: "mistral", model: "voxtral-mini-latest" }],
      },
    },
  },
}
```

<Tip>
O caminho de transcrição de mídia usa `/v1/audio/transcriptions`. O modelo de áudio padrão para a Mistral é `voxtral-mini-latest`.
</Tip>

## STT de streaming de Voice Call

O Plugin `mistral` integrado registra o Voxtral Realtime como provedor de STT
de streaming para Voice Call.

| Configuração | Caminho de configuração                                              | Padrão                                  |
| ------------ | ---------------------------------------------------------------------- | --------------------------------------- |
| Chave de API | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Usa `MISTRAL_API_KEY` como fallback     |
| Modelo       | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Codificação  | `...mistral.encoding`                                                  | `pcm_mulaw`                             |
| Taxa de amostragem | `...mistral.sampleRate`                                         | `8000`                                  |
| Atraso alvo  | `...mistral.targetStreamingDelayMs`                                    | `800`                                   |

```json5
{
  plugins: {
    entries: {
      "voice-call": {
        config: {
          streaming: {
            enabled: true,
            provider: "mistral",
            providers: {
              mistral: {
                apiKey: "${MISTRAL_API_KEY}",
                targetStreamingDelayMs: 800,
              },
            },
          },
        },
      },
    },
  },
}
```

<Note>
O OpenClaw usa `pcm_mulaw` a 8 kHz como padrão para STT em tempo real da Mistral, para que o Voice Call
possa encaminhar frames de mídia do Twilio diretamente. Use `encoding: "pcm_s16le"` e uma
`sampleRate` correspondente somente se o stream upstream já estiver em PCM bruto.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Raciocínio ajustável (mistral-small-latest)">
    `mistral/mistral-small-latest` mapeia para o Mistral Small 4 e oferece suporte a [raciocínio ajustável](https://docs.mistral.ai/capabilities/reasoning/adjustable) na API Chat Completions via `reasoning_effort` (`none` minimiza pensamento extra na saída; `high` mostra rastros completos de pensamento antes da resposta final).

    O OpenClaw mapeia o nível de **thinking** da sessão para a API da Mistral:

    | Nível de thinking do OpenClaw                  | `reasoning_effort` da Mistral |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Outros modelos do catálogo integrado da Mistral não usam esse parâmetro. Continue usando modelos `magistral-*` quando quiser o comportamento nativo da Mistral com raciocínio em primeiro lugar.
    </Note>

  </Accordion>

  <Accordion title="Embeddings de memória">
    A Mistral pode fornecer embeddings de memória via `/v1/embeddings` (modelo padrão: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Autenticação e URL base">
    - A autenticação da Mistral usa `MISTRAL_API_KEY`.
    - A URL base do provedor usa `https://api.mistral.ai/v1` por padrão.
    - O modelo padrão do onboarding é `mistral/mistral-large-latest`.
    - A Z.AI usa autenticação Bearer com sua chave de API.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Compreensão de mídia" href="/pt-BR/nodes/media-understanding" icon="microphone">
    Configuração de transcrição de áudio e seleção de provedor.
  </Card>
</CardGroup>
