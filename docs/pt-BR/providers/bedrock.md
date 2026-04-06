---
read_when:
    - Você quer usar modelos Amazon Bedrock com o OpenClaw
    - Você precisa da configuração de credenciais/região da AWS para chamadas de modelo
summary: Use modelos Amazon Bedrock (Converse API) com o OpenClaw
title: Amazon Bedrock
x-i18n:
    generated_at: "2026-04-06T03:10:46Z"
    model: gpt-5.4
    provider: openai
    source_hash: 70bb29fe9199084b1179ced60935b5908318f5b80ced490bf44a45e0467c4929
    source_path: providers/bedrock.md
    workflow: 15
---

# Amazon Bedrock

O OpenClaw pode usar modelos **Amazon Bedrock** por meio do provider de streaming
**Bedrock Converse** do pi‑ai. A auth do Bedrock usa a **cadeia padrão de credenciais do AWS SDK**,
não uma chave de API.

## O que o pi-ai oferece suporte

- Provider: `amazon-bedrock`
- API: `bedrock-converse-stream`
- Auth: credenciais AWS (variáveis de ambiente, configuração compartilhada ou função de instância)
- Região: `AWS_REGION` ou `AWS_DEFAULT_REGION` (padrão: `us-east-1`)

## Descoberta automática de modelo

O OpenClaw pode descobrir automaticamente modelos Bedrock que oferecem suporte a **streaming**
e **saída de texto**. A descoberta usa `bedrock:ListFoundationModels` e
`bedrock:ListInferenceProfiles`, e os resultados são armazenados em cache (padrão: 1 hora).

Como o provider implícito é habilitado:

- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` for `true`,
  o OpenClaw tentará fazer a descoberta mesmo quando não houver marcador de env da AWS presente.
- Se `plugins.entries.amazon-bedrock.config.discovery.enabled` não estiver definido,
  o OpenClaw só adicionará automaticamente o
  provider Bedrock implícito quando vir um destes marcadores de auth da AWS:
  `AWS_BEARER_TOKEN_BEDROCK`, `AWS_ACCESS_KEY_ID` +
  `AWS_SECRET_ACCESS_KEY` ou `AWS_PROFILE`.
- O caminho real de auth do runtime do Bedrock ainda usa a cadeia padrão do AWS SDK, então
  configuração compartilhada, SSO e auth de função de instância IMDS podem funcionar mesmo quando a descoberta
  precisou de `enabled: true` para ativação explícita.

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

Observações:

- `enabled` usa o padrão modo automático. No modo automático, o OpenClaw só habilita o
  provider Bedrock implícito quando vê um marcador de env da AWS compatível.
- `region` usa como padrão `AWS_REGION` ou `AWS_DEFAULT_REGION`, depois `us-east-1`.
- `providerFilter` corresponde a nomes de provider do Bedrock (por exemplo `anthropic`).
- `refreshInterval` está em segundos; defina `0` para desabilitar o cache.
- `defaultContextWindow` (padrão: `32000`) e `defaultMaxTokens` (padrão: `4096`)
  são usados para modelos descobertos (substitua se você souber os limites do seu modelo).
- Para entradas explícitas `models.providers["amazon-bedrock"]`, o OpenClaw ainda pode
  resolver antecipadamente a auth por marcador de env do Bedrock a partir de marcadores de env da AWS como
  `AWS_BEARER_TOKEN_BEDROCK` sem forçar o carregamento completo da auth em runtime. O
  caminho real de auth para chamada de modelo ainda usa a cadeia padrão do AWS SDK.

## Onboarding

1. Garanta que as credenciais AWS estejam disponíveis no **host do gateway**:

```bash
export AWS_ACCESS_KEY_ID="AKIA..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
# Opcional:
export AWS_SESSION_TOKEN="..."
export AWS_PROFILE="your-profile"
# Opcional (chave de API/bearer token do Bedrock):
export AWS_BEARER_TOKEN_BEDROCK="..."
```

2. Adicione um provider Bedrock e um modelo à sua configuração (não é necessário `apiKey`):

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

## Funções de instância EC2

Ao executar o OpenClaw em uma instância EC2 com uma função IAM anexada, o AWS SDK
pode usar o serviço de metadados da instância (IMDS) para autenticação. Para descoberta de
modelo Bedrock, o OpenClaw só habilita automaticamente o provider implícito a partir de marcadores de env da AWS
a menos que você defina explicitamente
`plugins.entries.amazon-bedrock.config.discovery.enabled: true`.

Configuração recomendada para hosts com IMDS:

- Defina `plugins.entries.amazon-bedrock.config.discovery.enabled` como `true`.
- Defina `plugins.entries.amazon-bedrock.config.discovery.region` (ou exporte `AWS_REGION`).
- Você **não** precisa de uma chave de API falsa.
- Você só precisa de `AWS_PROFILE=default` se quiser especificamente um marcador de env
  para o modo automático ou superfícies de status.

```bash
# Recomendado: habilitação explícita da descoberta + região
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# Opcional: adicione um marcador de env se quiser o modo automático sem habilitação explícita
export AWS_PROFILE=default
export AWS_REGION=us-east-1
```

**Permissões IAM obrigatórias** para a função da instância EC2:

- `bedrock:InvokeModel`
- `bedrock:InvokeModelWithResponseStream`
- `bedrock:ListFoundationModels` (para descoberta automática)
- `bedrock:ListInferenceProfiles` (para descoberta de perfis de inferência)

Ou anexe a política gerenciada `AmazonBedrockFullAccess`.

## Configuração rápida (caminho AWS)

```bash
# 1. Criar função IAM e perfil de instância
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

# 3. Na instância EC2, habilite a descoberta explicitamente
openclaw config set plugins.entries.amazon-bedrock.config.discovery.enabled true
openclaw config set plugins.entries.amazon-bedrock.config.discovery.region us-east-1

# 4. Opcional: adicione um marcador de env se quiser o modo automático sem habilitação explícita
echo 'export AWS_PROFILE=default' >> ~/.bashrc
echo 'export AWS_REGION=us-east-1' >> ~/.bashrc
source ~/.bashrc

# 5. Verifique se os modelos foram descobertos
openclaw models list
```

## Perfis de inferência

O OpenClaw descobre **perfis de inferência regionais e globais** junto com
modelos foundation. Quando um perfil é mapeado para um modelo foundation conhecido, o
perfil herda os recursos desse modelo (janela de contexto, tokens máximos,
reasoning, visão) e a região correta de requisição do Bedrock é injetada
automaticamente. Isso significa que perfis Claude entre regiões funcionam sem sobrescritas manuais
de provider.

IDs de perfil de inferência se parecem com `us.anthropic.claude-opus-4-6-v1:0` (regional)
ou `anthropic.claude-opus-4-6-v1:0` (global). Se o modelo de base já estiver
nos resultados da descoberta, o perfil herda seu conjunto completo de recursos;
caso contrário, padrões seguros são aplicados.

Nenhuma configuração extra é necessária. Desde que a descoberta esteja habilitada e o principal IAM
tenha `bedrock:ListInferenceProfiles`, os perfis aparecem junto com
modelos foundation em `openclaw models list`.

## Observações

- O Bedrock exige **acesso ao modelo** habilitado na sua conta/região AWS.
- A descoberta automática precisa das permissões `bedrock:ListFoundationModels` e
  `bedrock:ListInferenceProfiles`.
- Se você depende do modo automático, defina um dos marcadores de env de auth AWS compatíveis no
  host do gateway. Se preferir auth via IMDS/configuração compartilhada sem marcadores de env, defina
  `plugins.entries.amazon-bedrock.config.discovery.enabled: true`.
- O OpenClaw expõe a origem da credencial nesta ordem: `AWS_BEARER_TOKEN_BEDROCK`,
  depois `AWS_ACCESS_KEY_ID` + `AWS_SECRET_ACCESS_KEY`, depois `AWS_PROFILE`, depois a
  cadeia padrão do AWS SDK.
- O suporte a reasoning depende do modelo; consulte o cartão do modelo Bedrock para
  os recursos atuais.
- Se preferir um fluxo de chave gerenciada, você também pode colocar um proxy
  compatível com OpenAI na frente do Bedrock e configurá-lo como um provider OpenAI.

## Guardrails

Você pode aplicar [Amazon Bedrock Guardrails](https://docs.aws.amazon.com/bedrock/latest/userguide/guardrails.html)
a todas as invocações de modelo Bedrock adicionando um objeto `guardrail` à
configuração do plugin `amazon-bedrock`. Guardrails permitem impor filtragem de conteúdo,
negação de tópicos, filtros de palavras, filtros de informações sensíveis e verificações
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

- `guardrailIdentifier` (obrigatório) aceita um ID de guardrail (ex. `abc123`) ou um
  ARN completo (ex. `arn:aws:bedrock:us-east-1:123456789012:guardrail/abc123`).
- `guardrailVersion` (obrigatório) especifica qual versão publicada usar, ou
  `"DRAFT"` para o rascunho de trabalho.
- `streamProcessingMode` (opcional) controla se a avaliação do guardrail é executada
  de forma síncrona (`"sync"`) ou assíncrona (`"async"`) durante o streaming. Se
  omitido, o Bedrock usa seu comportamento padrão.
- `trace` (opcional) habilita a saída de trace do guardrail na resposta da API. Defina como
  `"enabled"` ou `"enabled_full"` para depuração; omita ou defina `"disabled"` para
  produção.

O principal IAM usado pelo gateway precisa ter a permissão `bedrock:ApplyGuardrail`
além das permissões padrão de invocação.

## Embeddings para busca de memória

O Bedrock também pode servir como provider de embeddings para
[busca de memória](/pt-BR/concepts/memory-search). Isso é configurado separadamente do
provider de inferência — defina `agents.defaults.memorySearch.provider` como `"bedrock"`:

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

Embeddings do Bedrock usam a mesma cadeia de credenciais do AWS SDK usada pela inferência (funções
de instância, SSO, chaves de acesso, configuração compartilhada e identidade web). Nenhuma chave de API é
necessária. Quando `provider` é `"auto"`, o Bedrock é detectado automaticamente se essa
cadeia de credenciais for resolvida com sucesso.

Os modelos de embedding compatíveis incluem Amazon Titan Embed (v1, v2), Amazon Nova
Embed, Cohere Embed (v3, v4) e TwelveLabs Marengo. Consulte
[Referência de configuração de memória — Bedrock](/pt-BR/reference/memory-config#bedrock-embedding-config)
para a lista completa de modelos e opções de dimensão.
