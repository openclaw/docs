---
read_when:
    - Você quer usar modelos do Amazon Bedrock com o OpenClaw
    - Você precisa configurar credenciais/região da AWS para chamadas de modelo
summary: Use modelos do Amazon Bedrock (Converse API) com o OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-12T23:30:06Z"
    model: gpt-5.4
    provider: openai
    source_hash: 88e7e24907ec26af098b648e2eeca32add090a9e381c818693169ab80aeccc47
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

O OpenClaw pode usar modelos do **Amazon Bedrock** por meio do provedor de streaming **Bedrock Converse** do pi-ai. A auth do Bedrock usa a **cadeia de credenciais padrão do AWS SDK**,
não uma chave de API.

| Propriedade | Valor                                                      |
| ----------- | ---------------------------------------------------------- |
| Provedor    | `amazon-bedrock`                                           |
| API         | `bedrock-converse-stream`                                  |
| Auth        | credenciais AWS (variáveis de ambiente, config compartilhada ou função da instância) |
| Região      | `AWS_REGION` ou `AWS_DEFAULT_REGION` (padrão: `us-east-1`) |

## Primeiros passos

Escolha seu método de auth preferido e siga as etapas de configuração.

<Tabs>
  <Tab title="Chaves de acesso / variáveis de ambiente">
    **Ideal para:** máquinas de desenvolvimento, CI ou hosts em que você gerencia credenciais AWS diretamente.

    <Steps>
      <Step title="Defina credenciais AWS no host do Gateway">
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
      <Step title="Adicione um provedor e um modelo Bedrock à sua configuração">
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
    Com auth por marcador de ambiente (`AWS_ACCESS_KEY_ID`, `AWS_PROFILE` ou `AWS_BEARER_TOKEN_BEDROCK`), o OpenClaw ativa automaticamente o provedor implícito do Bedrock para descoberta de modelos sem configuração adicional.
    </Tip>

  </Tab>

  <Tab title="Funções de instância EC2 (IMDS)">
    **Ideal para:** instâncias EC2 com uma função do IAM anexada, usando o serviço de metadados da instância para autenticação.

    <Steps>
      <Step title="Ative a descoberta explicitamente">
        Ao usar IMDS, o OpenClaw não consegue detectar auth da AWS apenas por marcadores de ambiente, então você precisa ativar manualmente:

        ```bash
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
        openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1
        ```
      </Step>
      <Step title="Opcionalmente adicione um marcador de ambiente para o modo automático">
        Se você também quiser que o caminho de autodetecção por marcador de ambiente funcione (por exemplo, para superfícies de `openclaw status`):

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
    A função do IAM anexada à sua instância EC2 precisa ter as seguintes permissões:

    - `bedrock:InvokeModel`
    - `bedrock:InvokeModelWithResponseStream`
    - `bedrock:ListFoundationModels` (para descoberta automática)
    - `bedrock:ListInferenceProfiles` (para descoberta de perfis de inferência)

    Ou anexe a política gerenciada `AmazonBedrockFullAccess`.
    </Warning>

    <Note>
    Você só precisa de `AWS_PROFILE=default` se quiser especificamente um marcador de ambiente para o modo automático ou para superfícies de status. O caminho real de auth do Bedrock em tempo de execução usa a cadeia padrão do AWS SDK, então a auth por função de instância via IMDS funciona mesmo sem marcadores de ambiente.
    </Note>

  </Tab>
</Tabs>

## Descoberta automática de modelos

O OpenClaw pode descobrir automaticamente modelos do Bedrock que suportam **streaming**
e **saída de texto**. A descoberta usa `bedrock:ListFoundationModels` e
`bedrock:ListInferenceProfiles`, e os resultados são armazenados em cache (padrão: 1 hora).

Como o provedor implícito é ativado:

- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` for `true`,
  o OpenClaw tentará a descoberta mesmo quando nenhum marcador de ambiente AWS estiver presente.
- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` não estiver definido,
  o OpenClaw só adicionará automaticamente o
  provedor implícito do Bedrock quando encontrar um destes marcadores de auth da AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` ou `AWS_PROFILE`.
- O caminho real de auth do Bedrock em tempo de execução ainda usa a cadeia padrão do AWS SDK, então
  auth por config compartilhada, SSO e função de instância via IMDS podem funcionar mesmo quando a descoberta
  precisou de `enabled: true` para ativação manual.

<Note>
Para entradas explícitas `models.providers["amazon-bedrock"]`, o OpenClaw ainda pode resolver antecipadamente auth do Bedrock por marcador de ambiente a partir de marcadores AWS como `AWS_BEARER_TOKEN_BEDROCK` sem forçar o carregamento completo da auth em tempo de execução. O caminho real de auth de chamada de modelo ainda usa a cadeia padrão do AWS SDK.
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
    | `enabled` | auto | No modo automático, o OpenClaw só ativa o provedor implícito do Bedrock quando encontra um marcador de ambiente AWS compatível. Defina `true` para forçar a descoberta. |
    | `region` | `AWS_REGION` / `AWS_DEFAULT_REGION` / `us-east-1` | Região AWS usada para chamadas de API de descoberta. |
    | `providerFilter` | (todos) | Corresponde aos nomes de provedores do Bedrock (por exemplo `anthropic`, `amazon`). |
    | `refreshInterval` | `3600` | Duração do cache em segundos. Defina `0` para desativar o cache. |
    | `defaultContextWindow` | `32000` | Janela de contexto usada para modelos descobertos (substitua se você souber os limites do seu modelo). |
    | `defaultMaxTokens` | `4096` | Máximo de tokens de saída usado para modelos descobertos (substitua se você souber os limites do seu modelo). |

  </Accordion>
</AccordionGroup>

## Configuração rápida (caminho AWS)

Este passo a passo cria uma função do IAM, anexa permissões do Bedrock, associa
o perfil da instância e ativa a descoberta do OpenClaw no host EC2.

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
    os modelos foundation. Quando um perfil é mapeado para um modelo foundation conhecido, o
    perfil herda os recursos desse modelo (janela de contexto, máximo de tokens,
    raciocínio, visão) e a região correta de solicitação do Bedrock é injetada
    automaticamente. Isso significa que perfis Claude entre regiões funcionam sem substituições manuais
    do provedor.

    Os IDs de perfil de inferência se parecem com `us.anthropic.claude-opus-4-6-v1:0` (regional)
    ou `anthropic.claude-opus-4-6-v1:0` (global). Se o modelo de origem já estiver
    nos resultados da descoberta, o perfil herda seu conjunto completo de recursos;
    caso contrário, são aplicados padrões seguros.

    Nenhuma configuração extra é necessária. Desde que a descoberta esteja ativada e o principal do IAM
    tenha `bedrock:ListInferenceProfiles`, os perfis aparecem junto com
    os modelos foundation em `openclaw models list`.

  </Accordion>

  <Accordion title="Guardrails">
    Você pode aplicar [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
    a todas as invocações de modelo do Bedrock adicionando um objeto `guardrail` à
    configuração do plugin `amazon-bedrock`. Os Guardrails permitem aplicar filtragem de conteúdo,
    bloqueio de tópicos, filtros de palavras, filtros de informações sensíveis e verificações
    de grounding contextual.

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
    | ------ | ----------- | ----------- |
    | `guardrailIdentifier` | Sim | ID do guardrail (ex.: `abc123`) ou ARN completo (ex.: `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`). |
    | `guardrailVersion` | Sim | Número da versão publicada ou `"DRAFT"` para o rascunho de trabalho. |
    | `streamProcessingMode` | Não | `"sync"` ou `"async"` para avaliação do guardrail durante o streaming. Se omitido, o Bedrock usa o padrão dele. |
    | `trace` | Não | `"enabled"` ou `"enabled_full"` para depuração; omita ou defina `"disabled"` para produção. |

    <Warning>
    O principal do IAM usado pelo Gateway precisa ter a permissão `bedrock:ApplyGuardrail` além das permissões padrão de invocação.
    </Warning>

  </Accordion>

  <Accordion title="Embeddings para pesquisa de memória">
    O Bedrock também pode servir como provedor de embeddings para
    a [pesquisa de memória](/pt-BR/concepts/memory-search). Isso é configurado separadamente do
    provedor de inferência -- defina `agents.defaults.memorySearch.provider` como `"bedrock"`:

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

    Os embeddings do Bedrock usam a mesma cadeia de credenciais do AWS SDK da inferência (funções de
    instância, SSO, chaves de acesso, config compartilhada e identidade web). Nenhuma chave de API é
    necessária. Quando `provider` é `"auto"`, o Bedrock é detectado automaticamente se essa
    cadeia de credenciais for resolvida com sucesso.

    Os modelos de embeddings compatíveis incluem Amazon Titan Embed (v1, v2), Amazon Nova
    Embed, Cohere Embed (v3, v4) e TwelveLabs Marengo. Consulte
    a [Referência de configuração de memória -- Bedrock](/pt-BR/reference/memory-config#bedrock-embedding-config)
    para a lista completa de modelos e opções de dimensão.

  </Accordion>

  <Accordion title="Observações e ressalvas">
    - O Bedrock exige que o **acesso ao modelo** esteja ativado na sua conta/região AWS.
    - A descoberta automática precisa das permissões `bedrock:ListFoundationModels` e
      `bedrock:ListInferenceProfiles`.
    - Se você depende do modo automático, defina um dos marcadores de ambiente de auth da AWS compatíveis no
      host do Gateway. Se você preferir auth por IMDS/config compartilhada sem marcadores de ambiente, defina
      `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
    - O OpenClaw expõe a origem da credencial nesta ordem: `AWS_BEARER_TOKEN_BEDROCK`,
      depois `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, depois `AWS_PROFILE`, depois a
      cadeia padrão do AWS SDK.
    - O suporte a raciocínio depende do modelo; consulte o model card do Bedrock para ver
      os recursos atuais.
    - Se você preferir um fluxo de chave gerenciada, também pode colocar um
      proxy compatível com OpenAI na frente do Bedrock e configurá-lo como um provedor OpenAI.
  </Accordion>
</AccordionGroup>

## Relacionado

<CardGroup cols={2}>
  <Card title="Seleção de modelo" href="/pt-BR/concepts/model-providers" icon="layers">
    Escolha de provedores, referências de modelo e comportamento de failover.
  </Card>
  <Card title="Pesquisa de memória" href="/pt-BR/concepts/memory-search" icon="magnifying-glass">
    Configuração de embeddings do Bedrock para pesquisa de memória.
  </Card>
  <Card title="Referência de configuração de memória" href="/pt-BR/reference/memory-config#bedrock-embedding-config" icon="database">
    Lista completa de modelos de embeddings do Bedrock e opções de dimensão.
  </Card>
  <Card title="Solução de problemas" href="/pt-BR/help/troubleshooting" icon="wrench">
    Solução de problemas geral e FAQ.
  </Card>
</CardGroup>
