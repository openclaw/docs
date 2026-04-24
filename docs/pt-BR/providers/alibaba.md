---
read_when:
    - Você quer usar a geração de vídeo Wan do Alibaba no OpenClaw
    - Você precisa configurar a chave de API do Model Studio ou do DashScope para geração de vídeo
summary: Geração de vídeo Wan do Alibaba Model Studio no OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-24T06:05:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: c5abfe9ab595f2a323d6113995bf3075aa92c7f329b934d048e7ece256d94899
    source_path: providers/alibaba.md
    workflow: 15
---

O OpenClaw inclui um provider empacotado `alibaba` de geração de vídeo para modelos Wan no
Alibaba Model Studio / DashScope.

- Provider: `alibaba`
- Autenticação preferida: `MODELSTUDIO_API_KEY`
- Também aceito: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
- API: geração assíncrona de vídeo do DashScope / Model Studio

## Primeiros passos

<Steps>
  <Step title="Defina uma chave de API">
    ```bash
    openclaw onboard --auth-choice qwen-standard-api-key
    ```
  </Step>
  <Step title="Defina um modelo de vídeo padrão">
    ```json5
    {
      agents: {
        defaults: {
          videoGenerationModel: {
            primary: "alibaba/wan2.6-t2v",
          },
        },
      },
    }
    ```
  </Step>
  <Step title="Verifique se o provider está disponível">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
Qualquer uma das chaves de autenticação aceitas (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) funcionará. A opção de onboarding `qwen-standard-api-key` configura a credencial compartilhada do DashScope.
</Note>

## Modelos Wan integrados

Atualmente, o provider empacotado `alibaba` registra:

| Ref do modelo              | Modo                        |
| -------------------------- | --------------------------- |
| `alibaba/wan2.6-t2v`       | Texto para vídeo            |
| `alibaba/wan2.6-i2v`       | Imagem para vídeo           |
| `alibaba/wan2.6-r2v`       | Referência para vídeo       |
| `alibaba/wan2.6-r2v-flash` | Referência para vídeo (rápido) |
| `alibaba/wan2.7-r2v`       | Referência para vídeo       |

## Limites atuais

| Parâmetro             | Limite                                                    |
| --------------------- | --------------------------------------------------------- |
| Vídeos de saída       | Até **1** por requisição                                  |
| Imagens de entrada    | Até **1**                                                 |
| Vídeos de entrada     | Até **4**                                                 |
| Duração               | Até **10 segundos**                                       |
| Controles compatíveis | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Imagem/vídeo de referência | Apenas URLs remotas `http(s)`                        |

<Warning>
O modo de imagem/vídeo de referência atualmente exige **URLs remotas `http(s)`**. Caminhos de arquivo locais não são compatíveis para entradas de referência.
</Warning>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Relação com Qwen">
    O provider empacotado `qwen` também usa endpoints DashScope hospedados pela Alibaba para
    geração de vídeo Wan. Use:

    - `qwen/...` quando quiser a superfície canônica do provider Qwen
    - `alibaba/...` quando quiser a superfície direta de vídeo Wan controlada pelo fornecedor

    Consulte a [documentação do provider Qwen](/pt-BR/providers/qwen) para mais detalhes.

  </Accordion>

  <Accordion title="Prioridade da chave de autenticação">
    O OpenClaw verifica chaves de autenticação nesta ordem:

    1. `MODELSTUDIO_API_KEY` (preferida)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Qualquer uma delas autenticará o provider `alibaba`.

  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provider.
  </Card>
  <Card title="Qwen" href="/pt-BR/providers/qwen" icon="microchip">
    Configuração do provider Qwen e integração com DashScope.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Padrões de agente e configuração de modelo.
  </Card>
</CardGroup>
