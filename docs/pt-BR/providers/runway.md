---
read_when:
    - Você quer usar a geração de vídeo da Runway no OpenClaw
    - Você precisa da configuração de chave de API/env da Runway
    - Você quer tornar a Runway o provedor de vídeo padrão
summary: Configuração de geração de vídeo com Runway no OpenClaw
title: Runway
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T06:09:10Z"
  model: gpt-5.4
  provider: openai
  source_hash: 9648ca4403283cd23bf899d697f35a6b63986e8860227628c0d5789fceee3ce8
  source_path: providers/runway.md
  workflow: 15
---

O OpenClaw inclui um provedor `runway` integrado para geração de vídeo hospedada.

| Propriedade | Valor                                                               |
| ----------- | ------------------------------------------------------------------- |
| ID do provedor | `runway`                                                         |
| Auth        | `RUNWAYML_API_SECRET` (canônico) ou `RUNWAY_API_KEY`                |
| API         | Geração de vídeo baseada em tarefas da Runway (`GET /v1/tasks/{id}` polling) |

## Primeiros passos

<Steps>
  <Step title="Definir a chave de API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Definir a Runway como provedor de vídeo padrão">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Gerar um vídeo">
    Peça ao agente para gerar um vídeo. A Runway será usada automaticamente.
  </Step>
</Steps>

## Modos compatíveis

| Modo            | Modelo             | Entrada de referência     |
| --------------- | ------------------ | ------------------------- |
| Texto-para-vídeo | `gen4.5` (padrão) | Nenhuma                   |
| Imagem-para-vídeo | `gen4.5`         | 1 imagem local ou remota  |
| Vídeo-para-vídeo | `gen4_aleph`      | 1 vídeo local ou remoto   |

<Note>
Referências locais de imagem e vídeo são compatíveis via URIs de dados. Execuções apenas de texto
atualmente expõem proporções `16:9` e `9:16`.
</Note>

<Warning>
Atualmente, vídeo-para-vídeo exige especificamente `runway/gen4_aleph`.
</Warning>

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
    O OpenClaw reconhece tanto `RUNWAYML_API_SECRET` (canônico) quanto `RUNWAY_API_KEY`.
    Qualquer uma das duas variáveis autenticará o provedor Runway.
  </Accordion>

  <Accordion title="Polling de tarefas">
    A Runway usa uma API baseada em tarefas. Após enviar uma solicitação de geração, o OpenClaw
    faz polling em `GET /v1/tasks/{id}` até que o vídeo esteja pronto. Nenhuma configuração
    adicional é necessária para o comportamento de polling.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta, seleção de provedor e comportamento assíncrono.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Configurações padrão do agente, incluindo modelo de geração de vídeo.
  </Card>
</CardGroup>
