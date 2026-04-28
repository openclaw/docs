---
read_when:
    - Configurando a integração de chat da Twitch para o OpenClaw
sidebarTitle: Twitch
summary: Configuração e instalação do bot de chat da Twitch
title: Twitch
x-i18n:
    generated_at: "2026-04-26T11:24:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d5f4bbad04e04cccc82fc1e2b1057acae3bf7b7684a8e7a4b1f54101731974a
    source_path: channels/twitch.md
    workflow: 15
---

Suporte a chat da Twitch via conexão IRC. O OpenClaw se conecta como um usuário da Twitch (conta de bot) para receber e enviar mensagens em canais.

## Plugin incluído

<Note>
A Twitch é distribuída como um Plugin incluído nas versões atuais do OpenClaw, então compilações empacotadas normais não precisam de uma instalação separada.
</Note>

Se você estiver em uma compilação mais antiga ou em uma instalação personalizada que exclui a Twitch, instale manualmente:

<Tabs>
  <Tab title="registro npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="checkout local">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida (iniciante)

<Steps>
  <Step title="Verifique se o Plugin está disponível">
    As versões empacotadas atuais do OpenClaw já o incluem. Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
  </Step>
  <Step title="Crie uma conta de bot na Twitch">
    Crie uma conta dedicada da Twitch para o bot (ou use uma conta existente).
  </Step>
  <Step title="Gere credenciais">
    Use [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Selecione **Bot Token**
    - Verifique se os escopos `chat:read` e `chat:write` estão selecionados
    - Copie o **Client ID** e o **Access Token**

  </Step>
  <Step title="Encontre seu ID de usuário da Twitch">
    Use [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) para converter um nome de usuário em um ID de usuário da Twitch.
  </Step>
  <Step title="Configure o token">
    - Env: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (apenas conta padrão)
    - Ou config: `channels.twitch.accessToken`

    Se ambos estiverem definidos, a config terá precedência (o fallback via env é apenas para a conta padrão).

  </Step>
  <Step title="Inicie o Gateway">
    Inicie o Gateway com o canal configurado.
  </Step>
</Steps>

<Warning>
Adicione controle de acesso (`allowFrom` ou `allowedRoles`) para impedir que usuários não autorizados acionem o bot. `requireMention` tem como padrão `true`.
</Warning>

Configuração mínima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Conta Twitch do bot
      accessToken: "oauth:abc123...", // OAuth Access Token (ou use a env var OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // Client ID do Token Generator
      channel: "vevisk", // Em qual chat de canal da Twitch entrar (obrigatório)
      allowFrom: ["123456789"], // (recomendado) Apenas o seu ID de usuário da Twitch - obtenha em https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/
    },
  },
}
```

## O que é

- Um canal da Twitch pertencente ao Gateway.
- Roteamento determinístico: as respostas sempre voltam para a Twitch.
- Cada conta é mapeada para uma chave de sessão isolada `agent:<agentId>:twitch:<accountName>`.
- `username` é a conta do bot (quem autentica), `channel` é a sala de chat na qual entrar.

## Configuração (detalhada)

### Gerar credenciais

Use [Twitch Token Generator](https://twitchtokengenerator.com/):

- Selecione **Bot Token**
- Verifique se os escopos `chat:read` e `chat:write` estão selecionados
- Copie o **Client ID** e o **Access Token**

<Note>
Nenhum registro manual de app é necessário. Os tokens expiram após várias horas.
</Note>

### Configurar o bot

<Tabs>
  <Tab title="Env var (apenas conta padrão)">
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

Se env e config estiverem definidas, a config terá precedência.

### Controle de acesso (recomendado)

```json5
{
  channels: {
    twitch: {
      allowFrom: ["123456789"], // (recomendado) Apenas o seu ID de usuário da Twitch
    },
  },
}
```

Prefira `allowFrom` para uma lista de permissões rígida. Use `allowedRoles` se quiser controle de acesso baseado em função.

**Funções disponíveis:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Note>
**Por que IDs de usuário?** Nomes de usuário podem mudar, permitindo impersonação. IDs de usuário são permanentes.

Encontre seu ID de usuário da Twitch: [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) (Converta seu nome de usuário da Twitch em ID)
</Note>

## Atualização de token (opcional)

Tokens do [Twitch Token Generator](https://twitchtokengenerator.com/) não podem ser atualizados automaticamente — gere novamente quando expirarem.

Para atualização automática de token, crie seu próprio aplicativo da Twitch em [Twitch Developer Console](https://dev.twitch.tv/console) e adicione à config:

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

O bot atualiza automaticamente os tokens antes da expiração e registra eventos de atualização nos logs.

## Suporte a múltiplas contas

Use `channels.twitch.accounts` com tokens por conta. Veja [Configuration](/pt-BR/gateway/configuration) para o padrão compartilhado.

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
Cada conta precisa do seu próprio token (um token por canal).
</Note>

## Controle de acesso

<Tabs>
  <Tab title="Lista de permissões por ID de usuário (mais seguro)">
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
  <Tab title="Baseado em função">
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

    `allowFrom` é uma lista de permissões rígida. Quando definido, apenas esses IDs de usuário são permitidos. Se você quiser acesso baseado em função, deixe `allowFrom` sem definir e configure `allowedRoles`.

  </Tab>
  <Tab title="Desativar exigência de @mention">
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
  <Accordion title="O bot não responde às mensagens">
    - **Verifique o controle de acesso:** Confirme que seu ID de usuário está em `allowFrom`, ou remova `allowFrom` temporariamente e defina `allowedRoles: ["all"]` para testar.
    - **Verifique se o bot está no canal:** O bot precisa entrar no canal especificado em `channel`.

  </Accordion>
  <Accordion title="Problemas com token">
    Erros de "Falha ao conectar" ou autenticação:

    - Verifique se `accessToken` é o valor do token de acesso OAuth (normalmente começa com o prefixo `oauth:`)
    - Verifique se o token tem os escopos `chat:read` e `chat:write`
    - Se estiver usando atualização de token, confirme que `clientSecret` e `refreshToken` estão definidos

  </Accordion>
  <Accordion title="A atualização de token não funciona">
    Verifique os logs em busca de eventos de atualização:

    ```
    Using env token source for mybot
    Access token refreshed for user 123456 (expires in 14400s)
    ```

    Se você vir "token refresh disabled (no refresh token)":

    - Verifique se `clientSecret` foi fornecido
    - Verifique se `refreshToken` foi fornecido

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
  Canal ao qual entrar.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Ativa esta conta.
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
  Lista de permissões por ID de usuário.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Controle de acesso baseado em função.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Exigir @mention.
</ParamField>

### Opções do provedor

- `channels.twitch.enabled` - Ativa/desativa a inicialização do canal
- `channels.twitch.username` - Nome de usuário do bot (configuração simplificada de conta única)
- `channels.twitch.accessToken` - Token de acesso OAuth (configuração simplificada de conta única)
- `channels.twitch.clientId` - Twitch Client ID (configuração simplificada de conta única)
- `channels.twitch.channel` - Canal ao qual entrar (configuração simplificada de conta única)
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

## Ações da ferramenta

O agente pode chamar `twitch` com a ação:

- `send` - Envia uma mensagem para um canal

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
- **Use atualização automática de token** para bots de longa duração.
- **Use listas de permissões por ID de usuário** em vez de nomes de usuário para controle de acesso.
- **Monitore os logs** para eventos de atualização de token e status da conexão.
- **Defina escopos mínimos para os tokens** — Solicite apenas `chat:read` e `chat:write`.
- **Se travar**: Reinicie o Gateway após confirmar que nenhum outro processo é proprietário da sessão.

## Limites

- **500 caracteres** por mensagem (fragmentação automática nos limites de palavras).
- O Markdown é removido antes da fragmentação.
- Sem limitação de taxa (usa os limites de taxa internos da Twitch).

## Relacionado

- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Visão geral dos canais](/pt-BR/channels) — todos os canais suportados
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Security](/pt-BR/gateway/security) — modelo de acesso e endurecimento
