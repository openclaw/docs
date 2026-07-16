---
read_when:
    - Você quer entender o OAuth do OpenClaw de ponta a ponta
    - Você está enfrentando problemas de invalidação de token / logout
    - Você quer fluxos de autenticação do Claude CLI ou via OAuth
    - Você quer várias contas ou roteamento de perfis
summary: 'OAuth no OpenClaw: troca e armazenamento de tokens e padrões de múltiplas contas'
title: OAuth
x-i18n:
    generated_at: "2026-07-16T12:25:24Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 3ef94af0601b7d57bb7e2d53c3d8231708b401251eca7dc1bb1e7e4fc09b46da
    source_path: concepts/oauth.md
    workflow: 16
---

O OpenClaw oferece suporte a OAuth ("autenticação por assinatura") para provedores que o disponibilizam,
principalmente **OpenAI Codex (OAuth do ChatGPT)** e **reutilização da CLI do Anthropic Claude**.
Para a Anthropic, a divisão prática é:

- **Chave de API da Anthropic**: cobrança normal da API da Anthropic.
- **CLI do Anthropic Claude/autenticação por assinatura no OpenClaw**: a equipe da Anthropic
  informou que esse uso voltou a ser permitido; portanto, o OpenClaw considera a reutilização da CLI do Claude e
  o uso de `claude -p` autorizados para esta integração, a menos que a Anthropic
  publique uma nova política. Para usar a Anthropic em produção, a autenticação por chave de API ainda é
  o caminho recomendado mais seguro.

O OpenClaw armazena tanto a autenticação por chave de API da OpenAI quanto o OAuth do ChatGPT/Codex sob o
ID canônico de provedor `openai`. IDs de perfil `openai-codex:*` antigos e
entradas `auth.order.openai-codex` são estados legados corrigidos por
`openclaw doctor --fix`; use IDs de perfil `openai:*` e `auth.order.openai` em
novas configurações.

Esta página aborda:

- como funciona a **troca de tokens** do OAuth (PKCE)
- onde os tokens são **armazenados** (e por quê)
- como lidar com **várias contas** (perfis + substituições por sessão)

Plugins de provedor que incluem seu próprio fluxo de OAuth ou de chave de API são executados pelo
mesmo ponto de entrada:

```bash
openclaw models auth login --provider <id>
```

## O repositório de tokens (por que ele existe)

Os provedores de OAuth geralmente emitem um novo token de atualização a cada login/atualização.
Alguns provedores invalidam o token de atualização anterior quando um novo é
emitido para o mesmo usuário/aplicativo. Sintoma prático: ao entrar pelo OpenClaw _e_
pelo Claude Code/Codex CLI, um deles encerra a sessão aleatoriamente mais tarde.

Para reduzir isso, o OpenClaw trata o armazenamento de perfis de autenticação como um **repositório de tokens**:

- o ambiente de execução lê as credenciais de um único local por agente
- vários perfis podem coexistir e ser roteados de maneira determinística
- a reutilização de CLI externa é específica do provedor: assim que o OpenClaw passa a controlar um perfil OAuth
  local de um provedor, o token de atualização local torna-se canônico. Se esse token de
  atualização local for rejeitado, o OpenClaw indica o perfil que precisa de
  nova autenticação, em vez de recorrer ao material de token da CLI externa.
  A inicialização pela Codex CLI é ainda mais restrita: ela só pode preencher um perfil vazio
  no estilo `openai:default` antes que o OpenClaw passe a controlar o OAuth desse
  provedor; depois disso, as atualizações controladas pelo OpenClaw permanecem canônicas
- os caminhos de status/inicialização limitam a descoberta de CLIs externas ao conjunto de provedores
  já configurados, para que o armazenamento de login de uma CLI não relacionada não seja consultado em uma
  configuração com um único provedor

## Armazenamento (onde ficam os tokens)

Os segredos ficam armazenados por agente, identificados pelo nome lógico `auth-profiles.json` (o
armazenamento subjacente é o banco de dados SQLite do agente; o nome JSON é mantido por
compatibilidade e para exibição nas ferramentas):

- Perfis de autenticação (OAuth + chaves de API + referências opcionais no nível do valor):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Arquivo de compatibilidade legado: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entradas `api_key` estáticas são removidas quando encontradas)

Arquivo legado somente para importação (ainda compatível, mas não é o armazenamento principal):

- `~/.openclaw/credentials/oauth.json` (importado para o armazenamento de perfis de autenticação no primeiro uso)

Todos os itens acima também respeitam `$OPENCLAW_STATE_DIR` (substituição do diretório de estado). Referência completa: [/gateway/configuration-reference#auth-storage](/pt-BR/gateway/configuration-reference#auth-storage)

Para referências estáticas de segredos e o comportamento de ativação de instantâneos no ambiente de execução, consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

Quando um agente secundário não tem um perfil de autenticação local, o OpenClaw usa herança
com leitura direta do armazenamento do agente padrão/principal; ele não clona o armazenamento do agente
principal durante a leitura. Os tokens de atualização OAuth são especialmente sensíveis: os fluxos normais
de cópia os ignoram por padrão porque alguns provedores alternam ou invalidam
tokens de atualização após o uso. Configure um login OAuth separado para um agente quando
ele precisar de uma conta independente.

## Reutilização da CLI do Anthropic Claude

O OpenClaw oferece suporte à reutilização da CLI do Anthropic Claude e a `claude -p` como um caminho de
autenticação autorizado. Se já houver um login local do Claude no host,
o processo de integração/configuração poderá reutilizá-lo diretamente. O token de configuração da Anthropic continua
disponível como um caminho de autenticação por token compatível, mas o OpenClaw prefere a reutilização da CLI
do Claude quando ela está disponível.

<Warning>
A documentação pública do Claude Code da Anthropic afirma que o uso direto do Claude Code permanece dentro
dos limites da assinatura do Claude, e a equipe da Anthropic informou que o uso da CLI do Claude no estilo do OpenClaw
voltou a ser permitido. Portanto, o OpenClaw considera a reutilização da CLI do Claude e
o uso de `claude -p` autorizados para esta integração, a menos que a Anthropic
publique uma nova política.

Para consultar a documentação atual da Anthropic sobre planos para uso direto do Claude Code, veja [Como usar o Claude Code
com seu plano Pro ou
Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Como usar o Claude Code com seu plano Team ou Enterprise
](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Para conhecer outras opções no estilo de assinatura no OpenClaw, consulte [OpenAI
Codex](/pt-BR/providers/openai), [Plano de codificação do Qwen Cloud
](/pt-BR/providers/qwen), [Plano de codificação do MiniMax](/pt-BR/providers/minimax)
e [Plano de codificação do Z.AI/GLM](/pt-BR/providers/zai).
</Warning>

## Troca OAuth (como funciona o login)

Os fluxos de login interativo do OpenClaw são implementados em `openclaw/plugin-sdk/llm.ts` e integrados aos assistentes/comandos.

### Token de configuração da Anthropic

Formato do fluxo:

1. crie o token executando `claude setup-token` em qualquer máquina com o Claude Code e, em seguida, inicie o token de configuração da Anthropic ou cole o token pelo OpenClaw
2. o OpenClaw armazena a credencial resultante da Anthropic em um perfil de autenticação
3. a seleção do modelo permanece em `anthropic/...`
4. os perfis de autenticação existentes da Anthropic permanecem disponíveis para reversão/controle de ordem

### OpenAI Codex (OAuth do ChatGPT)

O OAuth do OpenAI Codex é explicitamente compatível com o uso fora da Codex CLI, inclusive em fluxos de trabalho do OpenClaw.

O comando de login usa o ID canônico de provedor da OpenAI:

```bash
openclaw models auth login --provider openai
```

Use `--profile-id openai:<name>` para várias contas OAuth do ChatGPT/Codex em
um único agente. Não use `openai-codex:<name>` para novos perfis. O Doctor migra
esse prefixo antigo para um ID de perfil `openai:*` sem colisões; execute
`openclaw models auth list --provider openai` após a correção, antes de copiar
IDs de perfil para `auth.order` ou `/model ...@<profileId>`.

Formato do fluxo (PKCE):

1. gere um verificador/desafio PKCE e um `state` aleatório
2. abra `https://auth.openai.com/oauth/authorize?...` (escopo
   `openid profile email offline_access`)
3. tente capturar o retorno de chamada em `http://localhost:1455/auth/callback` (o
   host de retorno de chamada usa `localhost` por padrão e aceita apenas hosts de loopback;
   substitua-o com `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. se for possível colar um código antes da chegada do retorno de chamada (ou se o ambiente for
   remoto/sem interface gráfica e não for possível vincular o retorno de chamada), cole a URL/o código de redirecionamento
   em vez disso — a colagem manual disputa com o retorno de chamada do navegador, e vence o que
   for concluído primeiro
5. troque o código em `https://auth.openai.com/oauth/token`
6. extraia `accountId` do token de acesso e armazene `{ access, refresh, expires, accountId }`

O caminho do assistente é `openclaw onboard` → opção de autenticação `openai`.

## Atualização + expiração

Os perfis armazenam um carimbo de data/hora `expires`. No ambiente de execução:

- se `expires` estiver no futuro, use o token de acesso armazenado
- se estiver expirado, atualize-o (sob um bloqueio de arquivo) e substitua as credenciais armazenadas
- se um agente secundário ler um perfil OAuth herdado do agente principal, a
  atualização será gravada novamente no armazenamento do agente principal, em vez de copiar o token de atualização
  para o armazenamento do agente secundário
- as credenciais de CLI gerenciadas externamente (CLI do Claude, inicialização restrita pela Codex CLI;
  consulte [O repositório de tokens](#the-token-sink-why-it-exists)) são relidas em vez de
  consumir um token de atualização copiado. Se uma atualização gerenciada falhar, o OpenClaw
  indicará o perfil afetado para nova autenticação em vez de retornar
  o material de token da CLI externa.

O fluxo de atualização é automático; geralmente, não é necessário gerenciar tokens manualmente.

## Várias contas (perfis) + roteamento

Dois padrões:

### 1) Recomendado: agentes separados

Para impedir qualquer interação entre as contas "pessoal" e "trabalho", use agentes isolados (sessões + credenciais + espaços de trabalho separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Em seguida, configure a autenticação por agente (assistente) e encaminhe as conversas ao agente correto.

### 2) Avançado: vários perfis em um único agente

O armazenamento de perfis de autenticação oferece suporte a vários IDs de perfil para o mesmo provedor.
Escolha qual deles será usado:

- globalmente, pela ordem da configuração (`auth.order`)
- por sessão, por meio de `/model ...@<profileId>`

Exemplo (substituição da sessão):

- `/model Opus@anthropic:work`

Liste os IDs de perfil existentes com:

```bash
openclaw models auth list --provider <id>
```

Documentação relacionada:

- [Failover de modelo](/pt-BR/concepts/model-failover) (regras de alternância + período de espera)
- [Comandos de barra](/pt-BR/tools/slash-commands) (superfície de comandos)

## Conteúdo relacionado

- [Autenticação](/pt-BR/gateway/authentication) — visão geral da autenticação de provedores de modelos
- [Segredos](/pt-BR/gateway/secrets) — armazenamento de credenciais e SecretRef
- [Referência de configuração](/pt-BR/gateway/configuration-reference#auth-storage) — chaves de configuração de autenticação
