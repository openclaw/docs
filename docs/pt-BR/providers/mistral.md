---
read_when:
    - Você quer usar modelos Mistral no OpenClaw
    - Você quer transcrição em tempo real do Voxtral para Chamada de Voz
    - Você precisa da configuração inicial da chave de API da Mistral e de referências de modelos
summary: Use modelos Mistral e a transcrição Voxtral com o OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-06T09:11:15Z"
    model: gpt-5.5
    provider: openai
    source_hash: fb55915526e292210df61b646e1bbcdb2da86a0e46ea4bd5afd63d244f8da71a
    source_path: providers/mistral.md
    workflow: 16
---

OpenClaw inclui um Plugin Mistral integrado que registra quatro contratos: conclusões de chat, compreensão de mídia (transcrição em lote Voxtral), STT em tempo real para Chamada de voz (Voxtral Realtime) e embeddings de memória (`mistral-embed`).

| Propriedade        | Valor                                       |
| ------------------ | ------------------------------------------- |
| ID do provedor     | `mistral`                                   |
| Plugin             | integrado, `enabledByDefault: true`         |
| Variável env de autenticação | `MISTRAL_API_KEY`                  |
| Sinalizador de onboarding | `--auth-choice mistral-api-key`       |
| Sinalizador direto da CLI | `--mistral-api-key <key>`             |
| API                | compatível com OpenAI (`openai-completions`) |
| URL base           | `https://api.mistral.ai/v1`                 |
| Modelo padrão      | `mistral/mistral-large-latest`              |
| Modelo de embedding | `mistral-embed`                            |
| Voxtral em lote    | `voxtral-mini-latest` (transcrição de áudio) |
| Voxtral em tempo real | `voxtral-mini-transcribe-realtime-2602`  |

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

Atualmente, o OpenClaw inclui este catálogo Mistral integrado:

| Referência do modelo              | Entrada      | Contexto | Saída máxima | Observações                                                      |
| --------------------------------- | ------------ | -------- | ------------ | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`    | texto, imagem | 262,144 | 16,384       | Modelo padrão                                                    |
| `mistral/mistral-medium-2508`     | texto, imagem | 262,144 | 8,192        | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`    | texto, imagem | 128,000 | 16,384       | Mistral Small 4; raciocínio ajustável via API `reasoning_effort` |
| `mistral/pixtral-large-latest`    | texto, imagem | 128,000 | 32,768       | Pixtral                                                          |
| `mistral/codestral-latest`        | texto        | 256,000 | 4,096        | Codificação                                                      |
| `mistral/devstral-medium-latest`  | texto        | 262,144 | 32,768       | Devstral 2                                                       |
| `mistral/magistral-small`         | texto        | 128,000 | 40,000       | Com raciocínio habilitado                                        |

## Transcrição de áudio (Voxtral)

Use Voxtral para transcrição de áudio em lote por meio do pipeline de
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
O caminho de transcrição de mídia usa `/v1/audio/transcriptions`. O modelo de áudio padrão para Mistral é `voxtral-mini-latest`.
</Tip>

## STT de streaming para Chamada de voz

O Plugin `mistral` integrado registra Voxtral Realtime como um provedor de STT de
streaming para Chamada de voz.

| Configuração | Caminho de configuração                                              | Padrão                                  |
| ------------ | -------------------------------------------------------------------- | --------------------------------------- |
| Chave de API | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Usa `MISTRAL_API_KEY` como fallback     |
| Modelo       | `...mistral.model`                                                   | `voxtral-mini-transcribe-realtime-2602` |
| Codificação  | `...mistral.encoding`                                                | `pcm_mulaw`                             |
| Taxa de amostragem | `...mistral.sampleRate`                                        | `8000`                                  |
| Atraso alvo  | `...mistral.targetStreamingDelayMs`                                  | `800`                                   |

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
O OpenClaw usa por padrão STT em tempo real da Mistral com `pcm_mulaw` a 8 kHz para que a Chamada de voz
possa encaminhar quadros de mídia da Twilio diretamente. Use `encoding: "pcm_s16le"` e uma
`sampleRate` correspondente somente se o seu stream upstream já for PCM bruto.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Raciocínio ajustável (mistral-small-latest)">
    `mistral/mistral-small-latest` mapeia para Mistral Small 4 e oferece suporte a [raciocínio ajustável](https://docs.mistral.ai/capabilities/reasoning/adjustable) na API Chat Completions via `reasoning_effort` (`none` minimiza pensamento extra na saída; `high` expõe rastros completos de pensamento antes da resposta final).

    O OpenClaw mapeia o nível de **thinking** da sessão para a API da Mistral:

    | Nível de thinking do OpenClaw                     | `reasoning_effort` da Mistral |
    | ------------------------------------------------ | ----------------------------- |
    | **off** / **minimal**                            | `none`                        |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Note>
    Outros modelos do catálogo Mistral integrado não usam este parâmetro. Continue usando modelos `magistral-*` quando quiser o comportamento nativo da Mistral com prioridade para raciocínio.
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
    - A autenticação da Mistral usa `MISTRAL_API_KEY` (cabeçalho Bearer).
    - A URL base do provedor usa `https://api.mistral.ai/v1` por padrão e aceita o formato de solicitação padrão de conclusões de chat compatível com OpenAI.
    - O modelo padrão de onboarding é `mistral/mistral-large-latest`.
    - Substitua a URL base em `models.providers.mistral.baseUrl` somente quando a Mistral publicar explicitamente um endpoint regional de que você precise.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Compreensão de mídia" href="/pt-BR/nodes/media-understanding" icon="microphone">
    Configuração de transcrição de áudio e seleção de provedor.
  </Card>
</CardGroup>
