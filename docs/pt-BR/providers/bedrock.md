---
read_when:
    - Você quer usar modelos do Amazon Bedrock com o OpenClaw
    - Você precisa configurar credenciais/região da AWS para chamadas de modelo
summary: Use modelos do Amazon Bedrock (API Converse) com o OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-30T10:03:48Z"
    model: gpt-5.5
    provider: openai
    source_hash: d6c08ab141423a70e5283ddaf72bf6396bcef411dfa36e1c4b5632377f8ea2d8
    source_path: providers/bedrock.md
    workflow: 16
---

OpenClaw pode usar modelos **Amazon Bedrock** por meio do provedor de streaming **Bedrock Converse** da pi-ai. A autenticação do Bedrock usa a **cadeia padrão de credenciais do AWS SDK**, não uma chave de API.

| Propriedade | Valor                                                                  |
| ----------- | ---------------------------------------------------------------------- |
| Provedor    | `amazon-bedrock`                                                       |
| API         | `bedrock-converse-stream`                                              |
| Autenticação | credenciais da AWS (variáveis de ambiente, configuração compartilhada ou função da instância) |
| Região      | `AWS_REGION` ou `AWS_DEFAULT_REGION` (padrão: `us-east-1`)             |

## Primeiros passos

Escolha seu método de autenticação preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chaves de acesso / variáveis de ambiente">
    **Ideal para:** máquinas de desenvolvimento, CI ou hosts onde você gerencia credenciais da AWS diretamente.

    <Steps>
      <Step title="Defina as credenciais da AWS no host do gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Optional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Optional (Bedrock API key/bearer token):
        export AWS_BEARER_TOKEN_BEDROCK="..."
        ```
      </Step>
      <Step title="Adicione um provedor Bedrock e um modelo à sua configuração">
        Nenhum `apiKey` é necessário. Configure o provedor com `auth: "aws-sdk"`:

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
    Com autenticação por marcador de ambiente (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` ou `AWS_BEARER_TOKEN_BEDROCK`), o OpenClaw habilita automaticamente o provedor Bedrock implícito para descoberta de modelos sem configuração extra.
    </Tip>

  </Tab>

  <Tab title="Funções de instância EC2 (IMDS)">
    **Ideal para:** instâncias EC2 com uma função IAM anexada, usando o serviço de metadados da instância para autenticação.

    <Steps>
      <Step title="Habilite a descoberta explicitamente">
        Ao usar IMDS, o OpenClaw não consegue detectar autenticação da AWS apenas por marcadores de ambiente, então você deve optar por habilitá-la:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Opcionalmente, adicione um marcador de ambiente para o modo automático">
        Se você também quiser que o caminho de detecção automática por marcador de ambiente funcione (por exemplo, para superfícies de `openclaw status`):

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
    A função IAM anexada à sua instância EC2 deve ter as seguintes permissões:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (para descoberta automática)
    - `bedrock:ListInferenceProfiles` (para descoberta de perfis de inferência)

    Ou anexe a política gerenciada `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Você só precisa de `AWS_PROFILE=default` se quiser especificamente um marcador de ambiente para o modo automático ou superfícies de status. O caminho real de autenticação em tempo de execução do Bedrock usa a cadeia padrão do AWS SDK, então a autenticação por função de instância via IMDS funciona mesmo sem marcadores de ambiente.
    </Note>

  </Tab>
</Tabs>

## Descoberta automática de modelos

O OpenClaw pode descobrir automaticamente modelos Bedrock que oferecem suporte a **streaming** e **saída de texto**. A descoberta usa `bedrock:ListFoundationModels` e `bedrock:ListInferenceProfiles`, e os resultados ficam em cache (padrão: 1 hora).

Como o provedor implícito é habilitado:

- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` for `true`, o OpenClaw tentará a descoberta mesmo quando nenhum marcador de ambiente da AWS estiver presente.
- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` não estiver definido, o OpenClaw só adiciona automaticamente o provedor Bedrock implícito quando vê um destes marcadores de autenticação da AWS: `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY` ou `AWS_PROFILE`.
- O caminho real de autenticação em tempo de execução do Bedrock ainda usa a cadeia padrão do AWS SDK, então configuração compartilhada, SSO e autenticação por função de instância via IMDS podem funcionar mesmo quando a descoberta precisou de `enabled: true` para ser habilitada.

<Note>
Para entradas explícitas de `models.providers["amazon-bedrock"]`, o OpenClaw ainda pode resolver antecipadamente a autenticação Bedrock por marcador de ambiente a partir de marcadores de ambiente da AWS, como `AWS_BEARER_TOKEN_BEDROCK`, sem forçar o carregamento completo da autenticação em tempo de execução. O caminho real de autenticação de chamada de modelo ainda usa a cadeia padrão do AWS SDK.
</Note>

<AccordionGroup>
  <Accordion title="Opções de configuração de descoberta">
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
    | `enabled` | auto | No modo automático, o OpenClaw só habilita o provedor Bedrock implícito quando vê um marcador de ambiente da AWS compatível. Defina como `true` para forçar a descoberta. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Região da AWS usada para chamadas da API de descoberta. |
    | `providerFilter` | (todos) | Corresponde a nomes de provedores Bedrock (por exemplo, `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Duração do cache em segundos. Defina como `0` para desabilitar o cache. |
    | `defaultContextWindow` | `32000` | Janela de contexto usada para modelos descobertos (substitua se você souber os limites do seu modelo). |
    | `defaultMaxTokens` | `4096` | Máximo de tokens de saída usado para modelos descobertos (substitua se você souber os limites do seu modelo). |

  </Accordion>
</AccordionGroup>

## Configuração rápida (caminho AWS)

Este passo a passo cria uma função IAM, anexa permissões do Bedrock, associa o perfil de instância e habilita a descoberta do OpenClaw no host EC2.

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
    O OpenClaw descobre **perfis de inferência regionais e globais** junto com modelos foundation. Quando um perfil mapeia para um modelo foundation conhecido, o perfil herda os recursos desse modelo (janela de contexto, máximo de tokens, raciocínio, visão), e a região correta da solicitação Bedrock é injetada automaticamente. Isso significa que perfis Claude entre regiões funcionam sem substituições manuais de provedor.

    IDs de perfil de inferência se parecem com `us.anthropic.claude-opus-4-6-v1:0` (regional) ou `anthropic.claude-opus-4-6-v1:0` (global). Se o modelo subjacente já estiver nos resultados da descoberta, o perfil herdará seu conjunto completo de recursos; caso contrário, padrões seguros serão aplicados.

    Nenhuma configuração extra é necessária. Desde que a descoberta esteja habilitada e o principal IAM tenha `bedrock:ListInferenceProfiles`, os perfis aparecem junto com os modelos foundation em `openclaw models list`.

  </Accordion>

  <Accordion title="Temperatura do Claude Opus 4.7">
    O Bedrock rejeita o parâmetro `temperature` para o Claude Opus 4.7. O OpenClaw omite `temperature` automaticamente para qualquer referência Bedrock Opus 4.7, incluindo IDs de modelos foundation, perfis de inferência nomeados, perfis de inferência de aplicação cujo modelo subjacente resolve para Opus 4.7 via `bedrock:GetInferenceProfile` e variantes pontuadas de `opus-4.7` com prefixos de região opcionais (`us.`, `eu.`, `ap.`, `apac.`, `au.`, `jp.`, `global.`). Nenhum ajuste de configuração é necessário, e a omissão se aplica tanto ao objeto de opções da solicitação quanto ao campo de payload `inferenceConfig`.
  </Accordion>

  <Accordion title="Guardrails">
    Você pode aplicar [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html) a todas as invocações de modelos Bedrock adicionando um objeto `guardrail` à configuração do Plugin `amazon-bedrock`. Guardrails permitem impor filtragem de conteúdo, negação de tópicos, filtros de palavras, filtros de informações sensíveis e verificações de fundamentação contextual.

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

    | Opção | Obrigatório | Descrição |
    | ----- | ----------- | --------- |
    | `guardrailIdentifier` | Sim | ID do guardrail (por exemplo, `abc123`) ou ARN completo (por exemplo, `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Sim | Número da versão publicada, ou `"DRAFT"` para o rascunho de trabalho. |
    | `streamProcessingMode` | Não | `"sync"` ou `"async"` para avaliação do guardrail durante streaming. Se omitido, o Bedrock usa seu padrão. |
    | `trace` | Não | `"enabled"` ou `"enabled_full"` para depuração; omita ou defina `"disabled"` para produção. |

    <Warning>
    O principal IAM usado pelo Gateway deve ter a permissão `bedrock:ApplyGuardrail` além das permissões de invocação padrão.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings para busca de memória">
    O Bedrock também pode atuar como o provedor de embeddings para
    [busca de memória](/pt-BR/concepts/memory-search). Isso é configurado separadamente do
    provedor de inferência -- defina `agents.defaults.memorySearch.provider` como `"bedrock"`:

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

    Os embeddings do Bedrock usam a mesma cadeia de credenciais do AWS SDK usada para inferência (funções de
    instância, SSO, chaves de acesso, configuração compartilhada e identidade web). Nenhuma chave de API é
    necessária. Quando `provider` é `"auto"`, o Bedrock é detectado automaticamente se essa
    cadeia de credenciais for resolvida com sucesso.

    Os modelos de embedding compatíveis incluem Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) e TwelveLabs Marengo. Consulte a
    [referência de configuração de memória -- Bedrock](/pt-BR/reference/memory-config#bedrock-embedding-config)
    para ver a lista completa de modelos e as opções de dimensão.

  </Accordion>

  <Accordion title="Notas e ressalvas">
    - O Bedrock exige **acesso ao modelo** habilitado na sua conta/região da AWS.
    - A descoberta automática precisa das permissões `bedrock:ListFoundationModels` e
      `bedrock:ListInferenceProfiles`.
    - Se você depende do modo automático, defina um dos marcadores de ambiente de autenticação da AWS compatíveis no
      host do Gateway. Se preferir autenticação IMDS/configuração compartilhada sem marcadores de ambiente, defina
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - O OpenClaw expõe a origem das credenciais nesta ordem: `AWS_BEARER_TOKEN_BEDROCK`,
      depois `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, depois `AWS_PROFILE`, depois a
      cadeia padrão do AWS SDK.
    - O suporte a raciocínio depende do modelo; consulte a ficha do modelo do Bedrock para ver as
      capacidades atuais.
    - Se preferir um fluxo de chave gerenciada, você também pode colocar um proxy compatível com OpenAI
      na frente do Bedrock e configurá-lo como um provedor OpenAI.
  </Accordion>
</AccordionGroup>

## Relacionados

<CardGroup cols={2}>
  <Card title="Seleção de modelos" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, refs de modelos e comportamento de failover.
  </Card>
  <Card title="Busca de memória" href="/pt-BR/concepts/memory-search" icon="magnifying-glass">
    Embeddings do Bedrock para configuração de busca de memória.
  </Card>
  <Card title="Referência de configuração de memória" href="/pt-BR/reference/memory-config#bedrock-embedding-config" icon="database">
    Lista completa de modelos de embedding do Bedrock e opções de dimensão.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas gerais e FAQ.
  </Card>
</CardGroup>
