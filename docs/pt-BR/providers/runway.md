---
read_when:
    - Você quer usar a geração de vídeo da Runway no OpenClaw
    - Você precisa configurar a chave de API/variável de ambiente da Runway
    - Você quer tornar Runway o provedor de vídeo padrão
summary: Configuração de geração de vídeo do Runway no OpenClaw
title: Pista
x-i18n:
    generated_at: "2026-05-06T09:11:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 51980217868c6d2f168f897106f81ea38dfcfde5265b14e394d4e232324a46b7
    source_path: providers/runway.md
    workflow: 16
    postprocess_version: locale-links-v1
---

OpenClaw inclui um provedor `runway` agrupado para geração de vídeo hospedada. O Plugin é habilitado por padrão e registra o provedor `runway` no contrato `videoGenerationProviders`.

| Propriedade               | Valor                                                            |
| ------------------------- | ---------------------------------------------------------------- |
| ID do provedor            | `runway`                                                         |
| Plugin                    | agrupado, `enabledByDefault: true`                               |
| Variáveis de ambiente auth | `RUNWAYML_API_SECRET` (canônica) ou `RUNWAY_API_KEY`             |
| Flag de onboarding        | `--auth-choice runway-api-key`                                   |
| Flag direta da CLI        | `--runway-api-key <key>`                                         |
| API                       | geração de vídeo baseada em tarefas da Runway (polling de `GET /v1/tasks/{id}`) |
| Modelo padrão             | `runway/gen4.5`                                                  |

## Primeiros passos

<Steps>
  <Step title="Defina a chave da API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Defina Runway como o provedor de vídeo padrão">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Gere um vídeo">
    Peça ao agente para gerar um vídeo. Runway será usado automaticamente.
  </Step>
</Steps>

## Modos e modelos compatíveis

O provedor expõe sete modelos da Runway divididos em três modos. O mesmo ID de modelo pode atender a mais de um modo (por exemplo, `gen4.5` funciona tanto para texto para vídeo quanto para imagem para vídeo).

| Modo           | Modelos                                                                | Entrada de referência   |
| -------------- | ---------------------------------------------------------------------- | ----------------------- |
| Texto para vídeo | `gen4.5` (padrão), `veo3.1`, `veo3.1_fast`, `veo3`                    | Nenhuma                 |
| Imagem para vídeo | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 imagem local ou remota |
| Vídeo para vídeo | `gen4_aleph`                                                           | 1 vídeo local ou remoto |

Referências locais de imagem e vídeo são compatíveis via URIs de dados.

| Proporções de tela   | Valores permitidos                         |
| -------------------- | ------------------------------------------ |
| Texto para vídeo     | `16:9`, `9:16`                             |
| Edições de imagem e vídeo | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  Vídeo para vídeo atualmente exige `runway/gen4_aleph`. Outros IDs de modelo da Runway rejeitam entradas de referência de vídeo.
</Warning>

<Note>
  Escolher um ID de modelo da Runway da coluna errada produz um erro explícito antes que a solicitação da API saia do OpenClaw. O provedor valida `model` contra a lista de permissões do modo (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) em `extensions/runway/video-generation-provider.ts`.
</Note>

## Configuração

```json5
{
  agents: {
    defaults: {
      videoGenerationModel: {
        primary: "runway/gen4.5",
      },
    },
  },
}
```

## Configuração avançada

<AccordionGroup>
  <Accordion title="Aliases de variáveis de ambiente">
    OpenClaw reconhece tanto `RUNWAYML_API_SECRET` (canônica) quanto `RUNWAY_API_KEY`.
    Qualquer uma das variáveis autenticará o provedor Runway.
  </Accordion>

  <Accordion title="Polling de tarefas">
    Runway usa uma API baseada em tarefas. Depois de enviar uma solicitação de geração, OpenClaw
    faz polling de `GET /v1/tasks/{id}` até que o vídeo esteja pronto. Nenhuma configuração
    adicional é necessária para o comportamento de polling.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros de ferramenta compartilhados, seleção de provedor e comportamento assíncrono.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Configurações padrão do agente, incluindo o modelo de geração de vídeo.
  </Card>
</CardGroup>
