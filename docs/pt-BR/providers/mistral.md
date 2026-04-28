---
read_when:
    - Você quer usar modelos Mistral no OpenClaw
    - Você quer transcrição Voxtral em tempo real para Voice Call
    - Você precisa de onboarding com chave de API da Mistral e refs de modelo
summary: Usar modelos Mistral e transcrição Voxtral com o OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-24T06:07:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: 63e1eb462f836f5ddc1afd0d01954080eee461230924368d77e2e57fef12caf1
    source_path: providers/mistral.md
    workflow: 15
---

O OpenClaw oferece suporte à Mistral tanto para roteamento de modelos de texto/imagem (`mistral/...`) quanto para
transcrição de áudio via Voxtral na compreensão de mídia.
A Mistral também pode ser usada para embeddings de memória (`memorySearch.provider = "mistral"`).

- Provider: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Primeiros passos

<Steps>
  <Step title="Obter sua chave de API">
    Crie uma chave de API no [Console da Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Executar o onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Ou passe a chave diretamente:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Definir um modelo padrão">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verificar se o modelo está disponível">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Catálogo integrado de LLM

Atualmente, o OpenClaw inclui este catálogo integrado da Mistral:

| Ref do modelo                     | Entrada     | Contexto | Saída máxima | Observações                                                      |
| --------------------------------- | ----------- | -------- | ------------ | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`    | text, image | 262,144  | 16,384       | Modelo padrão                                                    |
| `mistral/mistral-medium-2508`     | text, image | 262,144  | 8,192        | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`    | text, image | 128,000  | 16,384       | Mistral Small 4; reasoning ajustável via API `reasoning_effort` |
| `mistral/pixtral-large-latest`    | text, image | 128,000  | 32,768       | Pixtral                                                          |
| `mistral/codestral-latest`        | text        | 256,000  | 4,096        | Coding                                                           |
| `mistral/devstral-medium-latest`  | text        | 262,144  | 32,768       | Devstral 2                                                       |
| `mistral/magistral-small`         | text        | 128,000  | 40,000       | Com reasoning habilitado                                         |

## Transcrição de áudio (Voxtral)

Use Voxtral para transcrição em lote de áudio por meio do pipeline de
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
O caminho de transcrição de mídia usa `/v1/audio/transcriptions`. O modelo de áudio padrão da Mistral é `voxtral-mini-latest`.
</Tip>

## STT de streaming para Voice Call

O plugin integrado `mistral` registra Voxtral Realtime como provider de STT
em streaming do Voice Call.

| Configuração  | Caminho de config                                                       | Padrão                                  |
| ------------- | ----------------------------------------------------------------------- | --------------------------------------- |
| Chave de API  | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Usa `MISTRAL_API_KEY` como fallback     |
| Modelo        | `...mistral.model`                                                      | `voxtral-mini-transcribe-realtime-2602` |
| Encoding      | `...mistral.encoding`                                                   | `pcm_mulaw`                             |
| Sample rate   | `...mistral.sampleRate`                                                 | `8000`                                  |
| Delay alvo    | `...mistral.targetStreamingDelayMs`                                     | `800`                                   |

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
O OpenClaw usa por padrão STT realtime da Mistral com `pcm_mulaw` a 8 kHz, para que o Voice Call
possa encaminhar diretamente frames de mídia do Twilio. Use `encoding: "pcm_s16le"` e um
`sampleRate` correspondente apenas se seu stream upstream já estiver em PCM bruto.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Reasoning ajustável (mistral-small-latest)">
    `mistral/mistral-small-latest` mapeia para Mistral Small 4 e oferece suporte a [reasoning ajustável](https://docs.mistral.ai/capabilities/reasoning/adjustable) na API Chat Completions via `reasoning_effort` (`none` minimiza thinking extra na saída; `high` expõe rastros completos de thinking antes da resposta final).

    O OpenClaw mapeia o nível de **thinking** da sessão para a API da Mistral:

    | Nível de thinking do OpenClaw                 | `reasoning_effort` da Mistral |
    | --------------------------------------------- | ----------------------------- |
    | **off** / **minimal**                         | `none`                        |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Outros modelos do catálogo integrado da Mistral não usam esse parâmetro. Continue usando modelos `magistral-*` quando quiser o comportamento nativo da Mistral voltado primeiro para reasoning.
    </Note>

  </Accordion>

  <Accordion title="Embeddings de memória">
    A Mistral pode servir embeddings de memória via `/v1/embeddings` (modelo padrão: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth e base URL">
    - A autenticação da Mistral usa `MISTRAL_API_KEY`.
    - A base URL do provider usa por padrão `https://api.mistral.ai/v1`.
    - O modelo padrão do onboarding é `mistral/mistral-large-latest`.
    - Z.AI usa autenticação Bearer com sua chave de API.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Compreensão de mídia" href="/pt-BR/nodes/media-understanding" icon="microphone">
    Configuração de transcrição de áudio e seleção de provider.
  </Card>
</CardGroup>
