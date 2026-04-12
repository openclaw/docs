---
read_when:
    - Você quer usar a geração de vídeo com Runway no OpenClaw
    - Você precisa da configuração da chave da API/ambiente da Runway
    - Você quer tornar a Runway o provedor de vídeo padrão
summary: Configuração da geração de vídeo com Runway no OpenClaw
title: Runway
x-i18n:
    generated_at: "2026-04-12T23:32:42Z"
    model: gpt-5.4
    provider: openai
    source_hash: fb9a2d26687920544222b0769f314743af245629fd45b7f456c0161a47476176
    source_path: providers/runway.md
    workflow: 15
---

# Runway

O OpenClaw inclui um provedor `runway` integrado para geração de vídeo hospedada.

| Propriedade | Valor                                                              |
| ----------- | ------------------------------------------------------------------ |
| ID do provedor | `runway`                                                        |
| Autenticação | `RUNWAYML_API_SECRET` (canônico) ou `RUNWAY_API_KEY`              |
| API         | Geração de vídeo baseada em tarefas da Runway (`GET /v1/tasks/{id}` polling) |

## Primeiros passos

<Steps>
  <Step title="Defina a chave da API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Defina a Runway como provedor de vídeo padrão">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Gere um vídeo">
    Peça ao agente para gerar um vídeo. A Runway será usada automaticamente.
  </Step>
</Steps>

## Modos compatíveis

| Modo           | Modelo             | Entrada de referência    |
| -------------- | ------------------ | ------------------------ |
| Texto para vídeo | `gen4.5` (padrão) | Nenhuma                  |
| Imagem para vídeo | `gen4.5`         | 1 imagem local ou remota |
| Vídeo para vídeo | `gen4_aleph`      | 1 vídeo local ou remoto  |

<Note>
Referências locais de imagem e vídeo são compatíveis via data URIs. Execuções somente com texto
atualmente expõem proporções `16:9` e `9:16`.
</Note>

<Warning>
Vídeo para vídeo atualmente exige especificamente `runway/gen4_aleph`.
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

## Observações avançadas

<AccordionGroup>
  <Accordion title="Aliases de variável de ambiente">
    O OpenClaw reconhece tanto `RUNWAYML_API_SECRET` (canônico) quanto `RUNWAY_API_KEY`.
    Qualquer uma das variáveis autenticará o provedor Runway.
  </Accordion>

  <Accordion title="Polling de tarefas">
    A Runway usa uma API baseada em tarefas. Após enviar uma solicitação de geração, o OpenClaw
    faz polling em `GET /v1/tasks/{id}` até que o vídeo esteja pronto. Nenhuma
    configuração adicional é necessária para o comportamento de polling.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Geração de vídeo" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta, seleção de provedor e comportamento assíncrono.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference#agent-defaults" icon="gear">
    Configurações padrão do agente, incluindo o modelo de geração de vídeo.
  </Card>
</CardGroup>
