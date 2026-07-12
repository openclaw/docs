---
read_when:
    - Você quer que o OpenClaw leia chaves de API do HashiCorp Vault
    - Você está configurando SecretRefs em uma máquina local ou servidor
    - Você precisa configurar as credenciais do provedor de modelos com suporte do Vault
summary: Use o Plugin Vault incluído para resolver SecretRefs do HashiCorp Vault
title: SecretRefs do cofre
x-i18n:
    generated_at: "2026-07-12T15:37:13Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c1fa4895414e8cf44bb4ada191a7f7aa7b4eeda58f16be04d0c77080b7af96e3
    source_path: plugins/vault.md
    workflow: 16
---

# SecretRefs do Vault

O plugin Vault incluído permite que o OpenClaw resolva SecretRefs do tipo `exec` no
HashiCorp Vault durante a inicialização e o recarregamento do Gateway. O OpenClaw armazena
referências do Vault na configuração, mantém os valores resolvidos no snapshot de segredos em memória
e não grava as chaves de API resolvidas de volta no `openclaw.json`.

Use essa opção se você já utiliza o Vault ou deseja manter as chaves dos provedores de modelos fora dos
arquivos de configuração do OpenClaw. Para conhecer o modelo de runtime de SecretRefs, consulte
[Gerenciamento de segredos](/pt-BR/gateway/secrets).

## Antes de começar

Você precisa de:

- OpenClaw com o plugin `vault` incluído disponível
- um servidor Vault acessível
- autenticação do Vault capaz de gerar um token de cliente com acesso de leitura aos caminhos de
  segredos que o OpenClaw deve resolver
- o ambiente que inicia o Gateway deve incluir `VAULT_ADDR` e uma destas opções:
  `VAULT_TOKEN`, `OPENCLAW_VAULT_AUTH_METHOD=token_file` com `VAULT_TOKEN_FILE`
  ou um login JWT/Kubernetes configurado

O resolvedor se comunica com o Vault via HTTP a partir do Node. O Gateway não precisa da
CLI do Vault para resolver SecretRefs.

Ative o plugin incluído antes de executar os comandos `openclaw vault`:

```bash
openclaw plugins enable vault
```

## Armazenar uma chave de provedor no Vault

Por padrão, o OpenClaw usa o KV v2 montado em `secret`, como nos exemplos do servidor de
desenvolvimento do Vault. Em um Vault de produção, defina `OPENCLAW_VAULT_KV_MOUNT` como o caminho de
montagem KV real antes de criar IDs de SecretRef. Com os padrões do OpenClaw, este
ID de SecretRef:

```text
providers/openrouter/apiKey
```

lê este campo do Vault:

```text
secret/data/providers/openrouter -> apiKey
```

Uma forma de criá-lo com a CLI do Vault é:

```bash
export OPENROUTER_API_KEY=<openrouter-api-key>
vault kv put secret/providers/openrouter apiKey="$OPENROUTER_API_KEY"
```

Use um token de cliente com escopo limitado para o OpenClaw, não um token raiz. Para o layout
KV v2 padrão, uma política mínima para chaves de provedores de modelos seria:

```hcl
path "secret/data/providers/*" {
  capabilities = ["read"]
}
```

## Tornar o Vault visível para o Gateway

Para um Gateway local fora de contêiner, exporte as configurações do Vault no mesmo shell
que inicia o OpenClaw. O método de autenticação padrão lê um token de cliente do Vault de
`VAULT_TOKEN`:

```bash
export VAULT_ADDR=https://vault.example.com
export VAULT_TOKEN=<vault-client-token>
```

Se o Vault Agent gravar um arquivo de destino de token, use autenticação por arquivo de token:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=token_file
export VAULT_TOKEN_FILE=/vault/secrets/token
```

Para um servidor Vault assinado por uma AC privada, instale essa AC no repositório de
confiança do host e ative a confiança do sistema no Node:

```bash
export NODE_USE_SYSTEM_CA=1
```

Ou forneça diretamente um pacote PEM:

```bash
export NODE_EXTRA_CA_CERTS=/path/to/vault-ca.pem
```

Essas variáveis devem estar presentes quando o OpenClaw for iniciado. O plugin Vault as encaminha
para o processo resolvedor.

Para autenticação JWT não interativa, use um arquivo JWT de carga de trabalho e uma função do Vault do tipo
`jwt`:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=jwt
export OPENCLAW_VAULT_AUTH_MOUNT=jwt
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
export OPENCLAW_VAULT_JWT_FILE=/var/run/secrets/tokens/vault
```

O arquivo JWT deve ser um token projetado de carga de trabalho, como um token de conta de serviço do Kubernetes
com um público aceito pela função do Vault.
O login interativo por navegador com OIDC é útil para pessoas, mas o runtime do Gateway exige
login JWT não interativo ou um arquivo de token.

Para o método de autenticação Kubernetes do Vault, use `kubernetes`. Ele se destina a
Gateways executados como Pods; a montagem padrão é `kubernetes`, e o arquivo JWT padrão
é o caminho padrão do token da conta de serviço:

```bash
export VAULT_ADDR=https://vault.example.com
export OPENCLAW_VAULT_AUTH_METHOD=kubernetes
export OPENCLAW_VAULT_AUTH_ROLE=openclaw
```

Defina `OPENCLAW_VAULT_AUTH_MOUNT` somente quando a autenticação Kubernetes estiver montada no Vault em algum local
diferente de `auth/kubernetes`. Defina `OPENCLAW_VAULT_JWT_FILE` somente quando o token da
conta de serviço estiver projetado em um caminho personalizado.

Configurações opcionais:

```bash
export VAULT_NAMESPACE=<namespace-name>
export OPENCLAW_VAULT_KV_MOUNT=secret
export OPENCLAW_VAULT_KV_VERSION=2
```

Verifique o que o shell atual consegue acessar:

```bash
openclaw vault status
```

Quando houver mais de um provedor de segredos baseado no Vault configurado, selecione um pelo
alias:

```bash
openclaw vault status --provider-alias corp-vault
```

`openclaw vault status` nunca exibe `VAULT_TOKEN`; ele informa apenas se o
token, o arquivo de token e o arquivo JWT estão definidos.

<Warning>
Se o Gateway for executado como serviço, LaunchAgent, unidade do systemd, tarefa agendada ou
contêiner, esse ambiente de runtime deverá receber as mesmas variáveis do Vault.
Definir variáveis somente em um shell interativo comprova apenas esse shell, não o
Gateway que já está em execução.
</Warning>

## Gerar e aplicar um plano de SecretRefs

Crie um plano que mapeie a chave de API do provedor de modelos OpenRouter para o Vault:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openrouter-id providers/openrouter/apiKey
```

Aplique e verifique o plano:

```bash
openclaw secrets apply --from ./vault-secrets-plan.json --dry-run --allow-exec
openclaw secrets apply --from ./vault-secrets-plan.json --allow-exec
openclaw secrets audit --check --allow-exec
openclaw secrets reload
```

Use `--allow-exec` porque o plugin Vault faz a resolução por meio de um provedor
de SecretRefs do tipo exec gerenciado pelo OpenClaw.

Se o Gateway ainda não estiver em execução, inicie-o normalmente após aplicar o plano,
em vez de executar `openclaw secrets reload`.

## Configurar mais chaves de provedores

Atalhos integrados:

```bash
openclaw vault setup --openai-id providers/openai/apiKey
openclaw vault setup --anthropic-id providers/anthropic/apiKey
openclaw vault setup --openrouter-id providers/openrouter/apiKey
```

Várias chaves de provedores em um único plano:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --openai-id providers/openai/apiKey \
  --anthropic-id providers/anthropic/apiKey \
  --openrouter-id providers/openrouter/apiKey
```

Provedores incluídos sem atalhos, ou provedores de modelos personalizados e compatíveis com OpenAI
já configurados, usam `--provider-key`:

```bash
openclaw vault setup \
  --plan-out ./vault-secrets-plan.json \
  --provider-key local-openai=providers/local-openai/apiKey \
  --provider-key groq=providers/groq/apiKey
```

Cada `--provider-key <provider=id>` grava uma SecretRef em
`models.providers.<provider>.apiKey`. Para provedores personalizados, ele não cria
as configurações `baseUrl`, `api` ou `models` do provedor; configure-as primeiro.

Use `--target <path=id>` para qualquer caminho de destino de SecretRef conhecido:

```bash
openclaw vault setup \
  --target channels.telegram.botToken=channels/telegram/botToken \
  --target models.providers.openai.headers.x-api-key=providers/openai/proxyKey \
  --target auth-profiles:main:profiles.openai.key=providers/openai/apiKey
```

Caminhos de destino simples se aplicam ao `openclaw.json`. Use
`auth-profiles:<agentId>:<path>` para destinos existentes no `auth-profiles.json`.
O caminho de destino deve ser um destino de SecretRef registrado no OpenClaw. O comando de
configuração não cria segredos nomeados arbitrários no OpenClaw; o Vault continua sendo o
armazenamento de segredos, e o OpenClaw armazena SecretRefs somente em campos de configuração compatíveis.

## Formato do ID de SecretRef

Os IDs de SecretRef do Vault usam esta convenção:

```text
<vault-secret-path>/<field>
```

Exemplos:

| ID de SecretRef                | Leitura padrão no Vault KV v2      | Campo retornado |
| ----------------------------- | ---------------------------------- | --------------- |
| `providers/openrouter/apiKey` | `secret/data/providers/openrouter` | `apiKey`        |
| `providers/openai/apiKey`     | `secret/data/providers/openai`     | `apiKey`        |
| `teams/agent-prod/openrouter` | `secret/data/teams/agent-prod`     | `openrouter`    |

O campo retornado pelo Vault deve ser uma string.

Para KV v1, defina:

```bash
export OPENCLAW_VAULT_KV_VERSION=1
```

Então `providers/openrouter/apiKey` lê:

```text
secret/providers/openrouter -> apiKey
```

## O que o OpenClaw armazena

A aplicação de um plano de configuração do Vault armazena um provedor gerenciado pelo plugin:

```json
{
  "source": "exec",
  "pluginIntegration": {
    "pluginId": "vault",
    "integrationId": "vault"
  }
}
```

Os campos de credenciais apontam para esse provedor:

```json
{ "source": "exec", "provider": "vault", "id": "providers/openrouter/apiKey" }
```

O valor resolvido permanece somente no snapshot de segredos do runtime ativo.

## Contêineres e implantações gerenciadas

Gateways em contêineres continuam usando o mesmo plugin e a mesma configuração de SecretRefs. O
contêiner deve receber:

- `VAULT_ADDR`
- uma origem de autenticação:
  - `VAULT_TOKEN`
  - `OPENCLAW_VAULT_AUTH_METHOD=token_file` mais `VAULT_TOKEN_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=jwt` mais `OPENCLAW_VAULT_AUTH_MOUNT`,
    `OPENCLAW_VAULT_AUTH_ROLE` e `OPENCLAW_VAULT_JWT_FILE`
  - `OPENCLAW_VAULT_AUTH_METHOD=kubernetes` mais `OPENCLAW_VAULT_AUTH_ROLE`; opcionalmente,
    substitua `OPENCLAW_VAULT_AUTH_MOUNT` ou `OPENCLAW_VAULT_JWT_FILE`
- opcionalmente, `VAULT_NAMESPACE`, `OPENCLAW_VAULT_KV_MOUNT` e
  `OPENCLAW_VAULT_KV_VERSION`

Ao usar o Kubernetes, prefira `OPENCLAW_VAULT_AUTH_METHOD=kubernetes`
quando o Vault tiver a autenticação Kubernetes configurada para o cluster. Use
`OPENCLAW_VAULT_AUTH_METHOD=jwt` somente quando o Vault estiver configurado para tratar o cluster
como um emissor JWT/OIDC genérico. Qualquer uma das opções é melhor que um token do Vault
de longa duração em um Secret do Kubernetes. Implantações com sidecar ou injetor do Vault Agent podem
usar `token_file` em vez disso.

Em configurações multitenant do Vault, mantenha o roteamento dos tenants na política do Vault e na
configuração da implantação. O OpenClaw não exige uma montagem, função ou caminho fixo: cada
ambiente do Gateway pode definir seus próprios `OPENCLAW_VAULT_KV_MOUNT`,
`OPENCLAW_VAULT_AUTH_ROLE` e IDs de SecretRef. Se um Gateway compartilhado precisar resolver
diferentes usuários do Vault ao mesmo tempo, use provedores exec configurados manualmente
que encapsulem ambientes de autenticação distintos ou distribua os tenants entre ambientes do Gateway
com variáveis de ambiente do Vault separadas.

## Relacionados

- [Gerenciamento de segredos](/pt-BR/gateway/secrets)
- [`openclaw secrets`](/pt-BR/cli/secrets)
- [Inventário de plugins](/pt-BR/plugins/plugin-inventory)
