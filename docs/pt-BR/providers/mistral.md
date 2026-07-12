---
read_when:
    - Você quer usar modelos da Mistral no OpenClaw
    - Você quer a transcrição em tempo real do Voxtral para chamadas de voz
    - Você precisa da integração da chave da API da Mistral e das referências de modelos
summary: Use modelos Mistral e a transcrição Voxtral com o OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-07-12T00:18:04Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 58f27b9917d2e7144a64cad559de4fe26a5a1101703bbe21c04252717df801cd
    source_path: providers/mistral.md
    workflow: 16
---

O Plugin `mistral` incluído registra quatro contratos: conclusões de chat, compreensão de mídia (transcrição em lote do Voxtral), STT em tempo real para Voice Call (Voxtral Realtime) e embeddings de memória (`mistral-embed`).

| Propriedade       | Valor                                       |
| ----------------- | ------------------------------------------- |
| ID do provedor    | `mistral`                                   |
| Plugin            | incluído, habilitado por padrão             |
| Var. de ambiente de autenticação | `MISTRAL_API_KEY`              |
| Flag de integração inicial | `--auth-choice mistral-api-key`      |
| Flag direta da CLI | `--mistral-api-key <key>`                  |
| API               | compatível com OpenAI (`openai-completions`) |
| URL base          | `https://api.mistral.ai/v1`                 |
| Modelo padrão     | `mistral/mistral-large-latest`              |
| Modelo de embedding | `mistral-embed`                           |
| Voxtral em lote   | `voxtral-mini-latest` (transcrição de áudio) |
| Voxtral em tempo real | `voxtral-mini-transcribe-realtime-2602` |

## Primeiros passos

<Steps>
  <Step title="Obtenha sua chave de API">
    Crie uma chave de API no [Console da Mistral](https://console.mistral.ai/).
  </Step>
  <Step title="Execute a integração inicial">
    ```bash
    openclaw onboard --auth-choice mistral-api-key
    ```

    Ou forneça a chave diretamente:

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

## Catálogo de LLMs integrado

| Referência do modelo              | Entrada     | Contexto | Saída máxima | Observações                                           |
| --------------------------------- | ----------- | -------- | ------------ | ----------------------------------------------------- |
| `mistral/mistral-large-latest`    | texto, imagem | 262,144 | 16,384     | Modelo padrão                                         |
| `mistral/mistral-medium-2508`     | texto, imagem | 262,144 | 8,192      | Mistral Medium 3.1                                    |
| `mistral/mistral-medium-3-5`      | texto, imagem | 262,144 | 8,192      | Mistral Medium 3.5; raciocínio ajustável              |
| `mistral/mistral-small-latest`    | texto, imagem | 262,144 | 16,384     | Versão mais recente do Mistral Small 4; `reasoning_effort` ajustável |
| `mistral/mistral-small-2603`      | texto, imagem | 262,144 | 16,384     | Versão fixada do Mistral Small 4; `reasoning_effort` ajustável |
| `mistral/pixtral-large-latest`    | texto, imagem | 128,000 | 32,768     | Pixtral                                               |
| `mistral/codestral-latest`        | texto       | 256,000  | 4,096        | Programação                                           |
| `mistral/devstral-medium-latest`  | texto       | 262,144  | 32,768       | Devstral 2                                            |
| `mistral/magistral-small`         | texto       | 128,000  | 40,000       | Raciocínio habilitado                                 |

Consulte a linha correspondente no catálogo incluído antes de alterar a configuração:

```bash
openclaw models list --all --provider mistral --plain
```

Faça um teste rápido de um modelo sem iniciar o Gateway:

```bash
openclaw infer model run --local \
  --model mistral/mistral-medium-3-5 \
  --prompt "Reply with exactly: mistral-ok" \
  --json
```

## Transcrição de áudio (Voxtral)

Use o Voxtral para transcrição de áudio em lote por meio do pipeline de compreensão de mídia:

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

## STT de streaming do Voice Call

O Plugin `mistral` incluído registra o Voxtral Realtime como provedor de STT de streaming do Voice Call.

| Configuração | Caminho da configuração                                                  | Padrão                                  |
| ------------ | ------------------------------------------------------------------------ | --------------------------------------- |
| Chave de API | `plugins.entries.voice-call.config.streaming.providers.mistral.apiKey`   | Usa `MISTRAL_API_KEY` como alternativa  |
| Modelo       | `...mistral.model`                                                       | `voxtral-mini-transcribe-realtime-2602` |
| Codificação  | `...mistral.encoding`                                                    | `pcm_mulaw`                             |
| Taxa de amostragem | `...mistral.sampleRate`                                             | `8000`                                  |
| Atraso desejado | `...mistral.targetStreamingDelayMs`                                   | `800`                                   |

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
Por padrão, o OpenClaw configura o STT em tempo real da Mistral como `pcm_mulaw` a 8 kHz, para que o Voice Call possa encaminhar diretamente os quadros de mídia da Twilio. Use `encoding: "pcm_s16le"` e um `sampleRate` correspondente somente se o fluxo de origem já estiver em PCM bruto.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Raciocínio ajustável">
    `mistral/mistral-small-latest`, `mistral/mistral-small-2603` e `mistral/mistral-medium-3-5` oferecem suporte a [raciocínio ajustável](https://docs.mistral.ai/studio-api/conversations/reasoning/adjustable) na API de conclusões de chat por meio de `reasoning_effort` (`none` minimiza o processamento adicional na saída; `high` expõe os rastros completos de raciocínio antes da resposta final).

    O OpenClaw mapeia o nível de **raciocínio** da sessão para a API da Mistral:

    | Nível de raciocínio do OpenClaw                                    | `reasoning_effort` da Mistral |
    | ------------------------------------------------------------------- | ----------------------------- |
    | **desativado** / **mínimo**                                        | `none`                        |
    | **baixo** / **médio** / **alto** / **xhigh** / **adaptativo** / **máximo** | `high`                 |

    <Warning>
    Evite combinar o modo de raciocínio do Medium 3.5 com `temperature: 0`; há relatos de que a API HTTP da Mistral rejeita `reasoning_effort="high"` em conjunto com `temperature: 0`, retornando uma resposta 400. Não defina a temperatura ou desative/minimize o raciocínio para que o OpenClaw envie `reasoning_effort: "none"` antes de definir uma temperatura baixa.
    </Warning>

    Exemplo de configuração de raciocínio específica do modelo Medium 3.5:

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
    Outros modelos incluídos no catálogo da Mistral não usam esse parâmetro. Continue usando modelos `magistral-*` quando quiser o comportamento nativo da Mistral que prioriza o raciocínio.
    </Note>

  </Accordion>

  <Accordion title="Embeddings de memória">
    A Mistral pode fornecer embeddings de memória por meio de `/v1/embeddings` (modelo padrão: `mistral-embed`):

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: { provider: "mistral" },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Autenticação e URL base">
    - A autenticação da Mistral usa `MISTRAL_API_KEY` (cabeçalho Bearer).
    - A URL base do provedor é `https://api.mistral.ai/v1` por padrão e aceita o formato padrão de solicitação de conclusões de chat compatível com OpenAI.
    - O modelo padrão da integração inicial é `mistral/mistral-large-latest`.
    - Substitua a URL base em `models.providers.mistral.baseUrl` somente quando a Mistral publicar explicitamente um endpoint regional necessário para você.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Compreensão de mídia" href="/pt-BR/nodes/media-understanding" icon="microphone">
    Configuração da transcrição de áudio e seleção de provedores.
  </Card>
</CardGroup>
