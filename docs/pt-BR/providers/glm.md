---
read_when:
    - Você quer usar modelos GLM no OpenClaw
    - Você precisa da convenção de nomenclatura do modelo e da configuração
summary: Visão geral da família de modelos GLM + como usá-la no OpenClaw
title: GLM (Zhipu)
x-i18n:
  refreshed_at: '2026-04-28T05:23:26Z'
  generated_at: "2026-04-24T06:07:14Z"
  model: gpt-5.4
  provider: openai
  source_hash: 0272f0621559c0aba2c939dc52771ac2c94a20f9f7201c1f71d80a9c2197c7e7
  source_path: providers/glm.md
  workflow: 15
---

# Modelos GLM

GLM é uma **família de modelos** (não uma empresa) disponível pela plataforma Z.AI. No OpenClaw, os modelos GLM
são acessados pelo provedor `zai` e por IDs de modelo como `zai/glm-5`.

## Primeiros passos

<Steps>
  <Step title="Escolha uma rota de autenticação e execute o onboarding">
    Escolha a opção de onboarding que corresponde ao seu plano e região da Z.AI:

    | Escolha de autenticação | Melhor para |
    | ----------------------- | ----------- |
    | `zai-api-key` | Configuração genérica com chave de API e detecção automática de endpoint |
    | `zai-coding-global` | Usuários do Coding Plan (global) |
    | `zai-coding-cn` | Usuários do Coding Plan (região China) |
    | `zai-global` | API geral (global) |
    | `zai-cn` | API geral (região China) |

    ```bash
    # Exemplo: detecção automática genérica
    openclaw onboard --auth-choice zai-api-key

    # Exemplo: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Definir GLM como modelo padrão">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Verificar se os modelos estão disponíveis">
    ```bash
    openclaw models list --provider zai
    ```
  </Step>
</Steps>

## Exemplo de configuração

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  agents: { defaults: { model: { primary: "zai/glm-5.1" } } },
}
```

<Tip>
`zai-api-key` permite que o OpenClaw detecte o endpoint correspondente da Z.AI a partir da chave e
aplique automaticamente a base URL correta. Use as escolhas regionais explícitas quando
quiser forçar uma superfície específica do Coding Plan ou da API geral.
</Tip>

## Catálogo integrado

Atualmente, o OpenClaw inicializa o provedor empacotado `zai` com estas referências GLM:

| Modelo          | Modelo           |
| --------------- | ---------------- |
| `glm-5.1`       | `glm-4.7`        |
| `glm-5`         | `glm-4.7-flash`  |
| `glm-5-turbo`   | `glm-4.7-flashx` |
| `glm-5v-turbo`  | `glm-4.6`        |
| `glm-4.5`       | `glm-4.6v`       |
| `glm-4.5-air`   |                  |
| `glm-4.5-flash` |                  |
| `glm-4.5v`      |                  |

<Note>
A referência de modelo empacotada padrão é `zai/glm-5.1`. Versões e disponibilidade do GLM
podem mudar; consulte a documentação da Z.AI para ver as informações mais recentes.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Detecção automática de endpoint">
    Quando você usa a escolha de autenticação `zai-api-key`, o OpenClaw inspeciona o formato da chave
    para determinar a base URL correta da Z.AI. Escolhas regionais explícitas
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) sobrescrevem
    a detecção automática e fixam o endpoint diretamente.
  </Accordion>

  <Accordion title="Detalhes do provedor">
    Os modelos GLM são servidos pelo provedor de runtime `zai`. Para a configuração completa do provedor,
    endpoints regionais e capacidades adicionais, consulte
    [Z.AI provider docs](/pt-BR/providers/zai).
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Provedor Z.AI" href="/pt-BR/providers/zai" icon="server">
    Configuração completa do provedor Z.AI e endpoints regionais.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
</CardGroup>
