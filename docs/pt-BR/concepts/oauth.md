---
read_when:
    - Você quer entender o OAuth do OpenClaw de ponta a ponta
    - Você está enfrentando problemas de invalidação de tokens / encerramento de sessão
    - Você quer os fluxos de autenticação da CLI do Claude ou via OAuth
    - Você quer várias contas ou roteamento de perfis
summary: 'OAuth no OpenClaw: troca e armazenamento de tokens e padrões de múltiplas contas'
title: OAuth
x-i18n:
    generated_at: "2026-07-11T23:55:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

O OpenClaw oferece suporte a OAuth ("autenticação por assinatura") para provedores que o disponibilizam,
principalmente **OpenAI Codex (OAuth do ChatGPT)** e **reutilização da CLI do Anthropic Claude**.
Para o Anthropic, a divisão prática é:

- **Chave de API do Anthropic**: cobrança normal da API do Anthropic.
- **CLI do Anthropic Claude/autenticação por assinatura no OpenClaw**: a equipe do Anthropic
  nos informou que esse uso voltou a ser permitido; portanto, o OpenClaw considera a reutilização
  da CLI do Claude e o uso de `claude -p` autorizados para essa integração, a menos que o Anthropic
  publique uma nova política. Para usar o Anthropic em produção, a autenticação por chave de API
  ainda é o caminho recomendado mais seguro.

O OpenClaw armazena tanto a autenticação por chave de API da OpenAI quanto o OAuth do ChatGPT/Codex
sob o ID canônico de provedor `openai`. IDs de perfil antigos `openai-codex:*` e entradas
`auth.order.openai-codex` são estados legados corrigidos por
`openclaw doctor --fix`; use IDs de perfil `openai:*` e `auth.order.openai` em
novas configurações.

Esta página aborda:

- como funciona a **troca de tokens** OAuth (PKCE)
- onde os tokens são **armazenados** (e por quê)
- como lidar com **várias contas** (perfis + substituições por sessão)

Plugins de provedores que fornecem seu próprio fluxo OAuth ou de chave de API usam o
mesmo ponto de entrada:

```bash
openclaw models auth login --provider <id>
```

## O sumidouro de tokens (por que ele existe)

Provedores OAuth normalmente emitem um novo token de atualização a cada login/atualização.
Alguns provedores invalidam o token de atualização anterior quando um novo é
emitido para o mesmo usuário/aplicativo. Sintoma prático: você entra pelo OpenClaw _e_
pelo Claude Code/Codex CLI, e um deles encerra a sessão aleatoriamente mais tarde.

Para reduzir esse problema, o OpenClaw trata o armazenamento de perfis de autenticação como um **sumidouro de tokens**:

- o ambiente de execução lê credenciais de um único local por agente
- vários perfis podem coexistir e ser roteados de forma determinística
- a reutilização de CLIs externas é específica do provedor: depois que o OpenClaw passa a controlar um perfil OAuth
  local para um provedor, o token de atualização local torna-se canônico. Se esse token
  de atualização local for rejeitado, o OpenClaw informa qual perfil precisa de
  nova autenticação, em vez de recorrer ao material de token da CLI externa.
  A inicialização a partir da Codex CLI é ainda mais restrita: ela só pode preencher um perfil vazio
  no estilo `openai:default` antes que o OpenClaw passe a controlar o OAuth desse
  provedor; depois disso, as atualizações controladas pelo OpenClaw permanecem canônicas
- os caminhos de status/inicialização limitam a descoberta de CLIs externas ao conjunto de provedores
  já configurados, de modo que o armazenamento de login de uma CLI não relacionada não seja consultado em uma
  configuração com um único provedor

## Armazenamento (onde ficam os tokens)

Os segredos ficam separados por agente, identificados pelo nome lógico `auth-profiles.json` (o
armazenamento subjacente é o banco de dados SQLite do agente; o nome JSON é mantido por
compatibilidade e para exibição nas ferramentas):

- Perfis de autenticação (OAuth + chaves de API + referências opcionais por valor):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Arquivo legado de compatibilidade: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entradas estáticas `api_key` são removidas quando detectadas)

Arquivo legado somente para importação (ainda compatível, mas não é o armazenamento principal):

- `~/.openclaw/credentials/oauth.json` (importado para o armazenamento de perfis de autenticação no primeiro uso)

Todos os caminhos acima também respeitam `$OPENCLAW_STATE_DIR` (substituição do diretório de estado). Referência completa: [/gateway/configuration-reference#auth-storage](/pt-BR/gateway/configuration-reference#auth-storage)

Para referências estáticas a segredos e o comportamento de ativação de instantâneos no ambiente de execução, consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

Quando um agente secundário não tem um perfil de autenticação local, o OpenClaw usa herança
por leitura do armazenamento do agente padrão/principal; ele não clona o armazenamento do agente
principal durante a leitura. Tokens de atualização OAuth são especialmente sensíveis: os fluxos normais
de cópia os ignoram por padrão porque alguns provedores alternam ou invalidam
tokens de atualização após o uso. Configure um login OAuth separado para um agente quando
ele precisar de uma conta independente.

## Reutilização da CLI do Anthropic Claude

O OpenClaw oferece suporte à reutilização da CLI do Anthropic Claude e a `claude -p` como um caminho
de autenticação autorizado. Se você já tiver um login local do Claude no host,
a integração/configuração poderá reutilizá-lo diretamente. O token de configuração do Anthropic continua
disponível como um caminho compatível de autenticação por token, mas o OpenClaw prefere a reutilização da CLI
do Claude quando ela está disponível.

<Warning>
A documentação pública do Claude Code do Anthropic informa que o uso direto do Claude Code permanece dentro
dos limites da assinatura do Claude, e a equipe do Anthropic nos informou que o uso da CLI do Claude no estilo do
OpenClaw voltou a ser permitido. Portanto, o OpenClaw considera a reutilização da CLI do Claude e
o uso de `claude -p` autorizados para essa integração, a menos que o Anthropic
publique uma nova política.

Para consultar a documentação atual dos planos para uso direto do Claude Code do Anthropic, veja [Como usar o Claude Code
com seu plano Pro ou
Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Como usar o Claude Code com seu plano Team ou Enterprise
](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se quiser outras opções no estilo de assinatura no OpenClaw, consulte [OpenAI
Codex](/pt-BR/providers/openai), [Plano de programação do Qwen Cloud
](/pt-BR/providers/qwen), [Plano de programação do MiniMax](/pt-BR/providers/minimax)
e [Plano de programação do Z.AI/GLM](/pt-BR/providers/zai).
</Warning>

## Troca OAuth (como funciona o login)

Os fluxos interativos de login do OpenClaw são implementados em `openclaw/plugin-sdk/llm.ts` e conectados aos assistentes/comandos.

### Token de configuração do Anthropic

Formato do fluxo:

1. inicie o token de configuração ou cole o token do Anthropic pelo OpenClaw
2. o OpenClaw armazena a credencial resultante do Anthropic em um perfil de autenticação
3. a seleção de modelo permanece em `anthropic/...`
4. os perfis existentes de autenticação do Anthropic continuam disponíveis para reversão/controle de ordem

### OpenAI Codex (OAuth do ChatGPT)

O OAuth do OpenAI Codex é explicitamente compatível com o uso fora da Codex CLI, inclusive em fluxos de trabalho do OpenClaw.

O comando de login usa o ID canônico do provedor OpenAI:

```bash
openclaw models auth login --provider openai
```

Use `--profile-id openai:<name>` para várias contas OAuth do ChatGPT/Codex em
um único agente. Não use `openai-codex:<name>` para novos perfis. O Doctor migra
esse prefixo antigo para um ID de perfil `openai:*` sem colisões; execute
`openclaw models auth list --provider openai` após a correção antes de copiar
IDs de perfil para `auth.order` ou `/model ...@<profileId>`.

Formato do fluxo (PKCE):

1. gere um verificador/desafio PKCE e um `state` aleatório
2. abra `https://auth.openai.com/oauth/authorize?...` (escopo
   `openid profile email offline_access`)
3. tente capturar o retorno em `http://localhost:1455/auth/callback` (o
   host de retorno usa `localhost` por padrão e aceita apenas hosts local loopback;
   substitua-o com `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. se puder colar um código antes da chegada do retorno (ou se estiver em
   um ambiente remoto/sem interface gráfica e não for possível vincular o retorno), cole a URL/o código de redirecionamento
   — a colagem manual disputa com o retorno do navegador, e vence o que for concluído
   primeiro
5. troque o código em `https://auth.openai.com/oauth/token`
6. extraia `accountId` do token de acesso e armazene `{ access, refresh, expires, accountId }`

O caminho pelo assistente é `openclaw onboard` → opção de autenticação `openai`.

## Atualização + expiração

Os perfis armazenam um carimbo de data e hora `expires`. No ambiente de execução:

- se `expires` estiver no futuro, use o token de acesso armazenado
- se estiver expirado, atualize-o (sob bloqueio de arquivo) e sobrescreva as credenciais armazenadas
- se um agente secundário ler um perfil OAuth herdado do agente principal, a
  atualização será gravada de volta no armazenamento do agente principal, em vez de copiar o token de atualização
  para o armazenamento do agente secundário
- credenciais de CLI gerenciadas externamente (CLI do Claude, inicialização restrita pela Codex CLI;
  consulte [O sumidouro de tokens](#the-token-sink-why-it-exists)) são relidas em vez de
  consumir um token de atualização copiado. Se uma atualização gerenciada falhar, o OpenClaw
  informa o perfil afetado para nova autenticação, em vez de retornar
  material de token da CLI externa.

O fluxo de atualização é automático; em geral, você não precisa gerenciar os tokens manualmente.

## Várias contas (perfis) + roteamento

Dois padrões:

### 1) Preferencial: agentes separados

Se quiser que as contas "pessoal" e "trabalho" nunca interajam, use agentes isolados (sessões + credenciais + espaço de trabalho separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Em seguida, configure a autenticação por agente (assistente) e encaminhe as conversas para o agente correto.

### 2) Avançado: vários perfis em um agente

O armazenamento de perfis de autenticação aceita vários IDs de perfil para o mesmo provedor.
Escolha qual será usado:

- globalmente, pela ordem da configuração (`auth.order`)
- por sessão, por meio de `/model ...@<profileId>`

Exemplo (substituição da sessão):

- `/model Opus@anthropic:work`

Liste os IDs de perfil existentes com:

```bash
openclaw models auth list --provider <id>
```

Documentação relacionada:

- [Failover de modelos](/pt-BR/concepts/model-failover) (regras de rotação + período de espera)
- [Comandos de barra](/pt-BR/tools/slash-commands) (interface de comandos)

## Relacionado

- [Autenticação](/pt-BR/gateway/authentication) - visão geral da autenticação dos provedores de modelos
- [Segredos](/pt-BR/gateway/secrets) - armazenamento de credenciais e SecretRef
- [Referência de configuração](/pt-BR/gateway/configuration-reference#auth-storage) - chaves de configuração de autenticação
