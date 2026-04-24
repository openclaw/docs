---
read_when:
    - Você quer usar modelos do Amazon Bedrock com OpenClaw
    - Você precisa de configuração de credenciais/região AWS para chamadas de modelo
summary: Usar modelos do Amazon Bedrock (API Converse) com OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-24T06:06:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7e37aaead5c9bd730b4dd1f2878ff63bebf5537d75ff9df786813c58b1ac2fc0
    source_path: providers/bedrock.md
    workflow: 15
---

O OpenClaw pode usar modelos do **Amazon Bedrock** por meio do provedor de
streaming **Bedrock Converse** do pi-ai. A autenticação do Bedrock usa a
**cadeia padrão de credenciais do AWS SDK**, não uma chave de API.

| Propriedade | Valor                                                       |
| ----------- | ----------------------------------------------------------- |
| Provedor    | `amazon-bedrock`                                            |
| API         | `bedrock-converse-stream`                                   |
| Autenticação | Credenciais AWS (variáveis de ambiente, configuração compartilhada ou papel da instância) |
| Região      | `AWS_REGION` ou `AWS_DEFAULT_REGION` (padrão: `us-east-1`) |

## Primeiros passos

Escolha seu método preferido de autenticação e siga as etapas de configuração.

<Tabs>
  <Tab title="Chaves de acesso / variáveis de ambiente">
    **Ideal para:** máquinas de desenvolvedor, CI ou hosts em que você gerencia credenciais AWS diretamente.

    <Steps>
      <Step title="Defina credenciais AWS no host do gateway">
        ```bash
        export AWS_ACCESS_KEY_ID="AKIA..."
        export AWS_SECRET_ACCESS_KEY="..."
        export AWS_REGION="us-east-1"
        # Opcional:
        export AWS_SESSION_TOKEN="..."
        export AWS_PROFILE="your-profile"
        # Opcional (chave de API/token bearer do Bedrock):
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
    Com autenticação por marcador de env (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` ou `AWS_BEARER_TOKEN_BEDROCK`), o OpenClaw ativa automaticamente o provedor Bedrock implícito para descoberta de modelos sem configuração extra.
    </Tip>

  </Tab>

  <Tab title="Papéis de instância EC2 (IMDS)">
    **Ideal para:** instâncias EC2 com um papel IAM anexado, usando o serviço de metadados da instância para autenticação.

    <Steps>
      <Step title="Ative a descoberta explicitamente">
        Ao usar IMDS, o OpenClaw não consegue detectar autenticação AWS apenas por marcadores de env, então você precisa fazer opt-in:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Opcionalmente adicione um marcador de env para modo automático">
        Se você também quiser que o caminho de detecção automática por marcador de env funcione (por exemplo, para superfícies `openclaw status`):

        ```bash
        export AWS_PROFILE=default
        export AWS_REGION=us-east-1
        ```

        Você **não** precisa de uma chave de API falsa.
      </Step>
      <Step title="Verifique se os modelos são descobertos">
        ```bash
        openclaw models list
        ```
      </Step>
    </Steps>

    <Warning>
    O papel IAM anexado à sua instância EC2 deve ter as seguintes permissões:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (para descoberta automática)
    - `bedrock:ListInferenceProfiles` (para descoberta de perfis de inferência)

    Ou anexe a política gerenciada `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Você só precisa de `AWS_PROFILE=default` se quiser especificamente um marcador de env para modo automático ou superfícies de status. O caminho real de autenticação de runtime do Bedrock usa a cadeia padrão do AWS SDK, então a autenticação por papel de instância IMDS funciona mesmo sem marcadores de env.
    </Note>

  </Tab>
</Tabs>

## Descoberta automática de modelos

O OpenClaw pode descobrir automaticamente modelos do Bedrock que oferecem suporte a **streaming**
e **saída de texto**. A descoberta usa `bedrock:ListFoundationModels` e
`bedrock:ListInferenceProfiles`, e os resultados ficam em cache (padrão: 1 hora).

Como o provedor implícito é ativado:

- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` for `true`,
  o OpenClaw tentará a descoberta mesmo quando nenhum marcador de env AWS estiver presente.
- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` não estiver definido,
  o OpenClaw só adicionará automaticamente o
  provedor Bedrock implícito quando vir um destes marcadores de autenticação AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` ou `AWS_PROFILE`.
- O caminho real de autenticação de runtime do Bedrock ainda usa a cadeia padrão do AWS SDK, então
  configuração compartilhada, SSO e autenticação por papel de instância IMDS podem funcionar mesmo quando a descoberta
  precisou de `enabled: true` para fazer opt-in.

<Note>
Para entradas explícitas `models.providers["amazon-bedrock"]`, o OpenClaw ainda pode resolver antecipadamente a autenticação por marcador de env do Bedrock a partir de marcadores de env AWS como `AWS_BEARER_TOKEN_BEDROCK` sem forçar o carregamento completo da autenticação de runtime. O caminho real de autenticação da chamada de modelo ainda usa a cadeia padrão do AWS SDK.
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
    | ------ | ------- | ----------- |
    | `enabled` | auto | No modo automático, o OpenClaw só ativa o provedor Bedrock implícito quando vê um marcador de env AWS compatível. Defina `true` para forçar a descoberta. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Região AWS usada para chamadas de API de descoberta. |
    | `providerFilter` | (todos) | Corresponde a nomes de provedor Bedrock (por exemplo `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Duração do cache em segundos. Defina `0` para desativar o cache. |
    | `defaultContextWindow` | `32000` | Janela de contexto usada para modelos descobertos (sobrescreva se souber os limites do seu modelo). |
    | `defaultMaxTokens` | `4096` | Máximo de tokens de saída usados para modelos descobertos (sobrescreva se souber os limites do seu modelo). |

  </Accordion>
</AccordionGroup>

## Configuração rápida (caminho AWS)

Este passo a passo cria um papel IAM, anexa permissões do Bedrock, associa
o perfil de instância e ativa a descoberta do OpenClaw no host EC2.

```bash
# 1. Criar papel IAM e perfil de instância
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

# 2. Anexar à sua instância EC2
aws ec2 associate-iam-instance-profile \
  --instance-id i-xxxxx \
  --iam-instance-profile Name=EC2-Bedrock-Access

# 3. Na instância EC2, ativar a descoberta explicitamente
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Opcional: adicionar um marcador de env se quiser o modo automático sem ativação explícita
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verificar se os modelos são descobertos
openclaw models list
```

## Configuração avançada

<AccordionGroup>
  <Accordion title="Perfis de inferência">
    O OpenClaw descobre **perfis de inferência regionais e globais** junto com
    modelos de base. Quando um perfil mapeia para um modelo de base conhecido, o
    perfil herda as capacidades desse modelo (janela de contexto, máximo de tokens,
    raciocínio, visão) e a região correta de requisição do Bedrock é injetada
    automaticamente. Isso significa que perfis Claude entre regiões funcionam sem sobrescritas manuais
    de provedor.

    Os IDs de perfis de inferência têm a forma `us.anthropic.claude-opus-4-6-v1:0` (regional)
    ou `anthropic.claude-opus-4-6-v1:0` (global). Se o modelo subjacente já
    estiver nos resultados de descoberta, o perfil herdará seu conjunto completo de capacidades;
    caso contrário, serão aplicados padrões seguros.

    Nenhuma configuração extra é necessária. Desde que a descoberta esteja ativada e o principal IAM
    tenha `bedrock:ListInferenceProfiles`, os perfis aparecerão junto com
    modelos de base em `openclaw models list`.

  </Accordion>

  <Accordion title="Guardrails">
    Você pode aplicar [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    a todas as invocações de modelo do Bedrock adicionando um objeto `guardrail` à
    configuração do Plugin `amazon-bedrock`. Guardrails permitem aplicar filtragem de conteúdo,
    negação de tópicos, filtros de palavras, filtros de informações sensíveis e verificações de
    aterramento contextual.

    ```json5
    {
      plugins: {
        entries: {
          "amazon-bedrock": {
            config: {
              guardrail: {
                guardrailIdentifier: "abc123", // ID do guardrail ou ARN completo
                guardrailVersion: "1", // número da versão ou "DRAFT"
                streamProcessingMode: "sync", // opcional: "sync" ou "async"
                trace: "enabled", // opcional: "enabled", "disabled" ou "enabled_full"
              },
            },
          },
        },
      },
    }
    ```

    | Opção | Obrigatório | Descrição |
    | ------ | -------- | ----------- |
    | `guardrailIdentifier` | Sim | ID do guardrail (por exemplo `abc123`) ou ARN completo (por exemplo `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Sim | Número da versão publicada, ou `"DRAFT"` para o rascunho em trabalho. |
    | `streamProcessingMode` | Não | `"sync"` ou `"async"` para avaliação de guardrail durante streaming. Se omitido, o Bedrock usa o padrão dele. |
    | `trace` | Não | `"enabled"` ou `"enabled_full"` para depuração; omita ou defina `"disabled"` para produção. |

    <Warning>
    O principal IAM usado pelo gateway deve ter a permissão `bedrock:ApplyGuardrail` além das permissões padrão de invocação.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings para busca de memória">
    O Bedrock também pode servir como provedor de embedding para
    [busca de memória](/pt-BR/concepts/memory-search). Isso é configurado separadamente do
    provedor de inferência — defina `agents.defaults.memorySearch.provider` como `"bedrock"`:

    ```json5
    {
      agents: {
        defaults: {
          memorySearch: {
            provider: "bedrock",
            model: "amazon.titan-embed-text-v2:0", // padrão
          },
        },
      },
    }
    ```

    Embeddings do Bedrock usam a mesma cadeia de credenciais AWS SDK da inferência (papéis de
    instância, SSO, chaves de acesso, configuração compartilhada e identidade web). Nenhuma chave de API é
    necessária. Quando `provider` for `"auto"`, o Bedrock será detectado automaticamente se essa
    cadeia de credenciais for resolvida com sucesso.

    Modelos de embedding compatíveis incluem Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) e TwelveLabs Marengo. Consulte
    [Referência de configuração de memória -- Bedrock](/pt-BR/reference/memory-config#bedrock-embedding-config)
    para a lista completa de modelos e opções de dimensão.

  </Accordion>

  <Accordion title="Observações e limitações">
    - O Bedrock exige **acesso ao modelo** ativado na sua conta/região AWS.
    - A descoberta automática precisa das permissões `bedrock:ListFoundationModels` e
      `bedrock:ListInferenceProfiles`.
    - Se você depender do modo automático, defina um dos marcadores de autenticação AWS compatíveis no
      host do gateway. Se preferir autenticação IMDS/configuração compartilhada sem marcadores de env, defina
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - O OpenClaw expõe a fonte de credenciais nesta ordem: `AWS_BEARER_TOKEN_BEDROCK`,
      depois `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, depois `AWS_PROFILE`, depois a
      cadeia padrão do AWS SDK.
    - O suporte a raciocínio depende do modelo; verifique o card do modelo Bedrock para
      as capacidades atuais.
    - Se você preferir um fluxo gerenciado por chave, também pode colocar um proxy
      compatível com OpenAI na frente do Bedrock e configurá-lo como um provedor OpenAI.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolher provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Busca de memória" href="/pt-BR/concepts/memory-search" icon="magnifying-glass">
    Configuração de embeddings Bedrock para busca de memória.
  </Card>
  <Card title="Referência de configuração de memória" href="/pt-BR/reference/memory-config#bedrock-embedding-config" icon="database">
    Lista completa de modelos de embedding Bedrock e opções de dimensão.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e perguntas frequentes.
  </Card>
</CardGroup>
