---
read_when:
    - Você quer usar a geração de vídeo Wan do Alibaba no OpenClaw
    - Você precisa configurar a chave de API do Model Studio ou do DashScope para geração de vídeo
summary: Geração de vídeo Wan do Alibaba Model Studio no OpenClaw
title: Alibaba Model Studio
x-i18n:
    generated_at: "2026-04-12T23:29:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: a6e97d929952cdba7740f5ab3f6d85c18286b05596a4137bf80bbc8b54f32662
    source_path: providers/alibaba.md
    workflow: 15
---

# Alibaba Model Studio

O OpenClaw inclui um provedor agrupado de geração de vídeo `alibaba` para modelos Wan no
Alibaba Model Studio / DashScope.

- Provedor: `alibaba`
- Autenticação preferida: `MODELSTUDIO_API_KEY`
- Também aceitos: `DASHSCOPE_API_KEY`, `QWEN_API_KEY`
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
  <Step title="Verifique se o provedor está disponível">
    ```bash
    openclaw models list --provider alibaba
    ```
  </Step>
</Steps>

<Note>
Qualquer uma das chaves de autenticação aceitas (`MODELSTUDIO_API_KEY`, `DASHSCOPE_API_KEY`, `QWEN_API_KEY`) funcionará. A opção de onboarding `qwen-standard-api-key` configura a credencial compartilhada do DashScope.
</Note>

## Modelos Wan integrados

Atualmente, o provedor agrupado `alibaba` registra:

| Ref. do modelo             | Modo                      |
| -------------------------- | ------------------------- |
| `alibaba/wan2.6-t2v`       | Texto para vídeo          |
| `alibaba/wan2.6-i2v`       | Imagem para vídeo         |
| `alibaba/wan2.6-r2v`       | Referência para vídeo     |
| `alibaba/wan2.6-r2v-flash` | Referência para vídeo (rápido) |
| `alibaba/wan2.7-r2v`       | Referência para vídeo     |

## Limites atuais

| Parâmetro             | Limite                                                    |
| --------------------- | --------------------------------------------------------- |
| Vídeos de saída       | Até **1** por solicitação                                 |
| Imagens de entrada    | Até **1**                                                 |
| Vídeos de entrada     | Até **4**                                                 |
| Duração               | Até **10 segundos**                                       |
| Controles compatíveis | `size`, `aspectRatio`, `resolution`, `audio`, `watermark` |
| Imagem/vídeo de referência | Apenas URLs remotas `http(s)`                        |

<Warning>
Atualmente, o modo de imagem/vídeo de referência exige **URLs remotas http(s)**. Caminhos de arquivo locais não são compatíveis para entradas de referência.
</Warning>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Relação com o Qwen">
    O provedor agrupado `qwen` também usa endpoints do DashScope hospedados pela Alibaba para
    geração de vídeo Wan. Use:

    - `qwen/...` quando você quiser a superfície canônica do provedor Qwen
    - `alibaba/...` quando você quiser a superfície direta de vídeo Wan pertencente ao fornecedor

    Veja a [documentação do provedor Qwen](/pt-BR/providers/qwen) para mais detalhes.

  </Accordion>

  <Accordion title="Prioridade da chave de autenticação">
    O OpenClaw verifica as chaves de autenticação nesta ordem:

    1. `MODELSTUDIO_API_KEY` (preferida)
    2. `DASHSCOPE_API_KEY`
    3. `QWEN_API_KEY`

    Qualquer uma delas autenticará o provedor `alibaba`.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta de vídeo e seleção de provedor.
  </Card>
  <Card title="Qwen" href="/pt-BR/providers/qwen" icon="microchip">
    Configuração do provedor Qwen e integração com o DashScope.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference#agent-defaults" icon="gear">
    Padrões de agente e configuração de modelo.
  </Card>
</CardGroup>
