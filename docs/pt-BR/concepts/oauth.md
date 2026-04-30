---
read_when:
    - Você quer entender o OAuth do OpenClaw de ponta a ponta
    - Você encontrou problemas de invalidação de token / encerramento de sessão
    - Você quer fluxos de autenticação do Claude CLI ou OAuth
    - Você quer várias contas ou roteamento de perfis
summary: 'OAuth no OpenClaw: troca de tokens, armazenamento e padrões de múltiplas contas'
title: OAuth
x-i18n:
    generated_at: "2026-04-30T09:45:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: b4b228c83a79afa4018e9572f790ddfef016a73d2383d2847facdc5bb61ed004
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw oferece suporte a “autenticação por assinatura” via OAuth para provedores que a oferecem
(especialmente **OpenAI Codex (ChatGPT OAuth)**). Para Anthropic, a divisão prática
agora é:

- **Chave de API da Anthropic**: cobrança normal da API da Anthropic
- **Anthropic Claude CLI / autenticação por assinatura dentro do OpenClaw**: a equipe da Anthropic
  nos informou que esse uso está permitido novamente

OpenAI Codex OAuth tem suporte explícito para uso em ferramentas externas como
OpenClaw. Esta página explica:

Para Anthropic em produção, a autenticação por chave de API é o caminho recomendado mais seguro.

- como a **troca de tokens** do OAuth funciona (PKCE)
- onde os tokens são **armazenados** (e por quê)
- como lidar com **múltiplas contas** (perfis + substituições por sessão)

OpenClaw também oferece suporte a **plugins de provedor** que trazem seus próprios fluxos de OAuth ou chave de API.
Execute-os via:

```bash
openclaw models auth login --provider <id>
```

## O sumidouro de tokens (por que ele existe)

Provedores OAuth comumente emitem um **novo token de atualização** durante fluxos de login/atualização. Alguns provedores (ou clientes OAuth) podem invalidar tokens de atualização antigos quando um novo é emitido para o mesmo usuário/aplicativo.

Sintoma prático:

- você faz login via OpenClaw _e_ via Claude Code / Codex CLI → um deles é “desconectado” aleatoriamente depois

Para reduzir isso, o OpenClaw trata `auth-profiles.json` como um **sumidouro de tokens**:

- o runtime lê credenciais de **um único lugar**
- podemos manter múltiplos perfis e roteá-los de forma determinística
- a reutilização de CLI externa é específica do provedor: Codex CLI pode inicializar um perfil
  `openai-codex:default` vazio, mas depois que o OpenClaw tem um perfil OAuth local,
  o token de atualização local é canônico; outras integrações podem permanecer
  gerenciadas externamente e reler seu armazenamento de autenticação da CLI
- caminhos de status e inicialização que já conhecem o escopo do conjunto de provedores configurado
  limitam a descoberta de CLI externa a esse conjunto, para que um armazenamento de login de CLI
  não relacionado não seja sondado em uma configuração com um único provedor

## Armazenamento (onde os tokens ficam)

Segredos são armazenados nos armazenamentos de autenticação do agente:

- Perfis de autenticação (OAuth + chaves de API + refs opcionais em nível de valor): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Arquivo de compatibilidade legado: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entradas estáticas de `api_key` são removidas quando descobertas)

Arquivo legado apenas para importação (ainda suportado, mas não é o armazenamento principal):

- `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso)

Todos os itens acima também respeitam `$OPENCLAW_STATE_DIR` (substituição do diretório de estado). Referência completa: [/gateway/configuration](/pt-BR/gateway/configuration-reference#auth-storage)

Para refs estáticas de segredos e o comportamento de ativação de snapshots em runtime, consulte [Gerenciamento de Segredos](/pt-BR/gateway/secrets).

Quando um agente secundário não tem perfil de autenticação local, o OpenClaw usa herança por leitura
do armazenamento do agente padrão/principal. Ele não clona o `auth-profiles.json` do agente principal
durante a leitura. Tokens de atualização OAuth são especialmente sensíveis:
fluxos normais de cópia os ignoram por padrão porque alguns provedores rotacionam
ou invalidam tokens de atualização após o uso. Configure um login OAuth separado para um
agente quando ele precisar de uma conta independente.

## Compatibilidade com tokens legados da Anthropic

<Warning>
A documentação pública do Claude Code da Anthropic diz que o uso direto do Claude Code permanece dentro
dos limites de assinatura do Claude, e a equipe da Anthropic nos informou que o uso do Claude
CLI no estilo do OpenClaw está permitido novamente. Portanto, o OpenClaw trata a reutilização do Claude CLI e
o uso de `claude -p` como sancionados para esta integração, a menos que a Anthropic
publique uma nova política.

Para a documentação atual da Anthropic sobre planos de uso direto do Claude Code, consulte [Uso do Claude Code
com seu plano Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Uso do Claude Code com seu plano Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se você quiser outras opções no estilo de assinatura no OpenClaw, consulte [OpenAI
Codex](/pt-BR/providers/openai), [Qwen Cloud Coding
Plan](/pt-BR/providers/qwen), [MiniMax Coding Plan](/pt-BR/providers/minimax),
e [Z.AI / GLM Coding Plan](/pt-BR/providers/glm).
</Warning>

OpenClaw também expõe o setup-token da Anthropic como um caminho de autenticação por token suportado, mas agora prefere a reutilização do Claude CLI e `claude -p` quando disponíveis.

## Migração do Anthropic Claude CLI

OpenClaw oferece suporte novamente à reutilização do Anthropic Claude CLI. Se você já tem um login local
do Claude no host, o onboarding/configure pode reutilizá-lo diretamente.

## Troca OAuth (como o login funciona)

Os fluxos de login interativo do OpenClaw são implementados em `@mariozechner/pi-ai` e conectados aos assistentes/comandos.

### Setup-token da Anthropic

Formato do fluxo:

1. iniciar o setup-token ou paste-token da Anthropic a partir do OpenClaw
2. o OpenClaw armazena a credencial resultante da Anthropic em um perfil de autenticação
3. a seleção de modelo permanece em `anthropic/...`
4. perfis de autenticação Anthropic existentes continuam disponíveis para rollback/controle de ordem

### OpenAI Codex (ChatGPT OAuth)

OpenAI Codex OAuth tem suporte explícito para uso fora do Codex CLI, incluindo fluxos de trabalho do OpenClaw.

Formato do fluxo (PKCE):

1. gerar verificador/desafio PKCE + `state` aleatório
2. abrir `https://auth.openai.com/oauth/authorize?...`
3. tentar capturar o callback em `http://127.0.0.1:1455/auth/callback`
4. se o callback não conseguir fazer bind (ou se você estiver remoto/headless), colar a URL/código de redirecionamento
5. trocar em `https://auth.openai.com/oauth/token`
6. extrair `accountId` do token de acesso e armazenar `{ access, refresh, expires, accountId }`

O caminho do assistente é `openclaw onboard` → escolha de autenticação `openai-codex`.

## Atualização + expiração

Perfis armazenam um timestamp `expires`.

Em runtime:

- se `expires` está no futuro → usa o token de acesso armazenado
- se expirou → atualiza (sob um bloqueio de arquivo) e sobrescreve as credenciais armazenadas
- se um agente secundário lê um perfil OAuth herdado do agente principal, a atualização
  grava de volta no armazenamento do agente principal em vez de copiar o token de atualização para
  o armazenamento do agente secundário
- exceção: algumas credenciais de CLI externa permanecem gerenciadas externamente; o OpenClaw
  relê esses armazenamentos de autenticação da CLI em vez de gastar tokens de atualização copiados.
  A inicialização via Codex CLI é intencionalmente mais restrita: ela cria um perfil
  `openai-codex:default` vazio, e então as atualizações pertencentes ao OpenClaw mantêm o perfil
  local como canônico.

O fluxo de atualização é automático; em geral, você não precisa gerenciar tokens manualmente.

## Múltiplas contas (perfis) + roteamento

Dois padrões:

### 1) Preferido: agentes separados

Se você quer que “pessoal” e “trabalho” nunca interajam, use agentes isolados (sessões + credenciais + workspace separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Depois configure a autenticação por agente (assistente) e roteie conversas para o agente correto.

### 2) Avançado: múltiplos perfis em um agente

`auth-profiles.json` oferece suporte a múltiplos IDs de perfil para o mesmo provedor.

Escolha qual perfil é usado:

- globalmente via ordenação de configuração (`auth.order`)
- por sessão via `/model ...@<profileId>`

Exemplo (substituição de sessão):

- `/model Opus@anthropic:work`

Como ver quais IDs de perfil existem:

- `openclaw channels list --json` (mostra `auth[]`)

Documentação relacionada:

- [Failover de modelos](/pt-BR/concepts/model-failover) (regras de rotação + cooldown)
- [Comandos slash](/pt-BR/tools/slash-commands) (superfície de comandos)

## Relacionado

- [Autenticação](/pt-BR/gateway/authentication) — visão geral de autenticação de provedores de modelo
- [Segredos](/pt-BR/gateway/secrets) — armazenamento de credenciais e SecretRef
- [Referência de Configuração](/pt-BR/gateway/configuration-reference#auth-storage) — chaves de configuração de autenticação
