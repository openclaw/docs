---
read_when:
    - Você quer usar modelos Z.AI / GLM no OpenClaw
    - Você precisa de uma configuração simples de `ZAI_API_KEY`
summary: Use a Z.AI (modelos GLM) com o OpenClaw
title: Z.AI
x-i18n:
    generated_at: "2026-07-16T12:52:40Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 7f7adf0e2f436f9081891013c0092ce4717bf302b2a4a2e997d9561d7d40211a
    source_path: providers/zai.md
    workflow: 16
---

Z.AI é a plataforma de API para modelos **GLM**. Ela fornece APIs REST para GLM e
usa chaves de API para autenticação. Crie sua chave de API no console da Z.AI.
O OpenClaw usa o provedor `zai` com uma chave de API da Z.AI.

| Propriedade | Valor                                        |
| -------- | -------------------------------------------- |
| Provedor | `zai`                                        |
| Pacote  | `@openclaw/zai-provider`                     |
| Autenticação     | `ZAI_API_KEY` (alias legado: `Z_AI_API_KEY`) |
| API      | Conclusões de chat da Z.AI (autenticação Bearer)          |

## Modelos GLM

GLM é uma família de modelos, não um provedor separado. No OpenClaw, os modelos GLM usam
referências como `zai/glm-5.2`: provedor `zai`, ID do modelo `glm-5.2`.

## Introdução

Primeiro, instale o plugin do provedor:

```bash
openclaw plugins install @openclaw/zai-provider
```

<Tabs>
  <Tab title="Detecção automática do endpoint">
    **Recomendado para:** a maioria dos usuários. O OpenClaw testa os endpoints compatíveis da Z.AI com sua chave de API e aplica automaticamente a URL base correta.

    <Steps>
      <Step title="Execute a integração inicial">
        ```bash
        openclaw onboard --auth-choice zai-api-key
        ```
      </Step>
      <Step title="Verifique se o modelo está listado">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>

  <Tab title="Endpoint regional explícito">
    **Recomendado para:** usuários que desejam forçar um Coding Plan específico ou uma superfície de API geral.

    <Steps>
      <Step title="Escolha a opção correta de integração inicial">
        ```bash
        # Coding Plan Global (recomendado para usuários do Coding Plan)
        openclaw onboard --auth-choice zai-coding-global

        # Coding Plan CN (região da China)
        openclaw onboard --auth-choice zai-coding-cn

        # API geral
        openclaw onboard --auth-choice zai-global

        # API geral CN (região da China)
        openclaw onboard --auth-choice zai-cn
        ```
      </Step>
      <Step title="Verifique se o modelo está listado">
        ```bash
        openclaw models list --all --provider zai
        ```
      </Step>
    </Steps>

  </Tab>
</Tabs>

### Endpoints

| Opção de integração inicial   | URL base                                      | Modelo padrão |
| ------------------- | --------------------------------------------- | ------------- |
| `zai-global`        | `https://api.z.ai/api/paas/v4`                | `glm-5.1`     |
| `zai-cn`            | `https://open.bigmodel.cn/api/paas/v4`        | `glm-5.1`     |
| `zai-coding-global` | `https://api.z.ai/api/coding/paas/v4`         | `glm-5.2`     |
| `zai-coding-cn`     | `https://open.bigmodel.cn/api/coding/paas/v4` | `glm-5.2`     |

`zai-api-key` detecta automaticamente um desses quatro, testando sua chave na API
de conclusões de chat de cada endpoint, verificando primeiro os endpoints gerais (`zai-global`,
depois `zai-cn`) e, em seguida, os endpoints do Coding Plan (`zai-coding-global`, depois
`zai-coding-cn`), e parando no primeiro endpoint que aceitar uma solicitação.
Use uma opção `--auth-choice` explícita para forçar um endpoint do Coding Plan se sua chave
funcionar em ambos.

## Limites de taxa e sobrecargas

A Z.AI documenta o Coding Plan e as ferramentas de agente de uso geral como serviços
com capacidade gerenciada. Na documentação da própria Z.AI:

- [As ferramentas de agente de uso geral](https://docs.z.ai/devpack/tool/others),
  incluindo o OpenClaw, são fornecidas com base no melhor esforço. Durante períodos de alta carga
  de inferência, normalmente entre 14h e 18h no horário de Singapura, algumas solicitações podem
  enfrentar limites de taxa temporários.
- [Os limites de taxa e simultaneidade do Coding Plan](https://docs.z.ai/devpack/usage-policy)
  estão vinculados ao nível do plano e podem ser ajustados dinamicamente com base na disponibilidade
  de recursos. Horários fora de pico podem ter maior simultaneidade.
- [O código de erro de API `1302`](https://docs.z.ai/api-reference/api-code) significa "Limite
  de taxa de solicitações atingido". O código de erro de API `1305` significa "O serviço pode estar
  temporariamente sobrecarregado; tente novamente mais tarde".

Se receber uma resposta temporária `429` ou `1305` durante um período de alta demanda, aguarde e
tente novamente. Se as falhas forem reproduzíveis fora dos períodos de pico ou ocorrerem apenas
com um endpoint, modelo ou formato de solicitação, verifique primeiro o endpoint
e o modelo configurados:

```bash
openclaw models list --all --provider zai
openclaw config get models.providers.zai.baseUrl
```

As chaves do Coding Plan devem usar um endpoint do Coding Plan, como
`https://api.z.ai/api/coding/paas/v4`; as chaves da API geral devem usar um endpoint da API geral,
como `https://api.z.ai/api/paas/v4`. Falhas persistentes com a mesma
chave e o mesmo endpoint podem indicar uma rejeição do provedor ou uma limitação do plano,
e não uma limitação de taxa normal decorrente de carga de pico.

## Exemplo de configuração

<Tip>
`zai-api-key` permite que o OpenClaw detecte pela chave o endpoint correspondente da Z.AI e
aplique automaticamente a URL base correta. Use as opções regionais explícitas quando
quiser forçar um Coding Plan específico ou uma superfície de API geral.
</Tip>

```json5
{
  env: { ZAI_API_KEY: "sk-..." },
  models: {
    providers: {
      zai: {
        // O GLM-5.2 usa o endpoint do Coding Plan.
        baseUrl: "https://api.z.ai/api/coding/paas/v4",
      },
    },
  },
  agents: { defaults: { model: { primary: "zai/glm-5.2" } } },
}
```

## Catálogo integrado

O plugin do provedor `zai` inclui seu catálogo no manifesto do plugin; portanto, a
listagem somente para leitura pode mostrar linhas GLM conhecidas sem carregar o runtime do provedor:

```bash
openclaw models list --all --provider zai
```

O catálogo baseado no manifesto inclui atualmente:

| Referência do modelo            | Observações                           |
| -------------------- | ------------------------------- |
| `zai/glm-5.2`        | Padrão do Coding Plan; contexto de 1M |
| `zai/glm-5.1`        | Padrão da API geral             |
| `zai/glm-5`          |                                 |
| `zai/glm-5-turbo`    |                                 |
| `zai/glm-5v-turbo`   |                                 |
| `zai/glm-4.7`        |                                 |
| `zai/glm-4.7-flash`  |                                 |
| `zai/glm-4.7-flashx` |                                 |
| `zai/glm-4.6`        |                                 |
| `zai/glm-4.6v`       |                                 |
| `zai/glm-4.5`        |                                 |
| `zai/glm-4.5-air`    |                                 |
| `zai/glm-4.5-flash`  |                                 |
| `zai/glm-4.5v`       |                                 |

<Tip>
Os modelos GLM estão disponíveis como `zai/<model>` (exemplo: `zai/glm-5`).
</Tip>

<Note>
A configuração do Coding Plan usa `zai/glm-5.2` como padrão; a configuração da API geral mantém
`zai/glm-5.1`. Nos endpoints do Coding Plan, a detecção automática usa como alternativas
`glm-5.1` e depois `glm-4.7` quando a chave ou o plano não disponibiliza o GLM-5.2. As versões e
a disponibilidade do GLM podem mudar; execute `openclaw models list --all --provider zai`
para consultar o catálogo conhecido pela versão instalada.
</Note>

## Níveis de raciocínio

<Tabs>
  <Tab title="GLM-5.2">
    Faixa completa: `off`, `low`, `high`, `max` (padrão: `off`). O OpenClaw mapeia
    `low` e `high` para o esforço de raciocínio `high` da Z.AI, e `max` para o esforço
    `max` da Z.AI, por meio de `reasoning_effort` no payload da solicitação.
  </Tab>
  <Tab title="Outros modelos GLM">
    Somente alternância binária: `off` e `low` (exibido como `on` nos seletores), com padrão
    `off`. Definir o raciocínio como `off` envia `thinking: { type: "disabled" }`;
    qualquer outro nível mantém o payload da solicitação inalterado (aplica-se o comportamento
    de raciocínio padrão da própria Z.AI).
  </Tab>
</Tabs>

Definir o raciocínio como `off` evita respostas que consomem o orçamento de saída com
`reasoning_content` antes do texto visível.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Resolução futura de modelos GLM-5 desconhecidos">
    IDs `glm-5*` desconhecidos ainda são resolvidos para versões futuras no caminho do provedor,
    sintetizando metadados pertencentes ao provedor a partir do modelo `glm-4.7` quando o ID
    corresponde ao formato atual da família GLM-5.
  </Accordion>

  <Accordion title="Streaming de chamadas de ferramentas">
    `tool_stream` é habilitado por padrão para o streaming de chamadas de ferramentas da Z.AI. Para desabilitá-lo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/<model>": {
              params: { tool_stream: false },
            },
          },
        },
      },
    }
    ```

  </Accordion>

  <Accordion title="Raciocínio preservado">
    O raciocínio preservado é opcional porque a Z.AI exige que todo o histórico de
    `reasoning_content` seja reproduzido, o que aumenta os tokens do prompt. Habilite-o
    por modelo:

    ```json5
    {
      agents: {
        defaults: {
          models: {
            "zai/glm-5.2": {
              params: { preserveThinking: true },
            },
          },
        },
      },
    }
    ```

    Quando habilitado e o raciocínio está ativado, o OpenClaw envia
    `thinking: { type: "enabled", clear_thinking: false }` e reproduz os
    `reasoning_content` anteriores para a mesma transcrição compatível com a OpenAI. A chave de parâmetro
    em snake_case `preserve_thinking` funciona como alias.

    Usuários avançados ainda podem substituir o payload exato do provedor com
    `params.extra_body.thinking`.

  </Accordion>

  <Accordion title="Compreensão de imagens">
    O plugin da Z.AI registra a compreensão de imagens.

    | Propriedade      | Valor       |
    | ------------- | ----------- |
    | Modelo         | `glm-4.6v`  |

    A compreensão de imagens é resolvida automaticamente com base na autenticação configurada da Z.AI — nenhuma
    configuração adicional é necessária.

  </Accordion>

  <Accordion title="Detalhes da autenticação">
    - A Z.AI usa autenticação Bearer com sua chave de API.
    - A opção de integração inicial `zai-api-key` detecta automaticamente o endpoint correspondente da Z.AI, testando os endpoints compatíveis com sua chave.
    - Use as opções regionais explícitas (`zai-coding-global`, `zai-coding-cn`, `zai-global`, `zai-cn`) quando quiser forçar uma superfície de API específica.
    - A variável de ambiente legada `Z_AI_API_KEY` ainda é aceita; o OpenClaw a copia para `ZAI_API_KEY` na inicialização se `ZAI_API_KEY` não estiver definida.

  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Referência de configuração" href="/pt-BR/gateway/configuration-reference" icon="gear">
    Esquema completo de configuração do OpenClaw, incluindo configurações de provedores e modelos.
  </Card>
</CardGroup>
