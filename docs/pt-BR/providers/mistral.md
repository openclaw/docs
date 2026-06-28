---
read_when:
    - Você quer usar modelos Mistral no OpenClaw
    - Você quer transcrição em tempo real do Voxtral para Chamada de voz
    - Você precisa da integração da chave de API da Mistral e das referências de modelo
summary: Use os modelos Mistral e a transcrição Voxtral com o OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-05-10T19:48:21Z"
    model: gpt-5.5
    provider: openai
    source_hash: 94c4caa86d4a3eb873d8b6a1cc639edbad3dd7478f401e2ca53f704de095f829
    source_path: providers/mistral.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw inclui um Plugin Mistral integrado que registra quatro contratos: preenchimentos de chat, compreensão de mídia (transcrição em lote Voxtral), STT em tempo real para Voice Call (Voxtral Realtime) e embeddings de memória (`mistral-embed`).

| Propriedade       | Valor                                       |
| ----------------- | ------------------------------------------- |
| ID do provedor    | `mistral`                                   |
| Plugin            | integrado, `enabledByDefault: true`         |
| Variável de ambiente de autenticação | `MISTRAL_API_KEY`       |
| Flag de onboarding | `--auth-choice mistral-api-key`            |
| Flag direta da CLI | `--mistral-api-key <key>`                  |
| API               | compatível com OpenAI (`openai-completions`) |
| URL base          | `https://api.mistral.ai/v1`                 |
| Modelo padrão     | `mistral/mistral-large-latest`              |
| Modelo de embedding | `mistral-embed`                           |
| Lote Voxtral      | `voxtral-mini-latest` (transcrição de áudio) |
| Voxtral em tempo real | `voxtral-mini-transcribe-realtime-2602` |

## Primeiros passos

<Steps>
  <Step title="Get your API key">
    Crie uma chave de API no [Mistral Console](https://console.mistral.ai/).
  </Step>
  <Step title="Run onboarding">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Ou passe a chave diretamente:

    ```bash
    openclaw onboard --mistral-api-key "$MISTRAL_API_KEY"
    ```

  </Step>
  <Step title="Set a default model">
    ```json5
    {
      env: { MISTRAL_API_KEY: "sk-..." },
      agents: { defaults: { model: { primary: "mistral/mistral-large-latest" } } },
    }
    ```
  </Step>
  <Step title="Verify the model is available">
    ```bash
    openclaw models list --provider mistral
    ```
  </Step>
</Steps>

## Catálogo de LLM integrado

[Mistral Medium 3.5](https://docs.mistral.ai/models/model-cards/mistral-medium-3-5-26-04)
é o modelo Medium combinado atual no catálogo integrado: pesos densos de 128B,
entrada de texto e imagem, contexto de 256K, chamada de função, saída estruturada, codificação
e raciocínio ajustável por meio da API Chat Completions. Use
`mistral/mistral-medium-3-5` quando quiser o modelo agentivo/de codificação unificado
mais recente da Mistral em vez do padrão `mistral/mistral-large-latest`.

Atualmente, o OpenClaw distribui este catálogo Mistral integrado:

| Ref. do modelo                   | Entrada     | Contexto | Saída máx. | Observações                                                      |
| -------------------------------- | ----------- | -------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | texto, imagem | 262,144 | 16,384     | Modelo padrão                                                    |
| `mistral/mistral-medium-2508`    | texto, imagem | 262,144 | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-medium-3-5`     | texto, imagem | 262,144 | 8,192      | Mistral Medium 3.5; raciocínio ajustável                         |
| `mistral/mistral-small-latest`   | texto, imagem | 128,000 | 16,384     | Mistral Small 4; raciocínio ajustável via API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | texto, imagem | 128,000 | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | texto        | 256,000 | 4,096      | Codificação                                                      |
| `mistral/devstral-medium-latest` | texto        | 262,144 | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | texto        | 128,000 | 40,000     | Com raciocínio habilitado                                        |

Após o onboarding, faça um teste rápido do Medium 3.5 sem iniciar o Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

Para navegar pela linha do catálogo integrado antes de alterar a configuração:

```bash
openclaw models list --all --provider mistral --plain
```

## Transcrição de áudio (Voxtral)

Use o Voxtral para transcrição de áudio em lote por meio do pipeline de compreensão de mídia.

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

## STT de streaming para Voice Call

O Plugin `mistral` integrado registra o Voxtral Realtime como um provedor de STT de streaming para Voice Call.

| Configuração | Caminho de configuração                                           | Padrão                                  |
| ------------ | ----------------------------------------------------------------- | --------------------------------------- |
| Chave de API | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey` | Usa `MISTRAL_API_KEY` como fallback |
| Modelo       | `...mistral.model`                                                | `voxtral-mini-transcribe-realtime-2602` |
| Codificação  | `...mistral.encoding`                                             | `pcm_mulaw`                             |
| Taxa de amostragem | `...mistral.sampleRate`                                      | `8000`                                  |
| Atraso alvo  | `...mistral.targetStreamingDelayMs`                               | `800`                                   |

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
O OpenClaw define por padrão o STT em tempo real da Mistral como `pcm_mulaw` a 8 kHz para que o Voice Call
possa encaminhar frames de mídia da Twilio diretamente. Use `encoding: "pcm_s16le"` e um
`sampleRate` correspondente somente se o seu stream upstream já for PCM bruto.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Adjustable reasoning">
    `mistral/mistral-small-latest` (Mistral Small 4) e `mistral/mistral-medium-3-5` oferecem suporte a [raciocínio ajustável](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) na API Chat Completions via `reasoning_effort` (`none` minimiza pensamento extra na saída; `high` expõe rastros completos de pensamento antes da resposta final). A Mistral recomenda `reasoning_effort="high"` para casos de uso agentivos e de código com Medium 3.5.

    O OpenClaw mapeia o nível de **thinking** da sessão para a API da Mistral:

    | Nível de thinking do OpenClaw                    | `reasoning_effort` da Mistral |
    | ------------------------------------------------ | ----------------------------- |
    | **off** / **minimal**                            | `none`                        |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** / **max** | `high`     |

    <Warning>
    Não combine o modo de raciocínio do Medium 3.5 com `temperature: 0`. A API HTTP
    da Mistral rejeita `reasoning_effort="high"` mais `temperature: 0` com uma resposta
    400. Deixe a temperatura sem definir para que a Mistral use o padrão, ou siga
    as [configurações recomendadas do Medium 3.5](https://huggingface.co/mistralai/Mistral-Medium-3.5-128B)
    e use `temperature: 0.7` para raciocínio alto. Para respostas diretas determinísticas,
    desative o thinking ou defina como minimal para que o OpenClaw envie
    `reasoning_effort: "none"` antes de reduzir a temperatura.
    </Warning>

    Exemplo de configuração com escopo de modelo para raciocínio do Medium 3.5:

    ```json5
    {
      agents: {
        defaults: {
          model: { primary: "mistral/mistral-medium-3-5" },
          models: {
            "mistral/mistral-medium-3-5": {
              params: { thinking: "high" },
            },
          },
        },
      },
    }
    ```

    <Note>
    Outros modelos do catálogo Mistral integrado não usam esse parâmetro. Continue usando modelos `magistral-*` quando quiser o comportamento nativo da Mistral com raciocínio em primeiro lugar.
    </Note>

  </Accordion>

  <Accordion title="Memory embeddings">
    A Mistral pode fornecer embeddings de memória via `/v1/embeddings` (modelo padrão: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth and base URL">
    - A autenticação da Mistral usa `MISTRAL_API_KEY` (cabeçalho Bearer).
    - A URL base do provedor usa `https://api.mistral.ai/v1` por padrão e aceita o formato padrão de solicitação de chat-completions compatível com OpenAI.
    - O modelo padrão de onboarding é `mistral/mistral-large-latest`.
    - Substitua a URL base em `models.providers.mistral.baseUrl` somente quando a Mistral publicar explicitamente um endpoint regional de que você precise.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Model selection" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Media understanding" href="/pt-BR/nodes/media-understanding" icon="microphone">
    Configuração de transcrição de áudio e seleção de provedor.
  </Card>
</CardGroup>
