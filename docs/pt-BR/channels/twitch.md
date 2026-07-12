---
read_when:
    - Configurando a integração do chat da Twitch com o OpenClaw
sidebarTitle: Twitch
summary: 'Bot de chat da Twitch: instalação, credenciais, controle de acesso, renovação de token'
title: Twitch
x-i18n:
    generated_at: "2026-07-12T15:01:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 70890c0c6a648a06ad47c35016571a57c3e518296ef95311e75e32c81e60e2db
    source_path: channels/twitch.md
    workflow: 16
---

Suporte ao chat da Twitch pela interface de chat (IRC) da Twitch usando o cliente Twurple. O OpenClaw inicia sessão como uma conta de bot da Twitch, entra em um canal por conta configurada e responde nesse canal.

## Instalação

A Twitch é fornecida como um plugin oficial; ela não faz parte da instalação principal.

<Tabs>
  <Tab title="Registro npm">
    ```bash
    openclaw plugins install @openclaw/twitch
    ```
  </Tab>
  <Tab title="Checkout local">
    ```bash
    openclaw plugins install ./path/to/local/twitch-plugin
    ```
  </Tab>
</Tabs>

`plugins install` registra e habilita o plugin. Selecionar Twitch durante `openclaw onboard` ou `openclaw channels add` instala o plugin sob demanda. Use apenas o nome do pacote para acompanhar a versão atual; fixe uma versão exata somente para instalações reproduzíveis. Requer OpenClaw 2026.4.10 ou mais recente.

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração rápida

<Steps>
  <Step title="Instale o plugin">
    Consulte [Instalação](#install) acima.
  </Step>
  <Step title="Crie uma conta de bot da Twitch">
    Crie uma conta dedicada da Twitch para o bot (ou use uma conta existente).
  </Step>
  <Step title="Gere as credenciais">
    Use o [Twitch Token Generator](https://twitchtokengenerator.com/):

    - Selecione **Bot Token**
    - Verifique se os escopos `chat:read` e `chat:write` estão selecionados
    - Copie **Client ID** e **Access Token**

  </Step>
  <Step title="Encontre seu ID de usuário da Twitch">
    Use [https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/) para converter um nome de usuário em um ID de usuário da Twitch.
  </Step>
  <Step title="Configure o token">
    - Variável de ambiente: `OPENCLAW_TWITCH_ACCESS_TOKEN=...` (somente para a conta padrão)
    - Ou configuração: `channels.twitch.accessToken`

    Se ambos forem definidos, a configuração terá precedência (a variável de ambiente serve apenas como alternativa para a conta padrão).

  </Step>
  <Step title="Inicie o gateway">
    ```bash
    openclaw gateway run
    ```
  </Step>
</Steps>

<Warning>
Adicione controle de acesso (`allowFrom` ou `allowedRoles`) para impedir que usuários não autorizados acionem o bot. O valor padrão de `requireMention` é `true`.
</Warning>

Configuração mínima:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw", // Conta do bot na Twitch (faz a autenticação)
      accessToken: "oauth:abc123...", // Token de acesso OAuth (ou use a variável de ambiente OPENCLAW_TWITCH_ACCESS_TOKEN)
      clientId: "xyz789...", // ID do cliente obtido no Token Generator
      channel: "yourchannel", // Chat de qual canal da Twitch acessar (obrigatório)
      allowFrom: ["123456789"], // (recomendado) Somente seu ID de usuário da Twitch
    },
  },
}
```

## O que é

- Um canal da Twitch controlado pelo Gateway.
- Roteamento determinístico: as respostas sempre retornam ao canal da Twitch de onde veio a mensagem.
- Cada canal acessado é mapeado para uma chave de sessão de grupo isolada `agent:<agentId>:twitch:group:<channel>`.
- `username` é a conta do bot (que faz a autenticação), enquanto `channel` é a sala de chat que será acessada. Cada entrada de conta acessa exatamente um canal.
- Os tokens funcionam com ou sem o prefixo `oauth:`; o OpenClaw normaliza ambas as formas (o assistente de configuração espera a forma com `oauth:`).

## Renovação do token (opcional)

Os tokens do [Twitch Token Generator](https://twitchtokengenerator.com/) não podem ser renovados pelo OpenClaw — gere-os novamente quando expirarem (eles duram algumas horas; não é necessário registrar um aplicativo).

Para renovação automática, crie seu próprio aplicativo no [Twitch Developer Console](https://dev.twitch.tv/console) e adicione:

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

Quando ambos estão definidos, o plugin usa um provedor de autenticação com renovação, que renova os tokens antes da expiração e registra cada renovação. Sem `refreshToken`, ele registra `token refresh disabled (no refresh token)`; sem `clientSecret`, ele recorre a um token estático (sem renovação).

## Suporte a várias contas

Use `channels.twitch.accounts` com credenciais por conta. Consulte [Configuração](/pt-BR/gateway/configuration) para conhecer o padrão compartilhado.

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
          channel: "yourchannel",
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
Cada entrada de conta precisa de seu próprio `accessToken` (a variável de ambiente cobre apenas a conta padrão). Uma conta acessa exatamente um canal; portanto, acessar dois canais exige duas contas. `channels.twitch.defaultAccount` seleciona qual conta é a padrão.
</Note>

## Controle de acesso

`allowFrom` é uma lista de permissões estrita de IDs de usuário da Twitch. Quando ela é definida, `allowedRoles` é ignorado; deixe `allowFrom` indefinido para usar acesso baseado em funções.

**Funções disponíveis:** `"moderator"`, `"owner"`, `"vip"`, `"subscriber"`, `"all"`.

<Tabs>
  <Tab title="Lista de permissões por ID de usuário (mais segura)">
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
  <Tab title="Baseado em funções">
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
  </Tab>
  <Tab title="Desabilitar a exigência de @menção">
    Por padrão, `requireMention` é `true`. Para responder a todas as mensagens permitidas:

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

<Note>
**Por que usar IDs de usuário?** Os nomes de usuário podem mudar, permitindo falsificação de identidade. Os IDs de usuário são permanentes.

Encontre o seu com o [conversor de nome de usuário em ID](https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/).
</Note>

## Solução de problemas

Primeiro, execute os comandos de diagnóstico:

```bash
openclaw doctor
openclaw channels status --probe
```

<AccordionGroup>
  <Accordion title="O bot não responde às mensagens">
    - **Verifique o controle de acesso:** confirme que seu ID de usuário está em `allowFrom` ou remova temporariamente `allowFrom` e defina `allowedRoles: ["all"]` para testar.
    - **Verifique a exigência de menção:** com `requireMention: true` (padrão), as mensagens precisam mencionar o nome de usuário do bot com @.
    - **Verifique se o bot está no canal:** o bot acessa somente o canal indicado em `channel`.

  </Accordion>
  <Accordion title="Problemas com o token">
    Erros de "Failed to connect" ou de autenticação:

    - Verifique se `accessToken` é o valor do token de acesso OAuth (o prefixo `oauth:` é opcional)
    - Verifique se o token tem os escopos `chat:read` e `chat:write`
    - Se estiver usando renovação de token, verifique se `clientSecret` e `refreshToken` estão definidos

  </Accordion>
  <Accordion title="A renovação do token não funciona">
    Verifique os eventos de renovação nos logs:

    ```text
    Usando a origem de token da variável de ambiente para mybot
    Token de acesso renovado para o usuário 123456 (expira em 14400s)
    ```

    Se você encontrar `token refresh disabled (no refresh token)`:

    - Confirme que `clientSecret` foi fornecido
    - Confirme que `refreshToken` foi fornecido

  </Accordion>
</AccordionGroup>

## Configuração

### Configuração da conta

<ParamField path="username" type="string" required>
  Nome de usuário do bot (a conta que faz a autenticação).
</ParamField>
<ParamField path="accessToken" type="string" required>
  Token de acesso OAuth com `chat:read` e `chat:write` (configuração ou variável de ambiente para a conta padrão).
</ParamField>
<ParamField path="clientId" type="string" required>
  ID do cliente da Twitch (do Token Generator ou do seu aplicativo). Opcional no esquema, mas obrigatório para se conectar.
</ParamField>
<ParamField path="channel" type="string" required>
  Canal a ser acessado.
</ParamField>
<ParamField path="enabled" type="boolean" default="true">
  Habilita esta conta.
</ParamField>
<ParamField path="clientSecret" type="string">
  Opcional: usado para renovação automática do token.
</ParamField>
<ParamField path="refreshToken" type="string">
  Opcional: usado para renovação automática do token.
</ParamField>
<ParamField path="expiresIn" type="number">
  Expiração do token em segundos (acompanhamento da renovação).
</ParamField>
<ParamField path="obtainmentTimestamp" type="number">
  Carimbo de data e hora em que o token foi obtido (acompanhamento da renovação).
</ParamField>
<ParamField path="allowFrom" type="string[]">
  Lista de permissões de IDs de usuário. Quando definida, as funções são ignoradas.
</ParamField>
<ParamField path="allowedRoles" type='Array<"moderator" | "owner" | "vip" | "subscriber" | "all">'>
  Controle de acesso baseado em funções.
</ParamField>
<ParamField path="requireMention" type="boolean" default="true">
  Exige uma @menção para acionar o bot.
</ParamField>
<ParamField path="responsePrefix" type="string">
  Substituição do prefixo das respostas enviadas por esta conta.
</ParamField>

### Opções do provedor

- `channels.twitch.enabled` - Habilita/desabilita a inicialização do canal
- `channels.twitch.username` / `accessToken` / `clientId` / `channel` - Configuração simplificada de conta única (conta `default` implícita; tem precedência sobre `accounts.default`)
- `channels.twitch.accounts.<accountName>` - Configuração de várias contas (todos os campos de conta acima)
- `channels.twitch.defaultAccount` - Qual nome de conta é o padrão
- `channels.twitch.markdown.tables` - Modo de renderização de tabelas Markdown (`off` | `bullets` | `code` | `block`)

Exemplo completo:

```json5
{
  channels: {
    twitch: {
      enabled: true,
      username: "openclaw",
      accessToken: "oauth:abc123...",
      clientId: "xyz789...",
      channel: "yourchannel",
      clientSecret: "secret123...",
      refreshToken: "refresh456...",
      allowFrom: ["123456789"],
      accounts: {
        second: {
          username: "mybot",
          accessToken: "oauth:def456...",
          clientId: "uvw012...",
          channel: "your_channel",
          enabled: true,
          expiresIn: 14400,
          obtainmentTimestamp: 1706092800000,
          allowedRoles: ["moderator"],
        },
      },
    },
  },
}
```

## Ações da ferramenta

O agente pode enviar mensagens para a Twitch pela ação `send` da ferramenta de mensagens:

```json5
{
  channel: "twitch",
  action: "send",
  to: "#mychannel",
  message: "Olá, Twitch!",
}
```

`to` é opcional e usa como padrão o `channel` configurado para a conta.

## Segurança e operações

- **Trate tokens como senhas** — nunca faça commit de tokens no git.
- **Use a renovação automática de tokens** para bots executados por longos períodos.
- **Use listas de permissões de IDs de usuário** em vez de nomes de usuário para controle de acesso.
- **Monitore os logs** para acompanhar eventos de renovação de token e o status da conexão.
- **Limite ao mínimo os escopos dos tokens** — solicite apenas `chat:read` e `chat:write`.
- **Se estiver bloqueado**: reinicie o gateway depois de confirmar que nenhum outro processo controla a sessão.

## Limites

- **500 caracteres** por mensagem; respostas mais longas são divididas nos limites entre palavras.
- O Markdown é removido antes do envio (o chat da Twitch usa texto simples; quebras de linha são transformadas em espaços).
- O OpenClaw não adiciona limitação de taxa própria; o cliente de chat Twurple gerencia os limites de taxa da Twitch.

## Relacionados

- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Grupos](/pt-BR/channels/groups) — comportamento de chats em grupo e exigência de menção
- [Emparelhamento](/pt-BR/channels/pairing) — autenticação por mensagem direta e fluxo de emparelhamento
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção
