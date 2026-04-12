---
read_when:
    - Você quer modelos GLM no OpenClaw
    - Você precisa da convenção de nomenclatura dos modelos e da configuração
summary: Visão geral da família de modelos GLM + como usá-la no OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-04-12T23:31:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: b38f0896c900fae3cf3458ff99938d73fa46973a057d1dd373ae960cb7d2e9b5
    source_path: providers/glm.md
    workflow: 15
---

# Modelos GLM

GLM é uma **família de modelos** (não uma empresa) disponível pela plataforma Z.AI. No OpenClaw, os modelos GLM
são acessados pelo provedor `zai` e por IDs de modelo como `zai/glm-5`.

## Primeiros passos

<Steps>
  <Step title="Escolha uma rota de auth e execute o onboarding">
    Escolha a opção de onboarding que corresponde ao seu plano e região da Z.AI:

    | Auth choice | Ideal para |
    | ----------- | ---------- |
    | `zai-api-key` | Configuração genérica com chave de API e autodetecção de endpoint |
    | `zai-coding-global` | Usuários do Coding Plan (global) |
    | `zai-coding-cn` | Usuários do Coding Plan (região da China) |
    | `zai-global` | API geral (global) |
    | `zai-cn` | API geral (região da China) |

    ```bash
    # Exemplo: autodetecção genérica
    openclaw onboard --auth-choice zai-api-key

    # Exemplo: Coding Plan global
    openclaw onboard --auth-choice zai-coding-global
    ```

  </Step>
  <Step title="Defina GLM como modelo padrão">
    ```bash
    openclaw config set agents.defaults.model.primary "zai/glm-5.1"
    ```
  </Step>
  <Step title="Verifique se os modelos estão disponíveis">
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
`zai-api-key` permite que o OpenClaw detecte o endpoint Z.AI correspondente a partir da chave e
aplique automaticamente a base URL correta. Use as opções regionais explícitas quando
quiser forçar uma superfície específica do Coding Plan ou da API geral.
</Tip>

## Modelos GLM integrados

No momento, o OpenClaw inicializa o provedor `zai` integrado com estas refs GLM:

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
A ref de modelo integrada padrão é `zai/glm-5.1`. As versões e a disponibilidade do GLM
podem mudar; consulte a documentação da Z.AI para ver as mais recentes.
</Note>

## Observações avançadas

<AccordionGroup>
  <Accordion title="Autodetecção de endpoint">
    Quando você usa a opção de auth `zai-api-key`, o OpenClaw inspeciona o formato da chave
    para determinar a base URL correta da Z.AI. As opções regionais explícitas
    (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) substituem a
    autodetecção e fixam o endpoint diretamente.
  </Accordion>

  <Accordion title="Detalhes do provedor">
    Os modelos GLM são servidos pelo provedor de tempo de execução `zai`. Para a configuração
    completa do provedor, endpoints regionais e recursos adicionais, consulte a
    [documentação do provedor Z.AI](/pt-BR/providers/zai).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Provedor Z.AI" href="/pt-BR/providers/zai" icon="server">
    Configuração completa do provedor Z.AI e endpoints regionais.
  </Card>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
</CardGroup>
