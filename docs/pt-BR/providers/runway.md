---
read_when:
    - Você quer usar a geração de vídeos do Runway no OpenClaw
    - Você precisa configurar a chave da API do Runway e a variável de ambiente correspondente
    - Você quer tornar a Runway o provedor de vídeo padrão
summary: Configuração da geração de vídeos do Runway no OpenClaw
title: Pista de decolagem
x-i18n:
    generated_at: "2026-07-12T00:20:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7aa2a802323857bf7c839ebfab56853dc79d656a25bbc194a431959a48bbd64b
    source_path: providers/runway.md
    workflow: 16
---

OpenClaw inclui um provedor `runway` integrado para geração de vídeos hospedada, habilitado por padrão e registrado no contrato `videoGenerationProviders`.

| Propriedade                | Valor                                                                            |
| -------------------------- | -------------------------------------------------------------------------------- |
| ID do provedor             | `runway`                                                                         |
| Plugin                     | integrado, `enabledByDefault: true`                                               |
| Variáveis de ambiente de autenticação | `RUNWAYML_API_SECRET` (canônica) ou `RUNWAY_API_KEY`                   |
| Opção de integração inicial | `--auth-choice runway-api-key`                                                   |
| Opção direta da CLI        | `--runway-api-key <key>`                                                         |
| API                        | Geração de vídeos baseada em tarefas do Runway (consulta de `GET /v1/tasks/{id}`) |
| Modelo padrão              | `runway/gen4.5`                                                                  |

## Primeiros passos

<Steps>
  <Step title="Defina a chave da API">
    ```bash
    openclaw onboard --auth-choice runway-api-key
    ```
  </Step>
  <Step title="Defina o Runway como provedor de vídeo padrão">
    ```bash
    openclaw config set agents.defaults.videoGenerationModel.primary "runway/gen4.5"
    ```
  </Step>
  <Step title="Gere um vídeo">
    Peça ao agente para gerar um vídeo. O Runway será usado automaticamente.
  </Step>
</Steps>

## Modos e modelos compatíveis

O provedor disponibiliza sete modelos do Runway divididos em três modos. O mesmo ID de modelo pode atender a mais de um modo (por exemplo, `gen4.5` funciona tanto para texto em vídeo quanto para imagem em vídeo).

| Modo             | Modelos                                                                | Entrada de referência       |
| ---------------- | ---------------------------------------------------------------------- | --------------------------- |
| Texto em vídeo   | `gen4.5` (padrão), `veo3.1`, `veo3.1_fast`, `veo3`                    | Nenhuma                     |
| Imagem em vídeo  | `gen4.5`, `gen4_turbo`, `gen3a_turbo`, `veo3.1`, `veo3.1_fast`, `veo3` | 1 imagem local ou remota    |
| Vídeo em vídeo   | `gen4_aleph`                                                           | 1 vídeo local ou remoto     |

Referências locais de imagem e vídeo são compatíveis por meio de URIs de dados.

| Proporções de tela           | Valores permitidos                         |
| ---------------------------- | ------------------------------------------ |
| Texto em vídeo               | `16:9`, `9:16`                             |
| Edições de imagem e vídeo    | `1:1`, `16:9`, `9:16`, `3:4`, `4:3`, `21:9` |

<Warning>
  No momento, o modo de vídeo em vídeo exige `runway/gen4_aleph`. Outros IDs de modelo do Runway rejeitam entradas de referência em vídeo.
</Warning>

<Note>
  Selecionar um ID de modelo do Runway na coluna incorreta gera um erro explícito antes de a solicitação à API sair do OpenClaw. O provedor valida `model` em relação à lista de permissões do modo (`TEXT_ONLY_MODELS`, `IMAGE_MODELS`, `VIDEO_MODELS`) em `extensions/runway/video-generation-provider.ts`.
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
    O OpenClaw reconhece tanto `RUNWAYML_API_SECRET` (canônica) quanto `RUNWAY_API_KEY`.
    Qualquer uma das variáveis autentica o provedor Runway.
  </Accordion>

  <Accordion title="Consulta de tarefas">
    O Runway usa uma API baseada em tarefas. Após enviar uma solicitação de geração, o OpenClaw
    consulta `GET /v1/tasks/{id}` até que o vídeo esteja pronto. Nenhuma
    configuração adicional é necessária para o comportamento de consulta.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Geração de vídeos" href="/pt-BR/tools/video-generation" icon="video">
    Parâmetros compartilhados da ferramenta, seleção de provedor e comportamento assíncrono.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/config-agents#agent-defaults" icon="gear">
    Configurações padrão do agente, incluindo o modelo de geração de vídeos.
  </Card>
</CardGroup>
