---
read_when:
    - Configurando a integração do chat da Twitch para o OpenClaw
sidebarTitle: Twitch
summary: Configuração e instalação do bot de chat da Twitch
title: Twitch
x-i18n:
    generated_at: "2026-05-02T22:16:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: c0d5f16d1369e2783bec6e0c7b2d7bee8aae86f2a424b77b9adf14850de0f20b
    source_path: channels/twitch.md
    workflow: 16
---

Suporte a chat da Twitch via conexão IRC. O OpenClaw se conecta como um usuário da Twitch (conta de bot) para receber e enviar mensagens em canais.

## Plugin incluído

<Note>
A Twitch é distribuída como um plugin incluído nas versões atuais do OpenClaw, portanto builds empacotados normais não precisam de uma instalação separada.
</Note>

Se você estiver em um build mais antigo ou em uma instalação personalizada que exclui a Twitch, instale o pacote npm diretamente:

<Tabs>
  <Tab title="npm registry">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Local checkout">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Use o pacote sem versão para seguir a tag oficial atual de lançamento. Fixe uma versão exata
somente quando precisar de uma instalação reproduzível.

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida (iniciante)

<Steps>
  <Step title="Ensure plugin is available">
    As versões empacotadas atuais do OpenClaw já o incluem. Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
  </Step>
  <Step title="Create a Twitch bot account">
    Crie uma conta dedicada da Twitch para o bot (ou use uma conta existente).
  </Step>
  <Step title="Generate credentials">
    Use o [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Selecione **Bot Token**
    - Verifique se os escopos `chat:read` e `chat:write` estão selecionados
    - Copie o **Client ID** e o **Access Token**

  </Step>
  <Step title="Find your Twitch user ID">
    Use [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) para converter um nome de usuário em um ID de usuário da Twitch.
  </Step>
  <Step title="Configure the token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (somente conta padrão)
    - Ou config: `channels.twitch.accessToken`

    Se ambos forem definidos, a configuração tem precedência (o fallback por env é somente para a conta padrão).

  </Step>
  <Step title="Start the gateway">
    Inicie o Gateway com o canal configurado.
  </Step>
</Steps>

<Warning>
Adicione controle de acesso (`allowFrom` ou `allowedRoles`) para impedir que usuários não autorizados acionem o bot. O padrão de `requireMention` é `true`.
</Warning>

Configuração mínima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Bot's Twitch account
      accessToken: "oauth:abc123...", // OAuth Access Token (or use OPENCLAW_TWITCH_ACCESS_TOKEN env var)
      clientId: "xyz789...", // Client ID from Token Generator
      channel: "vevisk", // Which Twitch channel's chat to join (required)
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only - get it from https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## O que é

- Um canal da Twitch pertencente ao Gateway.
- Roteamento determinístico: as respostas sempre voltam para a Twitch.
- Cada conta é mapeada para uma chave de sessão isolada `agent:<agentId>:twitch:<accountName>`.
- `username` é a conta do bot (quem autentica), `channel` é a sala de chat a entrar.

## Configuração (detalhada)

### Gerar credenciais

Use o [Twitch Token Generator](https://twitchtokengenerator.com/):

- Selecione **Bot Token**
- Verifique se os escopos `chat:read` e `chat:write` estão selecionados
- Copie o **Client ID** e o **Access Token**

<Note>
Não é necessário registrar um app manualmente. Tokens expiram depois de várias horas.
</Note>

### Configurar o bot

<Tabs>
  <Tab title="Env var (default account only)">
    ```bash
    OPENCLAW_TWITCH_ACCESS_TOKEN=oauth:abc123...
    ```
  </Tab>
  <Tab title="Config">
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
  </Tab>
</Tabs>

Se env e configuração forem definidos, a configuração tem precedência.

### Controle de acesso (recomendado)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recommended) Your Twitch user ID only
    },
  },
}
```

Prefira `allowFrom` para uma allowlist estrita. Use `allowedRoles` em vez disso se quiser acesso baseado em função.

**Funções disponíveis:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Por que IDs de usuário?** Nomes de usuário podem mudar, permitindo personificação. IDs de usuário são permanentes.

Encontre seu ID de usuário da Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (converta seu nome de usuário da Twitch em ID)
</Note>

## Atualização de token (opcional)

Tokens do [Twitch Token Generator](https://twitchtokengenerator.com/) não podem ser atualizados automaticamente - gere novamente quando expirarem.

Para atualização automática de token, crie sua própria aplicação da Twitch no [Twitch Developer Console](https://dev.twitch.tv/console) e adicione à configuração:

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

O bot atualiza tokens automaticamente antes da expiração e registra eventos de atualização nos logs.

## Suporte a múltiplas contas

Use `channels.twitch.accounts` com tokens por conta. Consulte [Configuração](/pt-BR/gateway/configuration) para o padrão compartilhado.

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

<Note>
Cada conta precisa de seu próprio token (um token por canal).
</Note>

## Controle de acesso

<Tabs>
  <Tab title="User ID allowlist (most secure)">
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
  </Tab>
  <Tab title="Role-based">
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

    `allowFrom` é uma allowlist estrita. Quando definida, somente esses IDs de usuário são permitidos. Se quiser acesso baseado em função, deixe `allowFrom` sem definir e configure `allowedRoles`.

  </Tab>
  <Tab title="Disable @mention requirement">
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

  </Tab>
</Tabs>

## Solução de problemas

Primeiro, execute os comandos de diagnóstico:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="Bot does not respond to messages">
    - **Verifique o controle de acesso:** Garanta que seu ID de usuário esteja em `allowFrom`, ou remova temporariamente `allowFrom` e defina `allowedRoles: ["all"]` para testar.
    - **Verifique se o bot está no canal:** O bot precisa entrar no canal especificado em `channel`.

  </Accordion>
  <Accordion title="Token issues">
    "Falha ao conectar" ou erros de autenticação:

    - Verifique se `accessToken` é o valor do token de acesso OAuth (normalmente começa com o prefixo `oauth:`)
    - Verifique se o token tem os escopos `chat:read` e `chat:write`
    - Se estiver usando atualização de token, verifique se `clientSecret` e `refreshToken` estão definidos

  </Accordion>
  <Accordion title="Token refresh not working">
    Verifique os logs em busca de eventos de atualização:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Se você vir "token refresh disabled (no refresh token)":

    - Garanta que `clientSecret` seja fornecido
    - Garanta que `refreshToken` seja fornecido

  </Accordion>
</AccordionGroup>

## Configuração

### Configuração da conta

<ParamField path="username" type="string">
  Nome de usuário do bot.
</ParamField>
<ParamField path="accessToken" type="string">
  Token de acesso OAuth com `chat:read` e `chat:write`.
</ParamField>
<ParamField path="clientId" type="string">
  Twitch Client ID (do Token Generator ou do seu app).
</ParamField>
<ParamField path="channel" type="string" required>
  Canal a entrar.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Ative esta conta.
</ParamField>
<ParamField path="clientSecret" type="string">
  Opcional: para atualização automática de token.
</ParamField>
<ParamField path="refreshToken" type="string">
  Opcional: para atualização automática de token.
</ParamField>
<ParamField path="expiresIn" type="number">
  Expiração do token em segundos.
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Carimbo de data/hora de obtenção do token.
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Allowlist de IDs de usuário.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Controle de acesso baseado em função.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Exigir @mention.
</ParamField>

### Opções do provedor

- `channels.twitch.enabled` - Ativar/desativar inicialização do canal
- `channels.twitch.username` - Nome de usuário do bot (configuração simplificada de conta única)
- `channels.twitch.accessToken` - Token de acesso OAuth (configuração simplificada de conta única)
- `channels.twitch.clientId` - Twitch Client ID (configuração simplificada de conta única)
- `channels.twitch.channel` - Canal a entrar (configuração simplificada de conta única)
- `channels.twitch.accounts.<accountName>` - Configuração de múltiplas contas (todos os campos de conta acima)

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

- **Trate tokens como senhas** — Nunca faça commit de tokens no git.
- **Use atualização automática de token** para bots de longa execução.
- **Use allowlists de IDs de usuário** em vez de nomes de usuário para controle de acesso.
- **Monitore logs** para eventos de atualização de token e status de conexão.
- **Restrinja os escopos dos tokens ao mínimo** — Solicite apenas `chat:read` e `chat:write`.
- **Se estiver bloqueado**: reinicie o Gateway depois de confirmar que nenhum outro processo é dono da sessão.

## Limites

- **500 caracteres** por mensagem (divisão automática em blocos nos limites de palavras).
- Markdown é removido antes da divisão em blocos.
- Sem limitação de taxa (usa os limites de taxa integrados da Twitch).

## Relacionados

- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
