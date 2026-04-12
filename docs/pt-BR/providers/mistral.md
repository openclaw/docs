---
read_when:
    - Você quer usar modelos Mistral no OpenClaw
    - Você precisa do onboarding com a chave de API da Mistral e das refs de modelo
summary: Use modelos Mistral e transcrição Voxtral com o OpenClaw
title: Mistral
x-i18n:
    generated_at: "2026-04-12T23:31:48Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0474f55587909ce9bbdd47b881262edbeb1b07eb3ed52de1090a8ec4d260c97b
    source_path: providers/mistral.md
    workflow: 15
---

# Mistral

O OpenClaw oferece suporte à Mistral tanto para roteamento de modelos de texto/imagem (`mistral/...`) quanto para
transcrição de áudio via Voxtral em compreensão de mídia.
A Mistral também pode ser usada para embeddings de memória (`memorySearch.provider = "mistral"`).

- Provedor: `mistral`
- Auth: `MISTRAL_API_KEY`
- API: Mistral Chat Completions (`https://api.mistral.ai/v1`)

## Primeiros passos

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

## Catálogo integrado de LLMs

No momento, o OpenClaw inclui este catálogo Mistral integrado:

| Model ref                        | Entrada     | Contexto | Saída máx. | Observações                                                      |
| -------------------------------- | ----------- | -------- | ---------- | ---------------------------------------------------------------- |
| `mistral/mistral-large-latest`   | text, image | 262,144  | 16,384     | Modelo padrão                                                    |
| `mistral/mistral-medium-2508`    | text, image | 262,144  | 8,192      | Mistral Medium 3.1                                               |
| `mistral/mistral-small-latest`   | text, image | 128,000  | 16,384     | Mistral Small 4; raciocínio ajustável via API `reasoning_effort` |
| `mistral/pixtral-large-latest`   | text, image | 128,000  | 32,768     | Pixtral                                                          |
| `mistral/codestral-latest`       | text        | 256,000  | 4,096      | Código                                                           |
| `mistral/devstral-medium-latest` | text        | 262,144  | 32,768     | Devstral 2                                                       |
| `mistral/magistral-small`        | text        | 128,000  | 40,000     | Raciocínio ativado                                               |

## Transcrição de áudio (Voxtral)

Use o Voxtral para transcrição de áudio por meio do pipeline de compreensão de mídia.

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

## Configuração avançada

<AccordionGroup>
  <Accordion title="Raciocínio ajustável (mistral-small-latest)">
    `mistral/mistral-small-latest` corresponde ao Mistral Small 4 e oferece suporte a [raciocínio ajustável](https://docs.mistral.ai/capabilities/reasoning/adjustable) na API Chat Completions por meio de `reasoning_effort` (`none` minimiza raciocínio extra na saída; `high` exibe rastros completos de raciocínio antes da resposta final).

    O OpenClaw mapeia o nível de **thinking** da sessão para a API da Mistral:

    | Nível de thinking do OpenClaw                   | Mistral `reasoning_effort` |
    | ------------------------------------------------ | -------------------------- |
    | **off** / **minimal**                            | `none`                     |
    | **low** / **medium** / **high** / **xhigh** / **adaptive** | `high`             |

    <Note>
    Os outros modelos do catálogo Mistral integrado não usam esse parâmetro. Continue usando os modelos `magistral-*` quando quiser o comportamento nativo da Mistral priorizando raciocínio.
    </Note>

  </Accordion>

  <Accordion title="Embeddings de memória">
    A Mistral pode fornecer embeddings de memória por `/v1/embeddings` (modelo padrão: `mistral-embed`).

    ```json5
    {
      memorySearch: { provider: "mistral" },
    }
    ```

  </Accordion>

  <Accordion title="Auth e base URL">
    - A auth da Mistral usa `MISTRAL_API_KEY`.
    - A base URL do provedor é `https://api.mistral.ai/v1` por padrão.
    - O modelo padrão do onboarding é `mistral/mistral-large-latest`.
    - A Z.AI usa auth Bearer com sua chave de API.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Compreensão de mídia" href="/tools/media-understanding" icon="microphone">
    Configuração de transcrição de áudio e seleção de provedor.
  </Card>
</CardGroup>
