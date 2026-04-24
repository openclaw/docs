---
read_when:
    - Você quer entender o OAuth do OpenClaw de ponta a ponta
    - Você encontrou problemas de invalidação de token / logout
    - Você quer fluxos de autenticação do Claude CLI ou OAuth
    - Você quer múltiplas contas ou roteamento por perfil
summary: 'OAuth no OpenClaw: troca de token, armazenamento e padrões de múltiplas contas'
title: OAuth
x-i18n:
    generated_at: "2026-04-24T05:48:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 81b8891850123c32a066dbfb855feb132bc1f2bbc694f10ee2797b694bd5d848
    source_path: concepts/oauth.md
    workflow: 15
---

O OpenClaw oferece suporte a “autenticação por assinatura” via OAuth para providers que a oferecem
(notadamente **OpenAI Codex (OAuth do ChatGPT)**). Para a Anthropic, a divisão prática
agora é:

- **Chave de API da Anthropic**: faturamento normal da API da Anthropic
- **Anthropic Claude CLI / autenticação por assinatura dentro do OpenClaw**: a equipe da Anthropic
  nos informou que esse uso é permitido novamente

O OAuth do OpenAI Codex é explicitamente compatível para uso em ferramentas externas como
o OpenClaw. Esta página explica:

Para Anthropic em produção, a autenticação por chave de API é o caminho recomendado e mais seguro.

- como funciona a **troca de tokens** do OAuth (PKCE)
- onde os tokens são **armazenados** (e por quê)
- como lidar com **múltiplas contas** (perfis + substituições por sessão)

O OpenClaw também oferece suporte a **plugins de provider** que incluem seus próprios fluxos
de OAuth ou chave de API. Execute-os com:

```bash
openclaw models auth login --provider <id>
```

## O token sink (por que ele existe)

Providers OAuth comumente emitem um **novo refresh token** durante fluxos de login/refresh. Alguns providers (ou clientes OAuth) podem invalidar refresh tokens antigos quando um novo é emitido para o mesmo usuário/app.

Sintoma prático:

- você faz login via OpenClaw _e_ via Claude Code / Codex CLI → um deles acaba sendo “desconectado” aleatoriamente depois

Para reduzir isso, o OpenClaw trata `auth-profiles.json` como um **token sink**:

- o runtime lê credenciais de **um único lugar**
- podemos manter vários perfis e roteá-los de forma determinística
- quando credenciais são reutilizadas de uma CLI externa como a Codex CLI, o OpenClaw
  as espelha com proveniência e relê essa origem externa em vez de
  rotacionar o refresh token por conta própria

## Armazenamento (onde os tokens ficam)

Os segredos são armazenados **por agente**:

- Perfis de autenticação (OAuth + chaves de API + refs opcionais em nível de valor): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Arquivo legado de compatibilidade: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entradas estáticas de `api_key` são limpas quando descobertas)

Arquivo legado apenas para importação (ainda compatível, mas não é o armazenamento principal):

- `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso)

Tudo isso também respeita `$OPENCLAW_STATE_DIR` (substituição do diretório de estado). Referência completa: [/gateway/configuration](/pt-BR/gateway/configuration-reference#auth-storage)

Para refs de segredos estáticos e comportamento de ativação de snapshot em runtime, consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

## Compatibilidade legada de token da Anthropic

<Warning>
A documentação pública do Claude Code da Anthropic diz que o uso direto do Claude Code permanece dentro
dos limites de assinatura do Claude, e a equipe da Anthropic nos informou que o uso do Claude
CLI no estilo OpenClaw é permitido novamente. Portanto, o OpenClaw trata a reutilização do Claude CLI e
o uso de `claude -p` como autorizados para esta integração, a menos que a Anthropic
publique uma nova política.

Para a documentação atual da Anthropic sobre planos diretos do Claude Code, consulte [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se você quiser outras opções no estilo assinatura no OpenClaw, consulte [OpenAI
Codex](/pt-BR/providers/openai), [Qwen Cloud Coding
Plan](/pt-BR/providers/qwen), [MiniMax Coding Plan](/pt-BR/providers/minimax),
e [Z.AI / GLM Coding Plan](/pt-BR/providers/glm).
</Warning>

O OpenClaw também expõe o setup-token da Anthropic como um caminho compatível de autenticação por token, mas agora prefere reutilização do Claude CLI e `claude -p` quando disponíveis.

## Migração do Anthropic Claude CLI

O OpenClaw oferece suporte novamente à reutilização do Anthropic Claude CLI. Se você já tiver um
login local do Claude no host, o onboarding/configuração pode reutilizá-lo diretamente.

## Troca OAuth (como o login funciona)

Os fluxos de login interativos do OpenClaw são implementados em `@mariozechner/pi-ai` e conectados aos assistentes/comandos.

### Setup-token da Anthropic

Formato do fluxo:

1. iniciar setup-token da Anthropic ou colar token a partir do OpenClaw
2. o OpenClaw armazena a credencial Anthropic resultante em um perfil de autenticação
3. a seleção de modelo permanece em `anthropic/...`
4. perfis de autenticação Anthropic existentes continuam disponíveis para rollback/controle de ordem

### OpenAI Codex (OAuth do ChatGPT)

O OAuth do OpenAI Codex é explicitamente compatível para uso fora da Codex CLI, inclusive em fluxos do OpenClaw.

Formato do fluxo (PKCE):

1. gerar verifier/challenge PKCE + `state` aleatório
2. abrir `https://auth.openai.com/oauth/authorize?...`
3. tentar capturar o callback em `http://127.0.0.1:1455/auth/callback`
4. se o callback não puder se vincular (ou você estiver remoto/headless), cole a URL/código de redirecionamento
5. trocar em `https://auth.openai.com/oauth/token`
6. extrair `accountId` do access token e armazenar `{ access, refresh, expires, accountId }`

O caminho do assistente é `openclaw onboard` → escolha de autenticação `openai-codex`.

## Refresh + expiração

Os perfis armazenam um timestamp `expires`.

Em runtime:

- se `expires` estiver no futuro → usar o access token armazenado
- se estiver expirado → fazer refresh (sob lock de arquivo) e sobrescrever as credenciais armazenadas
- exceção: credenciais reutilizadas de CLI externa permanecem gerenciadas externamente; o OpenClaw
  relê o armazenamento de autenticação da CLI e nunca consome o refresh token copiado por conta própria

O fluxo de refresh é automático; em geral, você não precisa gerenciar tokens manualmente.

## Múltiplas contas (perfis) + roteamento

Dois padrões:

### 1) Preferido: agentes separados

Se você quiser que “pessoal” e “trabalho” nunca interajam, use agentes isolados (sessões + credenciais + workspace separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Depois configure a autenticação por agente (assistente) e roteie os chats para o agente correto.

### 2) Avançado: múltiplos perfis em um agente

`auth-profiles.json` oferece suporte a vários IDs de perfil para o mesmo provider.

Escolha qual perfil será usado:

- globalmente via ordenação de configuração (`auth.order`)
- por sessão via `/model ...@<profileId>`

Exemplo (substituição por sessão):

- `/model Opus@anthropic:work`

Como ver quais IDs de perfil existem:

- `openclaw channels list --json` (mostra `auth[]`)

Documentação relacionada:

- [/concepts/model-failover](/pt-BR/concepts/model-failover) (regras de rotação + cooldown)
- [/tools/slash-commands](/pt-BR/tools/slash-commands) (superfície de comandos)

## Relacionado

- [Autenticação](/pt-BR/gateway/authentication) — visão geral da autenticação de providers de modelo
- [Segredos](/pt-BR/gateway/secrets) — armazenamento de credenciais e SecretRef
- [Referência de configuração](/pt-BR/gateway/configuration-reference#auth-storage) — chaves de configuração de autenticação
