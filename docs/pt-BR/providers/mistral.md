---
read_when:
    - Você quer usar modelos Mistral no OpenClaw
    - Você quer transcrição em tempo real do Voxtral para Voice Call
    - Você precisa de onboarding com chave de API do Mistral e refs de modelo
summary: Use modelos Mistral e transcrição Voxtral com o OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-23T14:06:34Z"
    model: gpt-5.4
    provider: openai
    source_hash: cbf2f8926a1e8c877a12ea395e96622ff3b337ffa1368277c03abbfb881b18cf
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

O OpenClaw oferece suporte ao Mistral tanto para roteamento de modelos de texto/imagem (`mistral/...`) quanto para
transcrição de áudio via Voxtral em entendimento de mídia.
O Mistral também pode ser usado para embeddings de memória (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Autenticação: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Introdução

<Steps>
  <Step title="Obtenha sua chave de API">
    Crie uma chave de API no [Mistral Console](https://console.mistral.ai/).
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

## Catálogo LLM incluído no pacote

Atualmente, o OpenClaw inclui este catálogo Mistral integrado:

| Ref de modelo                    | Entrada     | Contexto | Saída máx. | Observações                                                      |
| -------------------------------- | ----------- | -------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | texto, imagem | 262,144 | 16,384     | Modelo padrão                                                    |
| `mistral/mistral-medium-2508`    | texto, imagem | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | texto, imagem | 128,000 | 16,384     | Mistral Small 4; reasoning ajustável via API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | texto, imagem | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | texto       | 256,000 | 4,096      | Código                                                           |
| `mistral/devstral-medium-latest` | texto       | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | texto       | 128,000 | 40,000     | Com reasoning ativado                                            |

## Transcrição de áudio (Voxtral)

Use o Voxtral para transcrição de áudio em lote por meio do pipeline de
entendimento de mídia.

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
O caminho de transcrição de mídia usa `/v1/audio/transcriptions`. O modelo de áudio padrão do Mistral é `voxtral-mini-latest`.
</Tip>

## STT de streaming do Voice Call

O Plugin `mistral` incluído no pacote registra o Voxtral Realtime como provider de
STT de streaming do Voice Call.

| Configuração   | Caminho de config                                                      | Padrão                                 |
| -------------- | ---------------------------------------------------------------------- | -------------------------------------- |
| Chave de API   | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Usa fallback para `MISTRAL_API_KEY`    |
| Modelo         | `...mistral.model`                                                     | `voxtral-mini-transcribe-realtime-2602` |
| Codificação    | `...mistral.encoding`                                                  | `pcm_mulaw`                            |
| Taxa de amostragem | `...mistral.sampleRate`                                            | `8000`                                 |
| Atraso alvo    | `...mistral.targetStreamingDelayMs`                                    | `800`                                  |

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
O OpenClaw usa por padrão STT em tempo real do Mistral com `pcm_mulaw` a 8 kHz para que o Voice Call
possa encaminhar frames de mídia do Twilio diretamente. Use `encoding: "pcm_s16le"` e uma
`sampleRate` correspondente apenas se seu stream upstream já for PCM bruto.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Reasoning ajustável (`mistral-small-latest`)">
    `mistral/mistral-small-latest` corresponde ao Mistral Small 4 e oferece suporte a [reasoning ajustável](https://docs.mistral.ai/capabilities/reasoning/adjustable) na API Chat Completions por meio de `reasoning_effort` (`none` minimiza raciocínio extra na saída; `high` expõe rastros completos de raciocínio antes da resposta final).

    O OpenClaw mapeia o nível de **thinking** da sessão para a API do Mistral:

    | Nível de thinking do OpenClaw                  | `reasoning_effort` do Mistral |
    | ---------------------------------------------- | ----------------------------- |
    | **off** / **minimal**                          | `none`                        |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`    |

    <Note>
    Outros modelos do catálogo Mistral incluído no pacote não usam esse parâmetro. Continue usando modelos `magistral-*` quando quiser o comportamento nativo do Mistral com foco em reasoning.
    </Note>

  </Accordion>

  <Accordion title="Embeddings de memória">
    O Mistral pode fornecer embeddings de memória via `/v1/embeddings` (modelo padrão: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Autenticação e URL base">
    - A autenticação do Mistral usa `MISTRAL_API_KEY`.
    - A URL base do provider usa por padrão `https://api.mistral.ai/v1`.
    - O modelo padrão do onboarding é `mistral/mistral-large-latest`.
    - O Z.AI usa autenticação Bearer com sua chave de API.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Entendimento de mídia" href="/pt-BR/nodes/media-understanding" icon="microphone">
    Configuração de transcrição de áudio e seleção de provider.
  </Card>
</CardGroup>
