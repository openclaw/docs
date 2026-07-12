---
read_when:
    - Você quer usar modelos OSS hospedados no Bedrock Mantle com o OpenClaw
    - Você precisa do endpoint da Mantle compatível com a OpenAI para GPT-OSS, Qwen, Kimi ou GLM
    - Você quer usar o Claude Sonnet 5 ou o Mythos 5 por meio do Amazon Bedrock Mantle
summary: Use modelos compatíveis com OpenAI e Claude Messages do Amazon Bedrock Mantle com o OpenClaw
title: Amazon Bedrock Mantle
x-i18n:
    generated_at: "2026-07-12T15:30:36Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 107ffdc76e3971a085f7d64d8d766f6cd8706ce882d8bab80d27c72ab545eec1
    source_path: providers/bedrock-mantle.md
    workflow: 16
---

O OpenClaw inclui um provedor **Amazon Bedrock Mantle** integrado que se conecta ao
endpoint compatível com OpenAI do Mantle. O Mantle hospeda modelos de código aberto e
de terceiros (GPT-OSS, Qwen, Kimi, GLM e similares) por meio de uma interface padrão
`/v1/chat/completions` respaldada pela infraestrutura do Bedrock. O Mantle também
disponibiliza modelos Anthropic Claude por meio de uma rota Anthropic Messages.

| Propriedade     | Valor                                                                                                  |
| --------------- | ------------------------------------------------------------------------------------------------------ |
| ID do provedor  | `amazon-bedrock-mantle`                                                                                |
| API             | `openai-completions` para modelos OSS descobertos, `anthropic-messages` para modelos Claude            |
| Autenticação    | `AWS_BEARER_TOKEN_BEDROCK` explícito ou geração de token de portador pela cadeia de credenciais do IAM |
| Região padrão   | `us-east-1` (substitua com `AWS_REGION` ou `AWS_DEFAULT_REGION`)                                       |

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Token de portador explícito">
    **Ideal para:** ambientes nos quais você já tem um token de portador do Mantle.

    <Steps>
      <Step title="Defina o token de portador no host do Gateway">
        ```bash
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```

        Opcionalmente, defina uma região (o padrão é `us-east-1`):

        ```bash
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifique se os modelos foram descobertos">
        ```bash
        openclaw models list
        ```

        Os modelos descobertos aparecem no provedor `amazon-bedrock-mantle`. Nenhuma
        configuração adicional é necessária, a menos que você queira substituir os padrões.
      </Step>
    </Steps>

  </Tab>

  <Tab title="Credenciais do IAM">
    **Ideal para:** usar credenciais compatíveis com o AWS SDK (configuração compartilhada, SSO, identidade da web, funções de instância ou de tarefa).

    <Steps>
      <Step title="Configure as credenciais da AWS no host do Gateway">
        Qualquer fonte de autenticação compatível com o AWS SDK funciona:

        ```bash
        export AWS_PROFILE="default"
        export AWS_REGION="us-west-2"
        ```
      </Step>
      <Step title="Verifique se os modelos foram descobertos">
        ```bash
        openclaw models list
        ```

        O OpenClaw gera automaticamente um token de portador do Mantle a partir da cadeia de credenciais.
      </Step>
    </Steps>

    <Tip>
    Quando `AWS_BEARER_TOKEN_BEDROCK` não está definido, o OpenClaw gera o token de portador para você a partir da cadeia de credenciais padrão da AWS, incluindo credenciais compartilhadas/perfis de configuração, SSO, identidade da web e funções de instância ou de tarefa.
    </Tip>

  </Tab>
</Tabs>

## Descoberta automática de modelos

Quando `AWS_BEARER_TOKEN_BEDROCK` está definido, o OpenClaw o utiliza diretamente. Caso contrário,
o OpenClaw tenta gerar um token de portador do Mantle a partir da cadeia de
credenciais padrão da AWS. Em seguida, ele descobre os modelos disponíveis do Mantle consultando o
endpoint `/v1/models` da região.

| Comportamento             | Detalhe                                                                                              |
| ------------------------- | ---------------------------------------------------------------------------------------------------- |
| Cache de descoberta       | Resultados armazenados em cache por 1 hora por região; uma falha na busca retorna o último resultado armazenado em cache |
| Atualização do token IAM  | A cada 2 horas, armazenado em cache por região                                                       |

Para manter o Plugin Mantle ativado, mas impedir a descoberta automática e a geração
do token de portador do IAM, desative a opção de descoberta pertencente ao Plugin:

```bash
openclaw config set plugins.entries.amazon-bedrock-mantle.config.discovery.enabled false
```

<Note>
O token de portador é o mesmo `AWS_BEARER_TOKEN_BEDROCK` usado pelo provedor padrão [Amazon Bedrock](/pt-BR/providers/bedrock).
</Note>

### Regiões compatíveis

`us-east-1`, `us-east-2`, `us-west-2`, `ap-northeast-1`,
`ap-south-1`, `ap-southeast-3`, `eu-central-1`, `eu-west-1`, `eu-west-2`,
`eu-south-1`, `eu-north-1`, `sa-east-1`.

## Configuração manual

Se você preferir uma configuração explícita em vez da descoberta automática:

```json5
{
  models: {
    providers: {
      "amazon-bedrock-mantle": {
        baseUrl: "https://bedrock-mantle.us-east-1.api.aws/v1",
        api: "openai-completions",
        auth: "api-key",
        apiKey: "env:AWS_BEARER_TOKEN_BEDROCK",
        models: [
          {
            id: "gpt-oss-120b",
            name: "GPT-OSS 120B",
            reasoning: true,
            input: ["text"],
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
            contextWindow: 32000,
            maxTokens: 4096,
          },
        ],
      },
    },
  },
}
```

Uma lista `models` explícita e não vazia é autoritativa e substitui todas as
linhas descobertas, incluindo as linhas do Claude abaixo. Omita `models` para manter o
catálogo automático do Mantle ou inclua as entradas completas dos modelos Claude que
você deseja usar.

## Configuração avançada

<AccordionGroup>
  <Accordion title="Suporte a raciocínio">
    O suporte a raciocínio é inferido de IDs de modelo que contêm padrões como
    `thinking`, `reasoner`, `reasoning`, `deepseek.r`, `gpt-oss-120b` ou
    `gpt-oss-safeguard-120b`. O OpenClaw define `reasoning: true` automaticamente para
    os modelos correspondentes durante a descoberta.
  </Accordion>

  <Accordion title="Indisponibilidade do endpoint">
    Se o endpoint do Mantle estiver indisponível, não retornar modelos ou se a resolução
    do token de portador falhar, a descoberta retornará um resultado vazio e o
    provedor implícito será ignorado. O OpenClaw não gera um erro; os outros provedores
    configurados continuam funcionando normalmente.
  </Accordion>

  <Accordion title="Claude pela rota Anthropic Messages">
    Quando a descoberta automática controla a lista de modelos, o OpenClaw adiciona quatro modelos
    Claude após uma consulta bem-sucedida, independentemente do que `/v1/models` retornar:
    `amazon-bedrock-mantle/anthropic.claude-sonnet-5` (Claude Sonnet 5),
    `amazon-bedrock-mantle/anthropic.claude-opus-4-7` (Claude Opus 4.7) e
    `amazon-bedrock-mantle/anthropic.claude-mythos-5` (Claude Mythos 5), além de
    `amazon-bedrock-mantle/anthropic.claude-mythos-preview` (Claude Mythos
    Preview). Eles usam a interface da API `anthropic-messages` e transmitem pelo
    mesmo endpoint compatível com Anthropic e autenticado por token de portador
    (`<mantle-base>/anthropic`), portanto, o token de portador da AWS não é tratado como uma
    chave de API da Anthropic.

    O Claude Sonnet 5 sempre usa raciocínio adaptativo e adota `high` como nível de
    esforço padrão. `/think off` e `/think minimal` são mapeados para `low` porque a rota
    do Mantle não pode desativar o raciocínio. O OpenClaw também omite a temperatura personalizada nas
    solicitações do Sonnet 5.

    O Claude Mythos 5 tem acesso limitado. Ele disponibiliza uma janela de contexto de
    1,000,000 tokens e um limite de saída de 128,000 tokens, sempre usa raciocínio adaptativo, mapeia
    `/think off` e `/think minimal` para `low` e omite os parâmetros de
    amostragem selecionados pelo chamador.

    O Claude Mythos Preview sempre solicita raciocínio, adotando `high` como nível de
    esforço padrão quando nenhum nível `/think` está definido (`xhigh`/`max` são reduzidos
    para `high`, e `minimal` é elevado para `low`). O Opus 4.7 no Mantle transmite sem
    raciocínio fornecido pelo modelo, e o OpenClaw omite seu parâmetro `temperature`,
    pois o Opus 4.7 não aceita substituições de amostragem nessa rota; o Mythos
    Preview aceita normalmente uma substituição de `temperature`.

    Uma lista explícita e não vazia em `models.providers["amazon-bedrock-mantle"].models`
    substitui o catálogo descoberto completo. Omita essa lista quando quiser
    essas linhas integradas do Claude.

  </Accordion>

  <Accordion title="Relação com o provedor Amazon Bedrock">
    O Bedrock Mantle é um provedor separado do provedor padrão
    [Amazon Bedrock](/pt-BR/providers/bedrock). O Mantle usa uma interface `/v1`
    compatível com OpenAI para seu catálogo OSS, enquanto o provedor padrão
    do Bedrock usa a API nativa Bedrock Converse.

    Ambos os provedores compartilham a mesma credencial `AWS_BEARER_TOKEN_BEDROCK` quando
    ela está presente.

  </Accordion>
</AccordionGroup>

## Conteúdo relacionado

<CardGroup cols={2}>
  <Card title="Amazon Bedrock" href="/pt-BR/providers/bedrock" icon="cloud">
    Provedor nativo do Bedrock para Anthropic Claude, Titan e outros modelos.
  </Card>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="OAuth e autenticação" href="/pt-BR/gateway/authentication" icon="key">
    Detalhes de autenticação e regras de reutilização de credenciais.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Problemas comuns e como resolvê-los.
  </Card>
</CardGroup>
