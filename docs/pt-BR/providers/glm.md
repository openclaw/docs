---
read_when:
    - Você quer modelos GLM no OpenClaw
    - Você precisa da convenção de nomenclatura de modelos e da configuração
summary: Visão geral da família de modelos GLM e como usá-la no OpenClaw
title: GLM (Zhipu)
x-i18n:
    generated_at: "2026-05-06T09:10:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 190b8834e3f11cdb90c9bdb1844bfad3a79383776540f733e601437157b7a093
    source_path: providers/glm.md
    workflow: 16
---

GLM é uma família de modelos (não uma empresa) disponível pela plataforma [Z.AI](https://z.ai). No OpenClaw, os modelos GLM são acessados pelo provedor `zai` incluído, com refs como `zai/glm-5.1`.

| Propriedade                  | Valor                                                                       |
| ---------------------------- | --------------------------------------------------------------------------- |
| ID do provedor               | `zai`                                                                       |
| Plugin                       | incluído, `enabledByDefault: true`                                          |
| Variáveis de ambiente de autenticação | `ZAI_API_KEY` ou `Z_AI_API_KEY`                                      |
| Opções de onboarding         | `zai-api-key`, `zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn` |
| API                          | compatível com OpenAI                                                       |
| URL base padrão              | `https://api.z.ai/api/paas/v4`                                              |
| Padrão sugerido              | `zai/glm-5.1`                                                               |
| Modelo de imagem padrão      | `zai/glm-4.6v`                                                              |

## Primeiros passos

<Steps>
  <Step title="Escolha uma rota de autenticação e execute o onboarding">
    Escolha a opção de onboarding que corresponda ao seu plano e à sua região da Z.AI. A opção genérica `zai-api-key` detecta automaticamente o endpoint correspondente pelo formato da chave; use as opções regionais explícitas quando quiser forçar um Coding Plan específico ou a superfície de API geral.

    | Opção de autenticação | Melhor para                                        |
    | --------------------- | -------------------------------------------------- |
    | `zai-api-key`         | Chave de API genérica com detecção automática de endpoint |
    | `zai-coding-global`   | Usuários do Coding Plan (global)                   |
    | `zai-coding-cn`       | Usuários do Coding Plan (região da China)          |
    | `zai-global`          | API geral (global)                                 |
    | `zai-cn`              | API geral (região da China)                        |

    <CodeGroup>

```bash Detecção automática
openclaw onboard --auth-choice zai-api-key
```

```bash Coding Plan (global)
openclaw onboard --auth-choice zai-coding-global
```

```bash Coding Plan (China)
openclaw onboard --auth-choice zai-coding-cn
```

```bash API geral (global)
openclaw onboard --auth-choice zai-global
```

```bash API geral (China)
openclaw onboard --auth-choice zai-cn
```

    </CodeGroup>

  </Step>
  <Step title="Defina GLM como o modelo padrão">
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
  `zai-api-key` permite que o OpenClaw detecte o endpoint da Z.AI correspondente pelo formato da chave e aplique automaticamente a URL base correta. Use as opções regionais explícitas quando quiser fixar um Coding Plan específico ou a superfície de API geral.
</Tip>

## Catálogo integrado

O provedor `zai` incluído semeia 13 refs de modelos GLM. Todas as entradas aceitam raciocínio, salvo indicação em contrário; `glm-5v-turbo` e `glm-4.6v` aceitam entrada de imagem além de texto.

| Ref do modelo        | Observações                                        |
| -------------------- | -------------------------------------------------- |
| `zai/glm-5.1`        | Modelo padrão. Raciocínio, somente texto, contexto de 202k. |
| `zai/glm-5`          | Raciocínio, somente texto, contexto de 202k.       |
| `zai/glm-5-turbo`    | Raciocínio, somente texto, contexto de 202k.       |
| `zai/glm-5v-turbo`   | Raciocínio, texto + imagem, contexto de 202k.      |
| `zai/glm-4.7`        | Raciocínio, somente texto, contexto de 204k.       |
| `zai/glm-4.7-flash`  | Raciocínio, somente texto, contexto de 200k.       |
| `zai/glm-4.7-flashx` | Raciocínio, somente texto.                         |
| `zai/glm-4.6`        | Raciocínio, somente texto.                         |
| `zai/glm-4.6v`       | Raciocínio, texto + imagem. Modelo de imagem padrão. |
| `zai/glm-4.5`        | Raciocínio, somente texto.                         |
| `zai/glm-4.5-air`    | Raciocínio, somente texto.                         |
| `zai/glm-4.5-flash`  | Raciocínio, somente texto.                         |
| `zai/glm-4.5v`       | Raciocínio, texto + imagem.                        |

<Note>
  As versões e a disponibilidade do GLM podem mudar. Execute `openclaw models list --provider zai` para ver as linhas do catálogo conhecidas pela sua versão instalada e consulte a documentação da Z.AI para modelos recém-adicionados ou obsoletos.
</Note>

## Configuração avançada

<AccordionGroup>
  <Accordion title="Detecção automática de endpoint">
    Quando você usa a opção de autenticação `zai-api-key`, o OpenClaw inspeciona o formato da chave para determinar a URL base correta da Z.AI. As opções regionais explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) substituem a detecção automática e fixam diretamente o endpoint.
  </Accordion>

  <Accordion title="Detalhes do provedor">
    Os modelos GLM são servidos pelo provedor de runtime `zai`. Para ver a configuração completa do provedor, endpoints regionais e recursos adicionais, consulte a [página do provedor Z.AI](/pt-BR/providers/zai).
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Provedor Z.AI" href="/pt-BR/providers/zai" icon="server">
    Configuração completa do provedor Z.AI e endpoints regionais.
  </Card>
  <Card title="Provedores de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelo e comportamento de failover.
  </Card>
  <Card title="Modos de pensamento" href="/pt-BR/tools/thinking" icon="brain">
    Níveis de `/think` para a família GLM com suporte a raciocínio.
  </Card>
  <Card title="Perguntas frequentes sobre modelos" href="/pt-BR/help/faq-models" icon="circle-question">
    Perfis de autenticação, troca de modelos e resolução de erros de "sem perfil".
  </Card>
</CardGroup>
