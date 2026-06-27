---
read_when:
    - Você quer entender o OAuth do OpenClaw de ponta a ponta
    - Você encontrou problemas de invalidação de token / encerramento de sessão
    - Você quer fluxos de autenticação da Claude CLI ou OAuth
    - Você quer várias contas ou roteamento de perfis
summary: 'OAuth no OpenClaw: troca de tokens, armazenamento e padrões de múltiplas contas'
title: OAuth
x-i18n:
    generated_at: "2026-06-27T17:26:03Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4aa48fd468a541ed72935833a3196105798380799fa6135fe1dd9f68838307b6
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw oferece suporte a "autenticação por assinatura" via OAuth para provedores que a oferecem
(notavelmente **OpenAI Codex (ChatGPT OAuth)**). Para Anthropic, a divisão prática
agora é:

- **Chave de API Anthropic**: cobrança normal da API Anthropic
- **Anthropic Claude CLI / autenticação por assinatura dentro do OpenClaw**: a equipe da Anthropic
  nos informou que esse uso é permitido novamente

O OAuth do OpenAI Codex é explicitamente compatível para uso em ferramentas externas como o
OpenClaw.

O OpenClaw armazena tanto a autenticação por chave de API da OpenAI quanto o OAuth ChatGPT/Codex sob o
id de provedor canônico `openai`. IDs de perfil `openai-codex:*` mais antigos e
entradas `auth.order.openai-codex` são estado legado reparado por
`openclaw doctor --fix`; use IDs de perfil `openai:*` e `auth.order.openai` para
novas configurações.

Para Anthropic em produção, a autenticação por chave de API é o caminho recomendado mais seguro.

Esta página explica:

- como a **troca de tokens** OAuth funciona (PKCE)
- onde os tokens são **armazenados** (e por quê)
- como lidar com **várias contas** (perfis + substituições por sessão)

O OpenClaw também oferece suporte a **Plugins de provedor** que fornecem seus próprios fluxos de OAuth ou chave de API.
Execute-os via:

```bash
openclaw models auth login --provider <id>
```

## O coletor de tokens (por que ele existe)

Provedores OAuth normalmente emitem um **novo token de atualização** durante fluxos de login/atualização. Alguns provedores (ou clientes OAuth) podem invalidar tokens de atualização antigos quando um novo é emitido para o mesmo usuário/aplicativo.

Sintoma prático:

- você faz login via OpenClaw _e_ via Claude Code / Codex CLI → um deles é "desconectado" aleatoriamente depois

Para reduzir isso, o OpenClaw trata `auth-profiles.json` como um **coletor de tokens**:

- o runtime lê credenciais de **um só lugar**
- podemos manter vários perfis e roteá-los de forma determinística
- a reutilização de CLI externa é específica do provedor: o Codex CLI pode inicializar um perfil
  `openai:default` vazio, mas depois que o OpenClaw tem um perfil OAuth local,
  o token de atualização local é canônico. Se esse token de atualização local for rejeitado,
  o OpenClaw pode usar um token utilizável do Codex CLI da mesma conta como fallback
  somente em runtime; outras integrações podem permanecer gerenciadas externamente e reler seu
  armazenamento de autenticação da CLI
- caminhos de status e inicialização que já conhecem o conjunto de provedores configurados limitam
  a descoberta de CLI externa a esse conjunto, para que um armazenamento de login de CLI não relacionado não seja
  sondado em uma configuração com um único provedor

## Armazenamento (onde os tokens ficam)

Segredos são armazenados nos armazenamentos de autenticação dos agentes:

- Perfis de autenticação (OAuth + chaves de API + refs opcionais em nível de valor): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Arquivo de compatibilidade legado: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entradas estáticas `api_key` são removidas quando descobertas)

Arquivo legado somente para importação (ainda compatível, mas não é o armazenamento principal):

- `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso)

Todos os itens acima também respeitam `$OPENCLAW_STATE_DIR` (substituição do diretório de estado). Referência completa: [/gateway/configuration](/pt-BR/gateway/configuration-reference#auth-storage)

Para refs de segredos estáticos e o comportamento de ativação de snapshots em runtime, consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

Quando um agente secundário não tem perfil de autenticação local, o OpenClaw usa herança por leitura
do armazenamento do agente padrão/principal. Ele não clona o `auth-profiles.json` do agente principal
na leitura. Tokens de atualização OAuth são especialmente sensíveis: fluxos normais de cópia
os ignoram por padrão porque alguns provedores rotacionam ou invalidam tokens de atualização após o uso.
Configure um login OAuth separado para um agente quando ele precisar de uma conta independente.

## Compatibilidade com token legado da Anthropic

<Warning>
A documentação pública do Claude Code da Anthropic diz que o uso direto do Claude Code permanece dentro
dos limites da assinatura Claude, e a equipe da Anthropic nos informou que o uso do Claude
CLI no estilo OpenClaw é permitido novamente. Portanto, o OpenClaw trata a reutilização do Claude CLI e
o uso de `claude -p` como sancionados para esta integração, a menos que a Anthropic
publique uma nova política.

Para a documentação atual da Anthropic sobre planos diretos do Claude Code, consulte [Como usar o Claude Code
com seu plano Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Como usar o Claude Code com seu plano Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se você quiser outras opções no estilo assinatura no OpenClaw, consulte [OpenAI
Codex](/pt-BR/providers/openai), [Qwen Cloud Coding
Plan](/pt-BR/providers/qwen), [MiniMax Coding Plan](/pt-BR/providers/minimax),
e [Z.AI / GLM Coding Plan](/pt-BR/providers/zai).
</Warning>

O OpenClaw também expõe setup-token da Anthropic como um caminho de autenticação por token compatível, mas agora prefere a reutilização do Claude CLI e `claude -p` quando disponíveis.

## Migração do Anthropic Claude CLI

O OpenClaw oferece suporte novamente à reutilização do Anthropic Claude CLI. Se você já tem um login local
do Claude no host, onboarding/configure pode reutilizá-lo diretamente.

## Troca OAuth (como o login funciona)

Os fluxos de login interativo do OpenClaw são implementados em `openclaw/plugin-sdk/llm` e conectados aos assistentes/comandos.

### setup-token da Anthropic

Formato do fluxo:

1. iniciar setup-token da Anthropic ou paste-token a partir do OpenClaw
2. o OpenClaw armazena a credencial Anthropic resultante em um perfil de autenticação
3. a seleção de modelo permanece em `anthropic/...`
4. perfis de autenticação Anthropic existentes continuam disponíveis para rollback/controle de ordem

### OpenAI Codex (ChatGPT OAuth)

O OAuth do OpenAI Codex é explicitamente compatível para uso fora do Codex CLI, incluindo fluxos de trabalho do OpenClaw.

O comando de login ainda usa o id de provedor canônico da OpenAI:

```bash
openclaw models auth login --provider openai
```

Use `--profile-id openai:<name>` para várias contas OAuth ChatGPT/Codex em
um agente. Não use `openai-codex:<name>` para novos perfis. O Doctor migra
esse prefixo antigo para um id de perfil `openai:*` sem colisão; execute
`openclaw models auth list --provider openai` após o reparo antes de copiar
IDs de perfil para `auth.order` ou `/model ...@<profileId>`.

Formato do fluxo (PKCE):

1. gerar verificador/desafio PKCE + `state` aleatório
2. abrir `https://auth.openai.com/oauth/authorize?...`
3. tentar capturar o callback em `http://127.0.0.1:1455/auth/callback`
4. se o callback não conseguir vincular (ou você estiver remoto/headless), cole a URL/código de redirecionamento
5. trocar em `https://auth.openai.com/oauth/token`
6. extrair `accountId` do token de acesso e armazenar `{ access, refresh, expires, accountId }`

O caminho do assistente é `openclaw onboard` → escolha de autenticação `openai`.

## Atualização + expiração

Perfis armazenam um timestamp `expires`.

Em runtime:

- se `expires` está no futuro → usar o token de acesso armazenado
- se expirado → atualizar (sob um lock de arquivo) e sobrescrever as credenciais armazenadas
- se um agente secundário lê um perfil OAuth herdado do agente principal, a atualização
  grava de volta no armazenamento do agente principal em vez de copiar o token de atualização para
  o armazenamento do agente secundário
- exceção: algumas credenciais de CLI externa permanecem gerenciadas externamente; o OpenClaw
  relê esses armazenamentos de autenticação da CLI em vez de gastar tokens de atualização copiados.
  A inicialização do Codex CLI é intencionalmente mais restrita: ela semeia um perfil
  `openai:default` vazio, então atualizações de propriedade do OpenClaw mantêm o perfil
  local canônico. Se a atualização local do Codex falhar e o Codex CLI tiver um
  token utilizável para a mesma conta, o OpenClaw pode usar esse token para a solicitação de
  runtime atual sem gravá-lo de volta em `auth-profiles.json`.

O fluxo de atualização é automático; geralmente você não precisa gerenciar tokens manualmente.

## Várias contas (perfis) + roteamento

Dois padrões:

### 1) Preferido: agentes separados

Se você quiser que "pessoal" e "trabalho" nunca interajam, use agentes isolados (sessões + credenciais + workspace separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Depois configure a autenticação por agente (assistente) e roteie chats para o agente correto.

### 2) Avançado: vários perfis em um agente

`auth-profiles.json` oferece suporte a vários IDs de perfil para o mesmo provedor.

Escolha qual perfil é usado:

- globalmente por ordenação de configuração (`auth.order`)
- por sessão via `/model ...@<profileId>`

Exemplo (substituição de sessão):

- `/model Opus@anthropic:work`

Como ver quais IDs de perfil existem:

- `openclaw channels list --json` (mostra `auth[]`)

Documentação relacionada:

- [Failover de modelo](/pt-BR/concepts/model-failover) (regras de rotação + cooldown)
- [Comandos de barra](/pt-BR/tools/slash-commands) (superfície de comandos)

## Relacionado

- [Autenticação](/pt-BR/gateway/authentication) - visão geral da autenticação de provedores de modelo
- [Segredos](/pt-BR/gateway/secrets) - armazenamento de credenciais e SecretRef
- [Referência de configuração](/pt-BR/gateway/configuration-reference#auth-storage) - chaves de configuração de autenticação
