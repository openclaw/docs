---
read_when:
    - Você quer usar modelos Grok no OpenClaw
    - Você está configurando a autenticação da xAI ou IDs de modelo
summary: Use modelos Grok da xAI no OpenClaw
title: xAI
x-i18n:
    generated_at: "2026-04-12T23:33:13Z"
    model: gpt-5.4
    provider: openai
    source_hash: 820fef290c67d9815e41a96909d567216f67ca0f01df1d325008fd04666ad255
    source_path: providers/xai.md
    workflow: 15
---

# xAI

O OpenClaw inclui um plugin provider `xai` empacotado para modelos Grok.

## Primeiros passos

<Steps>
  <Step title="Crie uma chave de API">
    Crie uma chave de API no [console da xAI](https://console.x.ai/).
  </Step>
  <Step title="Defina sua chave de API">
    Defina `XAI_API_KEY` ou execute:

    ```bash
    openclaw onboard --auth-choice xai-api-key
    ```

  </Step>
  <Step title="Escolha um modelo">
    ```json5
    {
      agents: { defaults: { model: { primary: "xai/grok-4" } } },
    }
    ```
  </Step>
</Steps>

<Note>
O OpenClaw usa a API Responses da xAI como transporte xAI empacotado. A mesma
`XAI_API_KEY` também pode alimentar `web_search` com tecnologia Grok, `x_search`
de primeira classe e `code_execution` remoto.
Se você armazenar uma chave xAI em `plugins.entries.xai.config.webSearch.apiKey`,
o provider de modelo xAI empacotado também reutiliza essa chave como fallback.
O ajuste de `code_execution` fica em `plugins.entries.xai.config.codeExecution`.
</Note>

## Catálogo de modelos builtin

O OpenClaw inclui estas famílias de modelos xAI prontas para uso:

| Família        | IDs de modelo                                                            |
| -------------- | ------------------------------------------------------------------------ |
| Grok 3         | `grok-3`, `grok-3-fast`, `grok-3-mini`, `grok-3-mini-fast`               |
| Grok 4         | `grok-4`, `grok-4-0709`                                                  |
| Grok 4 Fast    | `grok-4-fast`, `grok-4-fast-non-reasoning`                               |
| Grok 4.1 Fast  | `grok-4-1-fast`, `grok-4-1-fast-non-reasoning`                           |
| Grok 4.20 Beta | `grok-4.20-beta-latest-reasoning`, `grok-4.20-beta-latest-non-reasoning` |
| Grok Code      | `grok-code-fast-1`                                                       |

O plugin também resolve encaminhando IDs `grok-4*` e `grok-code-fast*` mais novos quando
eles seguem o mesmo formato de API.

<Tip>
`grok-4-fast`, `grok-4-1-fast` e as variantes `grok-4.20-beta-*` são as
refs Grok com capacidade de imagem atuais no catálogo empacotado.
</Tip>

### Mapeamentos de modo fast

`/fast on` ou `agents.defaults.models["xai/<model>"].params.fastMode: true`
reescreve as solicitações nativas da xAI da seguinte forma:

| Modelo de origem | Destino do modo fast |
| ---------------- | -------------------- |
| `grok-3`         | `grok-3-fast`        |
| `grok-3-mini`    | `grok-3-mini-fast`   |
| `grok-4`         | `grok-4-fast`        |
| `grok-4-0709`    | `grok-4-fast`        |

### Aliases legados de compatibilidade

Aliases legados ainda são normalizados para os IDs canônicos empacotados:

| Alias legado              | ID canônico                           |
| ------------------------- | ------------------------------------- |
| `grok-4-fast-reasoning`   | `grok-4-fast`                         |
| `grok-4-1-fast-reasoning` | `grok-4-1-fast`                       |
| `grok-4.20-reasoning`     | `grok-4.20-beta-latest-reasoning`     |
| `grok-4.20-non-reasoning` | `grok-4.20-beta-latest-non-reasoning` |

## Recursos

<AccordionGroup>
  <Accordion title="Busca na web">
    O provider de busca na web `grok` empacotado também usa `XAI_API_KEY`:

    ```bash
    openclaw config set tools.web.search.provider grok
    ```

  </Accordion>

  <Accordion title="Geração de vídeo">
    O plugin `xai` empacotado registra geração de vídeo por meio da ferramenta compartilhada
    `video_generate`.

    - Modelo de vídeo padrão: `xai/grok-imagine-video`
    - Modos: texto para vídeo, imagem para vídeo e fluxos remotos de edição/extensão de vídeo
    - Suporta `aspectRatio` e `resolution`

    <Warning>
    Buffers de vídeo locais não são aceitos. Use URLs remotas `http(s)` para
    entradas de referência de vídeo e edição.
    </Warning>

    Para usar a xAI como provider de vídeo padrão:

    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "xai/grok-imagine-video",
          },
        },
      },
    }
    ```

    <Note>
    Consulte [Geração de vídeo](/pt-BR/tools/video-generation) para ver parâmetros compartilhados da ferramenta,
    seleção de provider e comportamento de failover.
    </Note>

  </Accordion>

  <Accordion title="Configuração de x_search">
    O plugin xAI empacotado expõe `x_search` como uma ferramenta do OpenClaw para buscar
    conteúdo do X (antigo Twitter) via Grok.

    Caminho de configuração: `plugins.entries.xai.config.xSearch`

    | Chave              | Tipo    | Padrão             | Descrição                              |
    | ------------------ | ------- | ------------------ | -------------------------------------- |
    | `enabled`          | boolean | —                  | Habilita ou desabilita `x_search`      |
    | `model`            | string  | `grok-4-1-fast`    | Modelo usado para solicitações `x_search` |
    | `inlineCitations`  | boolean | —                  | Inclui citações inline nos resultados  |
    | `maxTurns`         | number  | —                  | Número máximo de turnos                |
    | `timeoutSeconds`   | number  | —                  | Timeout da solicitação em segundos     |
    | `cacheTtlMinutes`  | number  | —                  | Tempo de vida do cache em minutos      |

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              xSearch: {
                enabled: true,
                model: "grok-4-1-fast",
                inlineCitations: true,
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Configuração de code execution">
    O plugin xAI empacotado expõe `code_execution` como uma ferramenta do OpenClaw para
    execução remota de código no ambiente sandbox da xAI.

    Caminho de configuração: `plugins.entries.xai.config.codeExecution`

    | Chave             | Tipo    | Padrão                    | Descrição                                |
    | ----------------- | ------- | ------------------------- | ---------------------------------------- |
    | `enabled`         | boolean | `true` (se a chave estiver disponível) | Habilita ou desabilita code execution |
    | `model`           | string  | `grok-4-1-fast`           | Modelo usado para solicitações de code execution |
    | `maxTurns`        | number  | —                         | Número máximo de turnos                  |
    | `timeoutSeconds`  | number  | —                         | Timeout da solicitação em segundos       |

    <Note>
    Isto é execução remota em sandbox da xAI, não [`exec`](/pt-BR/tools/exec) local.
    </Note>

    ```json5
    {
      plugins: {
        entries: {
          xai: {
            config: {
              codeExecution: {
                enabled: true,
                model: "grok-4-1-fast",
              },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Limites conhecidos">
    - A autenticação hoje é apenas por chave de API. Ainda não existe fluxo OAuth nem device-code da xAI
      no OpenClaw.
    - `grok-4.20-multi-agent-experimental-beta-0304` não é compatível no
      caminho normal do provider xAI porque exige uma superfície de API upstream
      diferente do transporte xAI padrão do OpenClaw.
  </Accordion>

  <Accordion title="Observações avançadas">
    - O OpenClaw aplica automaticamente correções de compatibilidade específicas da xAI para schema de ferramentas e chamadas de ferramenta
      no caminho compartilhado do runner.
    - Solicitações nativas da xAI usam por padrão `tool_stream: true`. Defina
      `agents.defaults.models["xai/<model>"].params.tool_stream` como `false` para
      desabilitá-lo.
    - O wrapper xAI empacotado remove flags estritas de schema de ferramentas não suportadas e
      chaves de payload de raciocínio antes de enviar solicitações nativas da xAI.
    - `web_search`, `x_search` e `code_execution` são expostos como ferramentas do OpenClaw.
      O OpenClaw habilita o built-in específico da xAI necessário dentro de cada
      solicitação da ferramenta em vez de anexar todas as ferramentas nativas a cada turno de chat.
    - `x_search` e `code_execution` pertencem ao plugin xAI empacotado, e não ficam
      codificados diretamente no runtime de modelo core.
    - `code_execution` é execução remota em sandbox da xAI, não
      [`exec`](/pt-BR/tools/exec) local.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Como escolher providers, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provider.
  </Card>
  <Card title="Todos os providers" href="/pt-BR/providers/index" icon="grid-2">
    A visão geral mais ampla de providers.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e correções.
  </Card>
</CardGroup>
