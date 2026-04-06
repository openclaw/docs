---
read_when:
    - Você quer entender o OAuth do OpenClaw de ponta a ponta
    - Você encontrou problemas de invalidação de token / logout
    - Você quer fluxos de autenticação do Claude CLI ou OAuth
    - Você quer múltiplas contas ou roteamento por perfil
summary: 'OAuth no OpenClaw: troca de tokens, armazenamento e padrões com múltiplas contas'
title: OAuth
x-i18n:
    generated_at: "2026-04-06T03:07:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 402e20dfeb6ae87a90cba5824a56a7ba3b964f3716508ea5cc48a47e5affdd73
    source_path: concepts/oauth.md
    workflow: 15
---

# OAuth

O OpenClaw oferece suporte a “autenticação por assinatura” via OAuth para providers que a oferecem
(notavelmente **OpenAI Codex (ChatGPT OAuth)**). Para Anthropic, a divisão prática
agora é:

- **Chave de API da Anthropic**: cobrança normal da API Anthropic
- **Autenticação por assinatura da Anthropic dentro do OpenClaw**: a Anthropic notificou os usuários do OpenClaw
  em **4 de abril de 2026 às 12:00 PM PT / 8:00 PM BST** que isso agora
  exige **Extra Usage**

O OAuth do OpenAI Codex tem suporte explícito para uso em ferramentas externas como
OpenClaw. Esta página explica:

Para Anthropic em produção, a autenticação por chave de API é o caminho recomendado e mais seguro.

- como funciona a **troca de tokens** do OAuth (PKCE)
- onde os tokens são **armazenados** (e por quê)
- como lidar com **múltiplas contas** (perfis + sobrescritas por sessão)

O OpenClaw também oferece suporte a **plugins de provider** que incluem seus próprios fluxos de OAuth ou chave de API.
Execute-os com:

```bash
openclaw models auth login --provider <id>
```

## O token sink (por que ele existe)

Providers OAuth costumam emitir um **novo refresh token** durante fluxos de login/atualização. Alguns providers (ou clientes OAuth) podem invalidar refresh tokens antigos quando um novo é emitido para o mesmo usuário/app.

Sintoma prático:

- você faz login pelo OpenClaw _e_ pelo Claude Code / Codex CLI → um deles acaba sendo “desconectado” aleatoriamente depois

Para reduzir isso, o OpenClaw trata `auth-profiles.json` como um **token sink**:

- o runtime lê credenciais de **um único lugar**
- podemos manter vários perfis e roteá-los de forma determinística
- quando credenciais são reutilizadas de uma CLI externa como a Codex CLI, o OpenClaw
  as espelha com proveniência e relê essa fonte externa em vez de
  girar o refresh token por conta própria

## Armazenamento (onde os tokens ficam)

Os segredos são armazenados **por agente**:

- Perfis de autenticação (OAuth + chaves de API + refs opcionais em nível de valor): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Arquivo legado de compatibilidade: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entradas estáticas `api_key` são removidas quando descobertas)

Arquivo legado apenas para importação (ainda compatível, mas não é o armazenamento principal):

- `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso)

Todos os itens acima também respeitam `$OPENCLAW_STATE_DIR` (sobrescrita do diretório de estado). Referência completa: [/gateway/configuration](/pt-BR/gateway/configuration-reference#auth-storage)

Para refs estáticas de segredos e comportamento de ativação de snapshot em runtime, consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

## Compatibilidade legada de token da Anthropic

<Warning>
A documentação pública do Claude Code da Anthropic diz que o uso direto do Claude Code permanece dentro
dos limites de assinatura do Claude. Separadamente, a Anthropic informou aos usuários do OpenClaw em
**4 de abril de 2026 às 12:00 PM PT / 8:00 PM BST** que o **OpenClaw conta como um
harness de terceiros**. Perfis de token Anthropic existentes continuam tecnicamente
utilizáveis no OpenClaw, mas a Anthropic afirma que o caminho do OpenClaw agora exige **Extra
Usage** (pay-as-you-go cobrado separadamente da assinatura) para esse
tráfego.

Para a documentação atual da Anthropic sobre planos para uso direto do Claude Code, consulte [Using Claude Code
with your Pro or Max
plan](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Using Claude Code with your Team or Enterprise
plan](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se você quiser outras opções no estilo assinatura no OpenClaw, consulte [OpenAI
Codex](/pt-BR/providers/openai), [Qwen Cloud Coding
Plan](/pt-BR/providers/qwen), [MiniMax Coding Plan](/pt-BR/providers/minimax),
e [Z.AI / GLM Coding Plan](/pt-BR/providers/glm).
</Warning>

O OpenClaw agora expõe novamente o setup-token da Anthropic como um caminho legado/manual.
O aviso de cobrança específico da Anthropic para o OpenClaw ainda se aplica a esse caminho, então
use-o esperando que a Anthropic exija **Extra Usage** para
tráfego de login do Claude acionado pelo OpenClaw.

## Migração do Anthropic Claude CLI

A Anthropic não tem mais um caminho compatível de migração do Claude CLI local no
OpenClaw. Use chaves de API da Anthropic para tráfego da Anthropic, ou mantenha a autenticação
baseada em token legado apenas onde ela já estiver configurada e esperando
que a Anthropic trate esse caminho do OpenClaw como **Extra Usage**.

## Troca OAuth (como o login funciona)

Os fluxos de login interativos do OpenClaw são implementados em `@mariozechner/pi-ai` e conectados aos assistentes/comandos.

### Setup-token da Anthropic

Formato do fluxo:

1. inicie o setup-token da Anthropic ou cole um token a partir do OpenClaw
2. o OpenClaw armazena a credencial Anthropic resultante em um perfil de autenticação
3. a seleção de modelo permanece em `anthropic/...`
4. perfis de autenticação Anthropic existentes continuam disponíveis para rollback/controle de ordem

### OpenAI Codex (ChatGPT OAuth)

O OAuth do OpenAI Codex tem suporte explícito para uso fora da Codex CLI, incluindo fluxos de trabalho do OpenClaw.

Formato do fluxo (PKCE):

1. gerar verifier/challenge PKCE + `state` aleatório
2. abrir `https://auth.openai.com/oauth/authorize?...`
3. tentar capturar o callback em `http://127.0.0.1:1455/auth/callback`
4. se não for possível associar o callback (ou se você estiver remoto/headless), cole a URL/código de redirecionamento
5. trocar em `https://auth.openai.com/oauth/token`
6. extrair `accountId` do access token e armazenar `{ access, refresh, expires, accountId }`

O caminho no assistente é `openclaw onboard` → escolha de autenticação `openai-codex`.

## Refresh + expiração

Os perfis armazenam um carimbo de data/hora `expires`.

Em runtime:

- se `expires` estiver no futuro → use o access token armazenado
- se estiver expirado → faça refresh (sob um bloqueio de arquivo) e sobrescreva as credenciais armazenadas
- exceção: credenciais reutilizadas de CLI externa continuam gerenciadas externamente; o OpenClaw
  relê o armazenamento de autenticação da CLI e nunca consome por conta própria o refresh token copiado

O fluxo de refresh é automático; em geral, você não precisa gerenciar tokens manualmente.

## Múltiplas contas (perfis) + roteamento

Dois padrões:

### 1) Preferido: agentes separados

Se você quiser que “pessoal” e “trabalho” nunca interajam, use agentes isolados (sessões + credenciais + workspace separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Depois, configure a autenticação por agente (assistente) e roteie os chats para o agente correto.

### 2) Avançado: múltiplos perfis em um agente

`auth-profiles.json` oferece suporte a vários IDs de perfil para o mesmo provider.

Escolha qual perfil será usado:

- globalmente via ordenação da configuração (`auth.order`)
- por sessão via `/model ...@<profileId>`

Exemplo (sobrescrita por sessão):

- `/model Opus@anthropic:work`

Como ver quais IDs de perfil existem:

- `openclaw channels list --json` (mostra `auth[]`)

Documentação relacionada:

- [/concepts/model-failover](/pt-BR/concepts/model-failover) (revezamento + regras de cooldown)
- [/tools/slash-commands](/pt-BR/tools/slash-commands) (superfície de comandos)

## Relacionado

- [Autenticação](/pt-BR/gateway/authentication) — visão geral de autenticação de provider de modelo
- [Segredos](/pt-BR/gateway/secrets) — armazenamento de credenciais e SecretRef
- [Referência de configuração](/pt-BR/gateway/configuration-reference#auth-storage) — chaves de configuração de autenticação
