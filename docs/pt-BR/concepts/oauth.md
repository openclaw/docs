---
read_when:
    - Você quer entender o OAuth do OpenClaw de ponta a ponta
    - Você encontrou problemas de invalidação de token / logout
    - Você quer fluxos de autenticação do Claude CLI ou OAuth
    - Você quer múltiplas contas ou roteamento de perfil
summary: 'OAuth no OpenClaw: troca de token, armazenamento e padrões de múltiplas contas'
title: OAuth
x-i18n:
    generated_at: "2026-04-25T13:45:24Z"
    model: gpt-5.4
    provider: openai
    source_hash: c793c52f48a3f49c0677d8e55a84c2bf5cdf0d385e6a858f26c0701d45583211
    source_path: concepts/oauth.md
    workflow: 15
---

O OpenClaw oferece suporte a “autenticação por assinatura” via OAuth para provedores que a oferecem
(notavelmente **OpenAI Codex (OAuth do ChatGPT)**). Para a Anthropic, a divisão prática
agora é:

- **Chave de API da Anthropic**: cobrança normal da API da Anthropic
- **Anthropic Claude CLI / autenticação por assinatura dentro do OpenClaw**: a equipe da Anthropic
  nos informou que esse uso voltou a ser permitido

O OAuth do OpenAI Codex tem suporte explícito para uso em ferramentas externas como o
OpenClaw. Esta página explica:

Para Anthropic em produção, a autenticação por chave de API é o caminho recomendado mais seguro.

- como funciona a **troca de token** do OAuth (PKCE)
- onde os tokens são **armazenados** (e por quê)
- como lidar com **múltiplas contas** (perfis + substituições por sessão)

O OpenClaw também oferece suporte a **plugins** de provedor que incluem seus próprios fluxos
de OAuth ou chave de API. Execute-os com:

```bash
openclaw models auth login --provider <id>
```

## O token sink (por que ele existe)

Provedores OAuth com frequência emitem um **novo refresh token** durante fluxos de login/renovação. Alguns provedores (ou clientes OAuth) podem invalidar refresh tokens antigos quando um novo é emitido para o mesmo usuário/app.

Sintoma prático:

- você faz login pelo OpenClaw _e_ pelo Claude Code / Codex CLI → um deles acaba sendo “desconectado” aleatoriamente depois

Para reduzir isso, o OpenClaw trata `auth-profiles.json` como um **token sink**:

- o runtime lê credenciais de **um único lugar**
- podemos manter vários perfis e roteá-los de forma determinística
- a reutilização de CLI externa é específica por provedor: o Codex CLI pode inicializar um perfil
  `openai-codex:default` vazio, mas, assim que o OpenClaw tem um perfil OAuth local,
  o refresh token local é canônico; outras integrações podem continuar sendo
  gerenciadas externamente e reler seu armazenamento de autenticação da CLI

## Armazenamento (onde os tokens ficam)

Segredos são armazenados **por agente**:

- Perfis de autenticação (OAuth + chaves de API + refs opcionais por valor): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Arquivo legado de compatibilidade: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entradas estáticas `api_key` são removidas quando descobertas)

Arquivo legado somente para importação (ainda compatível, mas não é o armazenamento principal):

- `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso)

Tudo isso também respeita `$OPENCLAW_STATE_DIR` (substituição do diretório de estado). Referência completa: [/gateway/configuration](/pt-BR/gateway/configuration-reference#auth-storage)

Para refs de segredo estáticas e comportamento de ativação do snapshot de runtime, consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

## Compatibilidade com token legado da Anthropic

<Warning>
A documentação pública do Claude Code da Anthropic diz que o uso direto do Claude Code permanece dentro
dos limites da assinatura Claude, e a equipe da Anthropic nos informou que o uso no estilo Claude
CLI do OpenClaw voltou a ser permitido. Portanto, o OpenClaw trata a reutilização do Claude CLI e
o uso de `claude -p` como autorizados para esta integração, a menos que a Anthropic
publique uma nova política.

Para a documentação atual da Anthropic sobre planos diretos do Claude Code, consulte [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se você quiser outras opções no estilo assinatura no OpenClaw, consulte [OpenAI
Codex](/pt-BR/providers/openai), [Qwen Cloud Coding
Plan](/pt-BR/providers/qwen), [MiniMax Coding Plan](/pt-BR/providers/minimax)
e [Z.AI / GLM Coding Plan](/pt-BR/providers/glm).
</Warning>

O OpenClaw também expõe o setup-token da Anthropic como um caminho compatível de autenticação por token, mas agora prefere a reutilização do Claude CLI e `claude -p` quando disponíveis.

## Migração do Anthropic Claude CLI

O OpenClaw oferece suporte novamente à reutilização do Anthropic Claude CLI. Se você já tiver um
login local do Claude no host, o onboarding/configuração pode reutilizá-lo diretamente.

## Troca OAuth (como o login funciona)

Os fluxos de login interativos do OpenClaw são implementados em `@mariozechner/pi-ai` e conectados aos assistentes/comandos.

### Setup-token da Anthropic

Formato do fluxo:

1. inicie o setup-token da Anthropic ou cole um token a partir do OpenClaw
2. o OpenClaw armazena a credencial resultante da Anthropic em um perfil de autenticação
3. a seleção de modelo permanece em `anthropic/...`
4. perfis de autenticação Anthropic existentes continuam disponíveis para rollback/controle de ordem

### OpenAI Codex (OAuth do ChatGPT)

O OAuth do OpenAI Codex tem suporte explícito para uso fora do Codex CLI, incluindo fluxos do OpenClaw.

Formato do fluxo (PKCE):

1. gere verifier/challenge PKCE + `state` aleatório
2. abra `https://auth.openai.com/oauth/authorize?...`
3. tente capturar o callback em `http://127.0.0.1:1455/auth/callback`
4. se o callback não puder ser vinculado (ou você estiver remoto/headless), cole a URL/código de redirecionamento
5. faça a troca em `https://auth.openai.com/oauth/token`
6. extraia `accountId` do access token e armazene `{ access, refresh, expires, accountId }`

O caminho do assistente é `openclaw onboard` → escolha de autenticação `openai-codex`.

## Renovação + expiração

Os perfis armazenam um timestamp `expires`.

Em runtime:

- se `expires` estiver no futuro → usa o access token armazenado
- se estiver expirado → renova (sob um bloqueio de arquivo) e sobrescreve as credenciais armazenadas
- exceção: algumas credenciais de CLI externa continuam sendo gerenciadas externamente; o OpenClaw
  relê esses armazenamentos de autenticação da CLI em vez de consumir refresh tokens copiados.
  A inicialização do Codex CLI é intencionalmente mais restrita: ela semeia um perfil
  `openai-codex:default` vazio, então as renovações pertencentes ao OpenClaw mantêm o perfil local
  como canônico.

O fluxo de renovação é automático; em geral, você não precisa gerenciar tokens manualmente.

## Múltiplas contas (perfis) + roteamento

Dois padrões:

### 1) Preferido: agentes separados

Se você quiser que “pessoal” e “trabalho” nunca interajam, use agentes isolados (sessões + credenciais + workspace separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Depois configure a autenticação por agente (assistente) e roteie os chats para o agente certo.

### 2) Avançado: múltiplos perfis em um agente

`auth-profiles.json` aceita vários IDs de perfil para o mesmo provedor.

Escolha qual perfil será usado:

- globalmente via ordenação de configuração (`auth.order`)
- por sessão via `/model ...@<profileId>`

Exemplo (substituição por sessão):

- `/model Opus@anthropic:work`

Como ver quais IDs de perfil existem:

- `openclaw channels list --json` (mostra `auth[]`)

Documentação relacionada:

- [Failover de modelo](/pt-BR/concepts/model-failover) (regras de rotação + cooldown)
- [Comandos de barra](/pt-BR/tools/slash-commands) (superfície de comandos)

## Relacionado

- [Autenticação](/pt-BR/gateway/authentication) — visão geral da autenticação de provedores de modelo
- [Segredos](/pt-BR/gateway/secrets) — armazenamento de credenciais e SecretRef
- [Referência de configuração](/pt-BR/gateway/configuration-reference#auth-storage) — chaves de configuração de autenticação
