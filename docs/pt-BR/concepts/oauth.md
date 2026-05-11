---
read_when:
    - Você quer entender o OAuth do OpenClaw de ponta a ponta
    - Você enfrenta problemas de invalidação de token / encerramento de sessão
    - Você quer fluxos de autenticação do Claude CLI ou OAuth
    - Você quer várias contas ou roteamento de perfis
summary: 'OAuth no OpenClaw: troca de tokens, armazenamento e padrões de múltiplas contas'
title: OAuth
x-i18n:
    generated_at: "2026-05-11T20:28:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 2a7382fbcbe7e6034057da66a2dd8685df6d9345c36eeb8261eb12440d00a402
    source_path: concepts/oauth.md
    workflow: 16
---

OpenClaw é compatível com "autenticação de assinatura" via OAuth para provedores que a oferecem
(especialmente **OpenAI Codex (ChatGPT OAuth)**). Para Anthropic, a divisão prática
agora é:

- **Chave de API da Anthropic**: cobrança normal da API da Anthropic
- **Anthropic Claude CLI / autenticação de assinatura dentro do OpenClaw**: a equipe da Anthropic
  nos informou que esse uso voltou a ser permitido

O OpenAI Codex OAuth é explicitamente compatível para uso em ferramentas externas como
OpenClaw. Esta página explica:

Para Anthropic em produção, a autenticação por chave de API é o caminho recomendado mais seguro.

- como a **troca de tokens** OAuth funciona (PKCE)
- onde os tokens são **armazenados** (e por quê)
- como lidar com **várias contas** (perfis + substituições por sessão)

O OpenClaw também é compatível com **plugins de provedor** que trazem seus próprios fluxos
de OAuth ou chave de API. Execute-os via:

```bash
openclaw models auth login --provider <id>
```

## O coletor de tokens (por que ele existe)

Provedores OAuth normalmente emitem um **novo token de atualização** durante fluxos de login/atualização. Alguns provedores (ou clientes OAuth) podem invalidar tokens de atualização antigos quando um novo é emitido para o mesmo usuário/app.

Sintoma prático:

- você faz login via OpenClaw _e_ via Claude Code / Codex CLI → um deles é "desconectado" aleatoriamente mais tarde

Para reduzir isso, o OpenClaw trata `auth-profiles.json` como um **coletor de tokens**:

- o runtime lê credenciais de **um só lugar**
- podemos manter vários perfis e roteá-los de forma determinística
- a reutilização de CLI externa é específica do provedor: o Codex CLI pode inicializar um perfil
  `openai-codex:default` vazio, mas, quando o OpenClaw tem um perfil OAuth local,
  o token de atualização local é canônico; outras integrações podem permanecer
  gerenciadas externamente e reler o armazenamento de autenticação da CLI delas
- caminhos de status e inicialização que já conhecem o conjunto configurado de provedores limitam
  a descoberta de CLI externa a esse conjunto, para que um armazenamento de login de CLI não relacionado
  não seja consultado em uma configuração de provedor único

## Armazenamento (onde os tokens ficam)

Segredos são armazenados nos armazenamentos de autenticação do agente:

- Perfis de autenticação (OAuth + chaves de API + refs opcionais em nível de valor): `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Arquivo de compatibilidade legado: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entradas estáticas de `api_key` são limpas quando descobertas)

Arquivo legado apenas para importação (ainda compatível, mas não é o armazenamento principal):

- `~/.openclaw/credentials/oauth.json` (importado para `auth-profiles.json` no primeiro uso)

Todos os itens acima também respeitam `$OPENCLAW_STATE_DIR` (substituição do diretório de estado). Referência completa: [/gateway/configuration](/pt-BR/gateway/configuration-reference#auth-storage)

Para refs de segredo estático e comportamento de ativação de snapshot em runtime, consulte [Gerenciamento de Segredos](/pt-BR/gateway/secrets).

Quando um agente secundário não tem perfil de autenticação local, o OpenClaw usa herança
com leitura direta do armazenamento do agente padrão/principal. Ele não clona o
`auth-profiles.json` do agente principal na leitura. Tokens de atualização OAuth são especialmente
sensíveis: fluxos normais de cópia os ignoram por padrão porque alguns provedores rotacionam
ou invalidam tokens de atualização após o uso. Configure um login OAuth separado para um
agente quando ele precisar de uma conta independente.

## Compatibilidade com tokens legados da Anthropic

<Warning>
A documentação pública do Claude Code da Anthropic diz que o uso direto do Claude Code permanece dentro dos
limites da assinatura Claude, e a equipe da Anthropic nos informou que o uso da Claude
CLI no estilo do OpenClaw voltou a ser permitido. Portanto, o OpenClaw trata a reutilização da Claude CLI e o uso de
`claude -p` como sancionados para esta integração, a menos que a Anthropic
publique uma nova política.

Para a documentação atual da Anthropic sobre planos diretos do Claude Code, consulte [Como usar o Claude Code
com seu plano Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Como usar o Claude Code com seu plano Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se você quiser outras opções no estilo de assinatura no OpenClaw, consulte [OpenAI
Codex](/pt-BR/providers/openai), [Qwen Cloud Coding
Plan](/pt-BR/providers/qwen), [MiniMax Coding Plan](/pt-BR/providers/minimax),
e [Z.AI / GLM Coding Plan](/pt-BR/providers/glm).
</Warning>

O OpenClaw também expõe o setup-token da Anthropic como um caminho compatível de autenticação por token, mas agora prefere a reutilização da Claude CLI e `claude -p` quando disponíveis.

## Migração da Anthropic Claude CLI

O OpenClaw voltou a ser compatível com a reutilização da Anthropic Claude CLI. Se você já tiver um login
local do Claude no host, o onboarding/configuração pode reutilizá-lo diretamente.

## Troca OAuth (como o login funciona)

Os fluxos de login interativo do OpenClaw são implementados em `@earendil-works/pi-ai` e conectados aos assistentes/comandos.

### Anthropic setup-token

Formato do fluxo:

1. inicie o setup-token ou paste-token da Anthropic a partir do OpenClaw
2. o OpenClaw armazena a credencial Anthropic resultante em um perfil de autenticação
3. a seleção de modelo permanece em `anthropic/...`
4. perfis de autenticação Anthropic existentes continuam disponíveis para rollback/controle de ordem

### OpenAI Codex (ChatGPT OAuth)

O OpenAI Codex OAuth é explicitamente compatível para uso fora do Codex CLI, incluindo fluxos de trabalho do OpenClaw.

Formato do fluxo (PKCE):

1. gere verificador/desafio PKCE + `state` aleatório
2. abra `https://auth.openai.com/oauth/authorize?...`
3. tente capturar o callback em `http://127.0.0.1:1455/auth/callback`
4. se o callback não puder vincular (ou você estiver remoto/headless), cole a URL/código de redirecionamento
5. faça a troca em `https://auth.openai.com/oauth/token`
6. extraia `accountId` do token de acesso e armazene `{ access, refresh, expires, accountId }`

O caminho do assistente é `openclaw onboard` → escolha de autenticação `openai-codex`.

## Atualização + expiração

Perfis armazenam um carimbo de data/hora `expires`.

Em runtime:

- se `expires` está no futuro → use o token de acesso armazenado
- se expirou → atualize (sob um bloqueio de arquivo) e sobrescreva as credenciais armazenadas
- se um agente secundário lê um perfil OAuth herdado do agente principal, a atualização
  grava de volta no armazenamento do agente principal em vez de copiar o token de atualização para
  o armazenamento do agente secundário
- exceção: algumas credenciais de CLI externa permanecem gerenciadas externamente; o OpenClaw
  relê esses armazenamentos de autenticação de CLI em vez de gastar tokens de atualização copiados.
  A inicialização do Codex CLI é intencionalmente mais restrita: ela semeia um perfil
  `openai-codex:default` vazio, então as atualizações de propriedade do OpenClaw mantêm o perfil
  local como canônico.

O fluxo de atualização é automático; em geral, você não precisa gerenciar tokens manualmente.

## Várias contas (perfis) + roteamento

Dois padrões:

### 1) Preferido: agentes separados

Se você quiser que "pessoal" e "trabalho" nunca interajam, use agentes isolados (sessões + credenciais + workspace separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Depois configure a autenticação por agente (assistente) e direcione chats para o agente certo.

### 2) Avançado: vários perfis em um agente

`auth-profiles.json` é compatível com vários IDs de perfil para o mesmo provedor.

Escolha qual perfil é usado:

- globalmente via ordenação de configuração (`auth.order`)
- por sessão via `/model ...@<profileId>`

Exemplo (substituição de sessão):

- `/model Opus@anthropic:work`

Como ver quais IDs de perfil existem:

- `openclaw channels list --json` (mostra `auth[]`)

Documentação relacionada:

- [Failover de modelos](/pt-BR/concepts/model-failover) (regras de rotação + cooldown)
- [Comandos slash](/pt-BR/tools/slash-commands) (superfície de comando)

## Relacionados

- [Autenticação](/pt-BR/gateway/authentication) - visão geral de autenticação de provedores de modelo
- [Segredos](/pt-BR/gateway/secrets) - armazenamento de credenciais e SecretRef
- [Referência de configuração](/pt-BR/gateway/configuration-reference#auth-storage) - chaves de configuração de autenticação
