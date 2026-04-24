---
read_when:
    - Configurar a integração do chat da Twitch para o OpenClaw
summary: Configuração e configuração inicial do bot de chat da Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-24T05:43:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82b9176deec21344a7cd22f8818277f94bc564d06c4422b149d0fc163ee92d5f
    source_path: channels/twitch.md
    workflow: 15
---

Suporte ao chat da Twitch via conexão IRC. O OpenClaw se conecta como um usuário da Twitch (conta do bot) para receber e enviar mensagens em canais.

## Plugin empacotado

A Twitch é distribuída como um Plugin empacotado nas versões atuais do OpenClaw, então builds empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma build mais antiga ou em uma instalação personalizada que exclui a Twitch, instale-a manualmente:

Instalar via CLI (registro npm):

```bash
openclaw plugins install @openclaw/twitch
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/twitch-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida (iniciante)

1. Verifique se o Plugin da Twitch está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Crie uma conta dedicada da Twitch para o bot (ou use uma conta existente).
3. Gere as credenciais: [Twitch Token Generator](https://twitchtokengenerator.com/)
   - Selecione **Bot Token**
   - Verifique se os escopos `chat:read` e `chat:write` estão selecionados
   - Copie o **Client ID** e o **Access Token**
4. Encontre seu ID de usuário da Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
5. Configure o token:
   - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (somente conta padrão)
   - Ou config: `channels.twitch.accessToken`
   - Se ambos estiverem definidos, a configuração terá precedência (o fallback para env é somente para a conta padrão).
6. Inicie o gateway.

**⚠️ Importante:** Adicione controle de acesso (`allowFrom` ou `allowedRoles`) para impedir que usuários não autorizados acionem o bot. `requireMention` usa `true` por padrão.

Configuração mínima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Conta da Twitch do bot
      accessToken: "oauth:abc123...", // OAuth Access Token (ou use a env var OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID do Token Generator
      channel: "vevisk", // Em qual chat de canal da Twitch entrar (obrigatório)
      allowFrom: ["123456789"], // (recomendado) Apenas seu ID de usuário da Twitch - obtenha-o em https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## O que é

- Um canal da Twitch pertencente ao Gateway.
- Roteamento determinístico: as respostas sempre voltam para a Twitch.
- Cada conta mapeia para uma chave de sessão isolada `agent:<agentId>:twitch:<accountName>`.
- `username` é a conta do bot (quem autentica), `channel` é em qual sala de chat entrar.

## Configuração (detalhada)

### Gerar credenciais

Use [Twitch Token Generator](https://twitchtokengenerator.com/):

- Selecione **Bot Token**
- Verifique se os escopos `chat:read` e `chat:write` estão selecionados
- Copie o **Client ID** e o **Access Token**

Nenhum registro manual de app é necessário. Os tokens expiram após várias horas.

### Configurar o bot

**Variável de ambiente (somente conta padrão):**

```bash
OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
```

**Ou configuração:**

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
    },
  },
}
```

Se env e configuração estiverem definidos, a configuração terá precedência.

### Controle de acesso (recomendado)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recomendado) Apenas seu ID de usuário da Twitch
    },
  },
}
```

Prefira `allowFrom` para uma allowlist rígida. Use `allowedRoles` se quiser acesso baseado em papéis.

**Papéis disponíveis:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

**Por que IDs de usuário?** Nomes de usuário podem mudar, permitindo impersonação. IDs de usuário são permanentes.

Encontre seu ID de usuário da Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Converta seu nome de usuário da Twitch em ID)

## Renovação de token (opcional)

Tokens do [Twitch Token Generator](https://twitchtokengenerator.com/) não podem ser renovados automaticamente — gere novamente quando expirarem.

Para renovação automática de token, crie sua própria aplicação Twitch em [Twitch Developer Console](https://dev.twitch.tv/console) e adicione à configuração:

```json5
{
  channels: {
    twitch: {
      clientSecret: "your_client_secret",
      refreshToken: "your_refresh_token",
    },
  },
}
```

O bot renova automaticamente os tokens antes do vencimento e registra eventos de renovação.

## Suporte a múltiplas contas

Use `channels.twitch.accounts` com tokens por conta. Consulte [`gateway/configuration`](/pt-BR/gateway/configuration) para o padrão compartilhado.

Exemplo (uma conta de bot em dois canais):

```json5
{
  channels: {
    twitch: {
      accounts: {
        channel1: {
          username: "openclaw",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "vevisk",
        },
        channel2: {
          username: "openclaw",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "secondchannel",
        },
      },
    },
  },
}
```

**Observação:** Cada conta precisa do seu próprio token (um token por canal).

## Controle de acesso

### Restrições baseadas em papéis

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator", "vip"],
        },
      },
    },
  },
}
```

### Allowlist por ID de usuário (mais segura)

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowFrom: ["123456789", "987654321"],
        },
      },
    },
  },
}
```

### Acesso baseado em papéis (alternativa)

`allowFrom` é uma allowlist rígida. Quando definido, somente esses IDs de usuário são permitidos.
Se você quiser acesso baseado em papéis, deixe `allowFrom` sem definir e configure `allowedRoles` no lugar:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

### Desativar a exigência de @menção

Por padrão, `requireMention` é `true`. Para desativar e responder a todas as mensagens:

```json5
{
  channels: {
    twitch: {
      accounts: {
        default: {
          requireMention: false,
        },
      },
    },
  },
}
```

## Solução de problemas

Primeiro, execute os comandos de diagnóstico:

```bash
openclaw doctor
openclaw channels status --probe
```

### O bot não responde às mensagens

**Verifique o controle de acesso:** Verifique se seu ID de usuário está em `allowFrom`, ou remova temporariamente
`allowFrom` e defina `allowedRoles: ["all"]` para testar.

**Verifique se o bot está no canal:** O bot deve entrar no canal especificado em `channel`.

### Problemas com token

**"Failed to connect" ou erros de autenticação:**

- Verifique se `accessToken` é o valor do OAuth access token (normalmente começa com o prefixo `oauth:`)
- Verifique se o token tem os escopos `chat:read` e `chat:write`
- Se estiver usando renovação de token, verifique se `clientSecret` e `refreshToken` estão definidos

### A renovação de token não funciona

**Verifique os logs em busca de eventos de renovação:**

```
Using env token source for mybot
Access token refreshed for user 123456 (expires in 14400s)
```

Se você vir "token refresh disabled (no refresh token)":

- Verifique se `clientSecret` foi fornecido
- Verifique se `refreshToken` foi fornecido

## Configuração

**Configuração da conta:**

- `username` - nome de usuário do bot
- `accessToken` - OAuth access token com `chat:read` e `chat:write`
- `clientId` - Twitch Client ID (do Token Generator ou do seu app)
- `channel` - canal ao qual entrar (obrigatório)
- `enabled` - ativa esta conta (padrão: `true`)
- `clientSecret` - opcional: para renovação automática de token
- `refreshToken` - opcional: para renovação automática de token
- `expiresIn` - expiração do token em segundos
- `obtainmentTimestamp` - timestamp de obtenção do token
- `allowFrom` - allowlist de ID de usuário
- `allowedRoles` - controle de acesso baseado em papéis (`"moderator" | "owner" | "vip" | "subscriber" | "all"`)
- `requireMention` - exige @menção (padrão: `true`)

**Opções do provedor:**

- `channels.twitch.enabled` - ativa/desativa a inicialização do canal
- `channels.twitch.username` - nome de usuário do bot (configuração simplificada de conta única)
- `channels.twitch.accessToken` - OAuth access token (configuração simplificada de conta única)
- `channels.twitch.clientId` - Twitch Client ID (configuração simplificada de conta única)
- `channels.twitch.channel` - canal ao qual entrar (configuração simplificada de conta única)
- `channels.twitch.accounts.<accountName>` - configuração de múltiplas contas (todos os campos de conta acima)

Exemplo completo:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "vevisk",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      allowedRoles: ["moderator", "vip"],
      accounts: {
        default: {
          username: "mybot",
          accessToken: "oauth:abc123...",
          clientId: "xyz789...",
          channel: "your_channel",
          enabled: true,
          clientSecret: "secret123...",
          refreshToken: "refresh456...",
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowFrom: ["123456789", "987654321"],
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Ações de ferramenta

O agente pode chamar `twitch` com a ação:

- `send` - Enviar uma mensagem para um canal

Exemplo:

```json5
{
  action: "twitch",
  params: {
    message: "Hello Twitch!",
    to: "#mychannel",
  },
}
```

## Segurança e operações

- **Trate tokens como senhas** - Nunca faça commit de tokens no git
- **Use renovação automática de token** para bots de longa duração
- **Use allowlists de ID de usuário** em vez de nomes de usuário para controle de acesso
- **Monitore os logs** para eventos de renovação de token e status de conexão
- **Solicite o mínimo de escopos possível** - Solicite apenas `chat:read` e `chat:write`
- **Se travar**: reinicie o gateway depois de confirmar que nenhum outro processo é dono da sessão

## Limites

- **500 caracteres** por mensagem (divididos automaticamente em limites de palavras)
- Markdown é removido antes da divisão
- Sem limitação de taxa (usa os limites de taxa nativos da Twitch)

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
