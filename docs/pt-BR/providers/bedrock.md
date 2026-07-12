---
read_when:
    - Você quer usar modelos do Amazon Bedrock com o OpenClaw
    - Você precisa configurar as credenciais e a região da AWS para chamadas de modelo
summary: Use modelos do Amazon Bedrock (API Converse) com o OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-07-12T00:18:16Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: fda4f5ab8ffcd68012cf78fbedb9fabec36d9742f16518ea4dd38418b2220b7b
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw pode usar modelos do **Amazon Bedrock** por meio de seu provedor de streaming **Bedrock Converse**. A autenticação do Bedrock usa a **cadeia de credenciais padrão do AWS SDK**, não uma chave de API.

| Propriedade | Valor                                                             |
| ----------- | ----------------------------------------------------------------- |
| Provedor    | `amazon-bedrock`                                                  |
| API         | `bedrock-converse-stream`                                         |
| Autenticação | Credenciais da AWS (variáveis de ambiente, configuração compartilhada ou função da instância) |
| Região      | `AWS_REGION` ou `AWS_DEFAULT_REGION` (padrão: `us-east-1`)         |

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chaves de acesso / variáveis de ambiente">
    **Ideal para:** máquinas de desenvolvimento, CI ou hosts nos quais você gerencia diretamente as credenciais da AWS.

    <Steps>
      <Step title="Defina as credenciais da AWS no host do Gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="EXAMPLE_AWS_ACCESS_KEY_ID"
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Adicione um provedor e um modelo do Bedrock à sua configuração">
        Nenhuma `apiKey` é necessária. Configure o provedor com `auth: "aws-sdk"`:

        ```json5
        {
          models: {
            providers: {
              "amazon-bedrock": {
                baseUrl: "https://bedrock-runtime.us-east-1.amazonaws.com",
                api: "bedrock-converse-stream",
                auth: "aws-sdk",
                models: [
                  {
                    id: "us.anthropic.claude-opus-4-6-v1:0",
                    name: "Claude Opus 4.6 (Bedrock)",
                    reasoning: true,
                    input: ["text", "image"],
                    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
                    contextWindow: 200000,
                    maxTokens: 8192,
                  },
                ],
              },
            },
          },
          agents: {
            defaults: {
              model: { primary: "amazon-bedrock/us.anthropic.claude-opus-4-6-v1:0" },
            },
          },
        }
        ```
      </Step>
      <Step title="Verifique se os modelos estão disponíveis">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Tip>
    Com autenticação por marcador de ambiente (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` ou `AWS_BEARER_TOKEN_BEDROCK`), o OpenClaw habilita automaticamente o provedor implícito do Bedrock para a descoberta de modelos, sem configuração adicional.
    </Tip>

  </Tab>

  <Tab title="Funções de instância do EC2 (IMDS)">
    **Ideal para:** instâncias do EC2 com uma função do IAM associada, usando o serviço de metadados da instância para autenticação.

    <Steps>
      <Step title="Habilite explicitamente a descoberta">
        Ao usar o IMDS, o OpenClaw não consegue detectar a autenticação da AWS apenas por marcadores de ambiente; portanto, você precisa habilitá-la explicitamente:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Opcionalmente, adicione um marcador de ambiente para o modo automático">
        Se você também quiser que o caminho de detecção automática por marcador de ambiente funcione (por exemplo, nas telas de `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Você **não** precisa de uma chave de API falsa.
      </Step>
      <Step title="Verifique se os modelos foram descobertos">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    A função do IAM associada à sua instância do EC2 deve ter as seguintes permissões:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (para descoberta automática)
    - `bedrock:ListInferenceProfiles` (para descoberta de perfis de inferência)

    Ou associe a política gerenciada `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Você só precisa de `AWS_PROFILE=default` se quiser especificamente um marcador de ambiente para o modo automático ou para as telas de status. O caminho real de autenticação do runtime do Bedrock usa a cadeia padrão do AWS SDK; portanto, a autenticação pela função da instância via IMDS funciona mesmo sem marcadores de ambiente.
    </Note>

  </Tab>
</Tabs>

## Descoberta automática de modelos

O OpenClaw pode descobrir automaticamente modelos do Bedrock compatíveis com **streaming**
e **saída de texto**. A descoberta usa `bedrock:ListFoundationModels` e
`bedrock:ListInferenceProfiles`, e os resultados são armazenados em cache (padrão: 1 hora).

Como o provedor implícito é habilitado:

- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` for `true`,
  o OpenClaw tentará realizar a descoberta mesmo quando nenhum marcador de ambiente da AWS estiver presente.
- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` não estiver definido,
  o OpenClaw só adicionará automaticamente o
  provedor implícito do Bedrock quando encontrar um destes marcadores de autenticação da AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` ou `AWS_PROFILE`.
- O caminho real de autenticação do runtime do Bedrock ainda usa a cadeia padrão do AWS SDK; portanto,
  a configuração compartilhada, o SSO e a autenticação pela função da instância via IMDS podem funcionar mesmo quando a descoberta
  exigiu `enabled: true` para ser habilitada explicitamente.

<Note>
Para entradas explícitas em `models.providers["amazon-bedrock"]`, o OpenClaw ainda pode resolver antecipadamente a autenticação do Bedrock por marcador de ambiente usando marcadores de ambiente da AWS, como `AWS_BEARER_TOKEN_BEDROCK`, sem forçar o carregamento completo da autenticação do runtime. O caminho real de autenticação das chamadas de modelo ainda usa a cadeia padrão do AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Opções de configuração da descoberta">
    As opções de configuração ficam em `plugins.entries.amazon-bedrock.config.discovery`:

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              discovery: {
                enabled: true,
                region: "us-east-1",
                providerFilter: ["anthropic", "amazon"],
                refreshInterval: 3600,
                defaultContextWindow: 32000,
                defaultMaxTokens: 4096,
              },
            },
          },
        },
      },
    }
    ```

    | Opção | Padrão | Descrição |
    | ----- | ------ | --------- |
    | `enabled` | automático | No modo automático, o OpenClaw só habilita o provedor implícito do Bedrock quando encontra um marcador de ambiente da AWS compatível. Defina como `true` para forçar a descoberta. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Região da AWS usada nas chamadas da API de descoberta. |
    | `providerFilter` | (todos) | Corresponde aos nomes de provedores do Bedrock (por exemplo, `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Duração do cache em segundos. Defina como `0` para desabilitar o cache. |
    | `defaultContextWindow` | `32000` | Janela de contexto usada para modelos descobertos sem limites de tokens conhecidos (substitua se você souber os limites do seu modelo). |
    | `defaultMaxTokens` | `4096` | Número máximo de tokens de saída usado para modelos descobertos sem limites de tokens conhecidos (substitua se você souber os limites do seu modelo). |

  </Accordion>

  <Accordion title="Janela de contexto e limites máximos de tokens">
    As APIs `ListFoundationModels` e `GetFoundationModel` do Bedrock não retornam
    metadados de limites de tokens, apenas o ID e o nome do modelo, as modalidades e o status do
    ciclo de vida. O OpenClaw inclui uma tabela de consulta com janelas de contexto e limites de
    saída conhecidos para modelos populares do Bedrock (Claude, Nova, Llama, Mistral, DeepSeek
    e outros), para que o gerenciamento de sessões, os limites de Compaction e
    a detecção de estouro de contexto funcionem corretamente para esses modelos.

    Os modelos descobertos que não estiverem na tabela usam como alternativa `defaultContextWindow`
    e `defaultMaxTokens`. Se um modelo que você usa não tiver limites precisos,
    substitua-os com uma entrada explícita em
    `models.providers["amazon-bedrock"].models`.

  </Accordion>
</AccordionGroup>

## Configuração rápida (caminho da AWS)

Este passo a passo cria uma função do IAM, associa as permissões do Bedrock, vincula
o perfil da instância e habilita a descoberta do OpenClaw no host do EC2.

```bash
# 1. Create IAM role and instance profile
aws iam create-role --role-name EC2-Bedrock-Access \
  --assume-role-policy-document '{
    "Version": "2012-10-17",
    "Statement": [{
      "Effect": "Allow",
      "Principal": {"Service": "ec2.amazonaws.com"},
      "Action": "sts:AssumeRole"
    }]
  }'

aws iam attach-role-policy --role-name EC2-Bedrock-Access \
  --policy-arn arn:aws:iam::aws:policy/AmazonBedrockFullAccess

aws iam create-instance-profile --instance-profile-name EC2-Bedrock-Access
aws iam add-role-to-instance-profile \
  --instance-profile-name EC2-Bedrock-Access \
  --role-name EC2-Bedrock-Access

# 2. Attach to your EC2 instance
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. On the EC2 instance, enable discovery explicitly
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Optional: add an env marker if you want auto mode without explicit enable
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verify models are discovered
openclaw models list
```

## Configuração avançada

<AccordionGroup>
  <Accordion title="Perfis de inferência">
    O OpenClaw descobre **perfis de inferência regionais e globais** junto com
    os modelos de base. Quando um perfil é mapeado para um modelo de base conhecido, o
    perfil herda os recursos desse modelo (janela de contexto, máximo de tokens,
    raciocínio e visão), e a região correta das solicitações do Bedrock é inserida
    automaticamente. Isso significa que os perfis do Claude entre regiões funcionam sem substituições
    manuais do provedor. Os perfis globais entre regiões (`global.*`) são listados
    primeiro em `openclaw models list`, pois geralmente oferecem maior capacidade
    e failover automático.

    Os IDs dos perfis de inferência têm formatos como `us.anthropic.claude-opus-4-6-v1:0` (regional)
    ou `anthropic.claude-opus-4-6-v1:0` (global). Se o modelo subjacente já estiver
    nos resultados da descoberta, o perfil herdará seu conjunto completo de recursos;
    caso contrário, serão aplicados padrões seguros.

    Nenhuma configuração adicional é necessária. Desde que a descoberta esteja habilitada e a identidade do IAM
    tenha `bedrock:ListInferenceProfiles`, os perfis aparecerão junto com
    os modelos de base em `openclaw models list`.

  </Accordion>

  <Accordion title="Nível de serviço">
    Alguns modelos do Bedrock são compatíveis com um parâmetro `service_tier` para otimizar o custo
    ou a latência. Os seguintes níveis estão disponíveis:

    | Nível | Descrição |
    |-------|-----------|
    | `default` | Nível padrão do Bedrock |
    | `flex` | Processamento com desconto para cargas de trabalho que toleram maior latência |
    | `priority` | Processamento prioritário para cargas de trabalho sensíveis à latência |
    | `reserved` | Capacidade reservada para cargas de trabalho em estado estável |

    Defina `serviceTier` (ou `service_tier`) por meio de `agents.defaults.params` para
    solicitações de modelos do Bedrock ou por modelo em
    `agents.defaults.models["<model-key>"].params`:

    ```json5
    {
      agents: {
        defaults: {
          params: {
            serviceTier: "flex", // applies to all models
          },
          models: {
            "amazon-bedrock/mistral.mistral-large-3-675b-instruct": {
              params: {
                serviceTier: "priority", // per-model override
              },
            },
          },
        },
      },
    }
    ```

    Os valores válidos são `default`, `flex`, `priority` e `reserved`. Claude
    Fable 5 e Sonnet 5 aceitam apenas a modalidade `default`; o OpenClaw emite
    um aviso e ignora `flex`, `priority` ou `reserved` quando solicitados para
    esses modelos. Para outros modelos, nem todos aceitam todas as modalidades
    — uma modalidade não aceita retorna um erro de validação do Bedrock, e a
    mensagem de erro pode ser enganosa (por exemplo, "O identificador de modelo
    fornecido é inválido", em vez de indicar a modalidade como o problema). Se
    esse erro ocorrer, verifique se o modelo aceita a modalidade solicitada.

  </Accordion>

  <Accordion title="Temperatura do Claude Opus 4.7 e 4.8">
    O Bedrock rejeita o parâmetro `temperature` para Claude Opus 4.7 e Opus
    4.8. O OpenClaw omite `temperature` automaticamente para qualquer referência
    correspondente do Bedrock, incluindo IDs de modelos básicos, perfis de
    inferência nomeados, perfis de inferência de aplicações cujo modelo
    subjacente seja resolvido como Opus 4.7/4.8 por meio de
    `bedrock:GetInferenceProfile` e variantes pontuadas `opus-4.7`/`opus-4.8`
    com prefixos regionais opcionais (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`,
    `global.`). Nenhuma opção de configuração é necessária, e a omissão se
    aplica tanto ao objeto de opções da solicitação quanto ao campo
    `inferenceConfig` da carga útil.
  </Accordion>

  <Accordion title="Claude Fable 5">
    Use `amazon-bedrock/anthropic.claude-fable-5` em `us-east-1` ou os IDs de
    inferência regionais, como `us.anthropic.claude-fable-5`.
    O OpenClaw aplica a janela de contexto de 1 milhão do Fable, o limite de
    saída de 128 mil, o pensamento adaptativo sempre ativo e o mapeamento de
    esforço compatível. `/think off` e `/think minimal` são mapeados para
    `low`; os controles de temperatura e de escolha forçada de ferramenta são
    omitidos, assim como na rota do Opus 4.7/4.8. A saída em streaming é retida
    até que o Bedrock retorne um status final, para que recusas no meio do fluxo
    não exponham texto parcial.

    A AWS exige uma adesão explícita à retenção de dados `provider_data_share`
    para que o Fable fique disponível. Prompts e conclusões são compartilhados
    com a Anthropic e retidos por até 30 dias para fins de confiança e segurança.
    Analise e configure a
    [retenção de dados do Bedrock](https://docs.aws.amazon.com/bedrock/latest/userguide/data-retention.html)
    antes de habilitar o modelo.

  </Accordion>

  <Accordion title="Claude Mythos 5">
    O Claude Mythos 5 está disponível pelo Bedrock somente para contas com a
    aprovação de acesso limitado necessária. O OpenClaw reconhece o modelo
    básico `anthropic.claude-mythos-5` e perfis de inferência regionais ou
    globais, como `us.anthropic.claude-mythos-5`.

    O OpenClaw aplica a janela de contexto de 1.000.000 de tokens, o limite de
    saída de 128.000 tokens, entrada de imagens, cache de prompts, streaming
    seguro contra recusas e níveis de esforço nativos. O pensamento adaptativo
    permanece sempre habilitado: `/think off` e `/think minimal` são mapeados
    para `low`, enquanto `xhigh` e `max` continuam disponíveis. Valores
    personalizados de amostragem e de escolha forçada de ferramenta são
    omitidos.

  </Accordion>

  <Accordion title="Claude Sonnet 5">
    A AWS documenta o Sonnet 5 para os endpoints
    [`bedrock-runtime` e `bedrock-mantle`](https://docs.aws.amazon.com/bedrock/latest/userguide/model-card-anthropic-claude-sonnet-5.html).
    O OpenClaw reconhece o modelo básico do Bedrock
    `anthropic.claude-sonnet-5` e perfis de inferência regionais ou globais,
    como `us.anthropic.claude-sonnet-5`. Ele aplica a janela de contexto de
    1.000.000 de tokens, o limite de saída de 128.000 tokens, entrada de imagens,
    níveis de esforço nativos, cache de prompts e streaming seguro contra
    recusas.

    O Bedrock mantém o pensamento adaptativo habilitado para o Sonnet 5. O
    padrão do OpenClaw é `high`; `/think off` e `/think minimal` são mapeados
    para `low`, pois essa rota não pode desabilitar o pensamento. Valores
    personalizados de temperatura e de escolha forçada de ferramenta são
    omitidos enquanto o pensamento adaptativo está ativo.

  </Accordion>

  <Accordion title="Proteções">
    Você pode aplicar o [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    a todas as invocações de modelos do Bedrock adicionando um objeto `guardrail`
    à configuração do Plugin `amazon-bedrock`. As proteções permitem impor
    filtragem de conteúdo, bloqueio de tópicos, filtros de palavras, filtros de
    informações confidenciais e verificações de fundamentação contextual.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // guardrail ID or full ARN
                guardrailVersion: "1", // version number or "DRAFT"
                streamProcessingMode: "sync", // optional: "sync" or "async"
                trace: "enabled", // optional: "enabled", "disabled", or "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    `guardrailIdentifier` e `guardrailVersion` são obrigatórios.

    | Opção | Descrição |
    | ----- | --------- |
    | `guardrailIdentifier` | ID da proteção (por exemplo, `abc123`) ou ARN completo (por exemplo, `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Número da versão publicada ou `"DRAFT"` para o rascunho em desenvolvimento. |
    | `streamProcessingMode` | `"sync"` ou `"async"` para a avaliação da proteção durante o streaming. Se omitido, o Bedrock usa seu padrão. |
    | `trace` | `"enabled"` ou `"enabled_full"` para depuração; omita ou defina como `"disabled"` em produção. |

    <Warning>
    A entidade principal do IAM usada pelo Gateway deve ter a permissão `bedrock:ApplyGuardrail`, além das permissões de invocação padrão.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings para busca na memória">
    O Bedrock também pode atuar como provedor de embeddings para a
    [busca na memória](/pt-BR/concepts/memory-search). Isso é configurado separadamente
    do provedor de inferência — defina `agents.defaults.memorySearch.provider`
    como `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // default
          },
        },
      },
    }
    ```

    Os embeddings do Bedrock usam a mesma cadeia de credenciais do AWS SDK
    usada para inferência (funções de instância, SSO, chaves de acesso,
    configuração compartilhada e identidade da Web). Nenhuma chave de API é
    necessária.

    Os modelos de embedding compatíveis incluem Amazon Titan Embed (v1, v2),
    Amazon Nova Embed, Cohere Embed (v3, v4) e TwelveLabs Marengo. Consulte a
    [referência de configuração de memória — Bedrock](/pt-BR/reference/memory-config#bedrock-embedding-config)
    para ver a lista completa de modelos e as opções de dimensão.

  </Accordion>

  <Accordion title="Observações e ressalvas">
    - O Bedrock exige que o **acesso ao modelo** esteja habilitado em sua
      conta/região da AWS.
    - A descoberta automática exige as permissões `bedrock:ListFoundationModels`
      e `bedrock:ListInferenceProfiles`.
    - Se você depender do modo automático, defina um dos marcadores de ambiente
      de autenticação da AWS compatíveis no host do Gateway. Se preferir
      autenticação via IMDS/configuração compartilhada sem marcadores de ambiente,
      defina `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - O OpenClaw apresenta a origem das credenciais nesta ordem:
      `AWS_BEARER_TOKEN_BEDROCK`, depois `AWS_ACCESS_KEY_ID` +
      `AWS_SECRET_ACCESS_KEY`, depois `AWS_PROFILE` e, por fim, a cadeia padrão
      do AWS SDK.
    - A compatibilidade com raciocínio depende do modelo; consulte o cartão do
      modelo do Bedrock para verificar os recursos atuais.
    - Se preferir um fluxo de chaves gerenciado, você também pode colocar um
      proxy compatível com a OpenAI diante do Bedrock e configurá-lo como um
      provedor da OpenAI.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelos e comportamento de failover.
  </Card>
  <Card title="Busca na memória" href="/pt-BR/concepts/memory-search" icon="magnifying-glass">
    Embeddings do Bedrock para a configuração da busca na memória.
  </Card>
  <Card title="Referência de configuração de memória" href="/pt-BR/reference/memory-config#bedrock-embedding-config" icon="database">
    Lista completa de modelos de embedding do Bedrock e opções de dimensão.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução geral de problemas e perguntas frequentes.
  </Card>
</CardGroup>
