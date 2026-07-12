---
read_when:
    - Você quer entender o OAuth do OpenClaw de ponta a ponta
    - Você enfrenta problemas de invalidação de token / logout
    - Você quer fluxos de autenticação da CLI do Claude ou via OAuth
    - Você quer várias contas ou roteamento de perfis
summary: 'OAuth no OpenClaw: troca e armazenamento de tokens e padrões de múltiplas contas'
title: OAuth
x-i18n:
    generated_at: "2026-07-12T15:06:29Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 51aa98a9cb9614107ce979eca235c175a1748df2facdded852cd8899cebba22c
    source_path: concepts/oauth.md
    workflow: 16
---

O OpenClaw oferece suporte a OAuth ("autenticação por assinatura") para provedores que o disponibilizam,
principalmente **OpenAI Codex (OAuth do ChatGPT)** e **reutilização da CLI do Anthropic Claude**.
Para o Anthropic, a divisão prática é:

- **Chave de API do Anthropic**: cobrança normal da API do Anthropic.
- **Autenticação pela CLI do Anthropic Claude/por assinatura dentro do OpenClaw**: a equipe do Anthropic
  nos informou que esse uso voltou a ser permitido, portanto o OpenClaw considera a reutilização da CLI do Claude e
  o uso de `claude -p` autorizados para esta integração, a menos que o Anthropic
  publique uma nova política. Para usar o Anthropic em produção, a autenticação por chave de API ainda é
  o caminho mais seguro e recomendado.

O OpenClaw armazena tanto a autenticação por chave de API da OpenAI quanto o OAuth do ChatGPT/Codex sob o
ID de provedor canônico `openai`. IDs de perfil `openai-codex:*` antigos e
entradas `auth.order.openai-codex` são estados legados corrigidos por
`openclaw doctor --fix`; use IDs de perfil `openai:*` e `auth.order.openai` em
novas configurações.

Esta página aborda:

- como funciona a **troca de tokens** OAuth (PKCE)
- onde os tokens são **armazenados** (e por quê)
- como lidar com **várias contas** (perfis + substituições por sessão)

Plugins de provedores que disponibilizam seu próprio fluxo de OAuth ou chave de API usam o
mesmo ponto de entrada:

```bash
openclaw models auth login --provider <id>
```

## O coletor de tokens (por que ele existe)

Provedores OAuth geralmente emitem um novo token de atualização a cada login/atualização.
Alguns provedores invalidam o token de atualização anterior quando um novo é
emitido para o mesmo usuário/aplicativo. Sintoma prático: faça login pelo OpenClaw _e_
pelo Claude Code/Codex CLI, e um deles será desconectado aleatoriamente mais tarde.

Para reduzir esse problema, o OpenClaw trata o armazenamento de perfis de autenticação como um **coletor de tokens**:

- o runtime lê as credenciais de um único local por agente
- vários perfis podem coexistir e ser roteados de forma determinística
- a reutilização de CLIs externas é específica do provedor: assim que o OpenClaw passa a controlar um perfil OAuth
  local de um provedor, o token de atualização local se torna canônico. Se esse token de
  atualização local for rejeitado, o OpenClaw informa qual perfil precisa de
  reautenticação, em vez de recorrer aos dados de token de uma CLI externa.
  A inicialização pela Codex CLI é ainda mais restrita: ela só pode preencher um perfil vazio
  no estilo `openai:default` antes de o OpenClaw passar a controlar o OAuth desse
  provedor; depois disso, as atualizações controladas pelo OpenClaw permanecem canônicas
- os caminhos de status/inicialização limitam a descoberta de CLIs externas ao conjunto de provedores
  já configurados, portanto o armazenamento de login de uma CLI não relacionada não é consultado em uma
  configuração com um único provedor

## Armazenamento (onde ficam os tokens)

Os segredos ficam separados por agente, identificados pelo nome lógico `auth-profiles.json` (o
armazenamento subjacente é o banco de dados SQLite do agente; o nome JSON é mantido para
compatibilidade e exibição em ferramentas):

- Perfis de autenticação (OAuth + chaves de API + referências opcionais no nível do valor):
  `~/.openclaw/agents/<agentId>/agent/auth-profiles.json`
- Arquivo de compatibilidade legado: `~/.openclaw/agents/<agentId>/agent/auth.json`
  (entradas estáticas `api_key` são removidas quando detectadas)

Arquivo legado apenas para importação (ainda compatível, mas não é o armazenamento principal):

- `~/.openclaw/credentials/oauth.json` (importado para o armazenamento de perfis de autenticação no primeiro uso)

Todos os itens acima também respeitam `$OPENCLAW_STATE_DIR` (substituição do diretório de estado). Referência completa: [/gateway/configuration-reference#auth-storage](/pt-BR/gateway/configuration-reference#auth-storage)

Para referências estáticas de segredos e o comportamento de ativação de instantâneos no runtime, consulte [Gerenciamento de segredos](/pt-BR/gateway/secrets).

Quando um agente secundário não tem um perfil de autenticação local, o OpenClaw usa herança
com leitura direta do armazenamento do agente padrão/principal; ele não clona o armazenamento do agente
principal durante a leitura. Tokens de atualização OAuth são especialmente sensíveis: os fluxos normais
de cópia os ignoram por padrão, pois alguns provedores alternam ou invalidam
tokens de atualização após o uso. Configure um login OAuth separado para um agente quando
ele precisar de uma conta independente.

## Reutilização da CLI do Anthropic Claude

O OpenClaw oferece suporte à reutilização da CLI do Anthropic Claude e ao `claude -p` como um caminho de
autenticação autorizado. Se você já tiver um login local do Claude no host,
a integração/configuração poderá reutilizá-lo diretamente. O token de configuração do Anthropic continua
disponível como um caminho compatível de autenticação por token, mas o OpenClaw prefere reutilizar a CLI do Claude
quando ela está disponível.

<Warning>
A documentação pública do Claude Code do Anthropic afirma que o uso direto do Claude Code permanece dentro dos
limites da assinatura do Claude, e a equipe do Anthropic nos informou que o uso da CLI do Claude no estilo do OpenClaw
voltou a ser permitido. Portanto, o OpenClaw considera a reutilização da CLI do Claude e
o uso de `claude -p` autorizados para esta integração, a menos que o Anthropic
publique uma nova política.

Para consultar a documentação atual do Anthropic sobre planos para uso direto do Claude Code, consulte [Como usar o Claude Code
com seu plano Pro ou Max](https://support.claude.com/en/articles/11145838-using-claude-code-with-your-pro-or-max-plan)
e [Como usar o Claude Code com seu plano Team ou Enterprise](https://support.anthropic.com/en/articles/11845131-using-claude-code-with-your-team-or-enterprise-plan/).

Se você quiser outras opções no estilo de assinatura no OpenClaw, consulte [OpenAI
Codex](/pt-BR/providers/openai), [Plano de programação Qwen Cloud
](/pt-BR/providers/qwen), [Plano de programação MiniMax](/pt-BR/providers/minimax)
e [Plano de programação Z.AI/GLM](/pt-BR/providers/zai).
</Warning>

## Troca OAuth (como funciona o login)

Os fluxos de login interativo do OpenClaw são implementados em `openclaw/plugin-sdk/llm.ts` e conectados aos assistentes/comandos.

### Token de configuração do Anthropic

Formato do fluxo:

1. inicie o token de configuração ou a colagem de token do Anthropic pelo OpenClaw
2. o OpenClaw armazena a credencial resultante do Anthropic em um perfil de autenticação
3. a seleção do modelo permanece em `anthropic/...`
4. os perfis de autenticação existentes do Anthropic continuam disponíveis para reversão/controle de ordem

### OpenAI Codex (OAuth do ChatGPT)

O OAuth do OpenAI Codex é explicitamente compatível com o uso fora da Codex CLI, incluindo fluxos de trabalho do OpenClaw.

O comando de login usa o ID de provedor canônico da OpenAI:

```bash
openclaw models auth login --provider openai
```

Use `--profile-id openai:<name>` para várias contas OAuth do ChatGPT/Codex em
um único agente. Não use `openai-codex:<name>` em novos perfis. O Doctor migra
esse prefixo antigo para um ID de perfil `openai:*` sem colisões; execute
`openclaw models auth list --provider openai` após o reparo antes de copiar
IDs de perfil para `auth.order` ou `/model ...@<profileId>`.

Formato do fluxo (PKCE):

1. gere um verificador/desafio PKCE e um `state` aleatório
2. abra `https://auth.openai.com/oauth/authorize?...` (escopo
   `openid profile email offline_access`)
3. tente capturar o retorno de chamada em `http://localhost:1455/auth/callback` (o
   host do retorno de chamada usa `localhost` por padrão e aceita apenas hosts de loopback;
   substitua-o com `OPENCLAW_OAUTH_CALLBACK_HOST`)
4. se você conseguir colar um código antes da chegada do retorno de chamada (ou estiver em um ambiente
   remoto/sem interface gráfica e não for possível vincular o retorno de chamada), cole a URL/o código de redirecionamento
   em vez disso — a colagem manual disputa com o retorno de chamada do navegador, e vence o que for
   concluído primeiro
5. troque o código em `https://auth.openai.com/oauth/token`
6. extraia `accountId` do token de acesso e armazene `{ access, refresh, expires, accountId }`

O caminho do assistente é `openclaw onboard` → opção de autenticação `openai`.

## Atualização + expiração

Os perfis armazenam um carimbo de data e hora `expires`. No runtime:

- se `expires` estiver no futuro, use o token de acesso armazenado
- se estiver expirado, atualize-o (sob um bloqueio de arquivo) e sobrescreva as credenciais armazenadas
- se um agente secundário ler um perfil OAuth herdado do agente principal, a
  atualização será gravada no armazenamento do agente principal, em vez de copiar o token de
  atualização para o armazenamento do agente secundário
- as credenciais de CLI gerenciadas externamente (CLI do Claude, inicialização restrita da Codex CLI;
  consulte [O coletor de tokens](#the-token-sink-why-it-exists)) são relidas em vez de
  consumir um token de atualização copiado. Se uma atualização gerenciada falhar, o OpenClaw
  informa o perfil afetado para reautenticação, em vez de retornar
  dados de token de uma CLI externa.

O fluxo de atualização é automático; geralmente, não é necessário gerenciar tokens manualmente.

## Várias contas (perfis) + roteamento

Dois padrões:

### 1) Preferencial: agentes separados

Se você quiser que as contas "pessoal" e "trabalho" nunca interajam, use agentes isolados (sessões + credenciais + espaço de trabalho separados):

```bash
openclaw agents add work
openclaw agents add personal
```

Em seguida, configure a autenticação por agente (assistente) e encaminhe os chats ao agente correto.

### 2) Avançado: vários perfis em um agente

O armazenamento de perfis de autenticação oferece suporte a vários IDs de perfil para o mesmo provedor.
Escolha qual será usado:

- globalmente pela ordenação da configuração (`auth.order`)
- por sessão com `/model ...@<profileId>`

Exemplo (substituição da sessão):

- `/model Opus@anthropic:work`

Liste os IDs de perfil existentes com:

```bash
openclaw models auth list --provider <id>
```

Documentação relacionada:

- [Failover de modelos](/pt-BR/concepts/model-failover) (regras de rotação + período de espera)
- [Comandos de barra](/pt-BR/tools/slash-commands) (superfície de comandos)

## Relacionados

- [Autenticação](/pt-BR/gateway/authentication) - visão geral da autenticação de provedores de modelos
- [Segredos](/pt-BR/gateway/secrets) - armazenamento de credenciais e SecretRef
- [Referência de configuração](/pt-BR/gateway/configuration-reference#auth-storage) - chaves da configuração de autenticação
