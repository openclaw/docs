---
read_when:
    - Você quer conectar o OpenClaw a canais ou DMs de IRC
    - Você está configurando allowlists, política de grupo ou exigência de menção para IRC
summary: Configuração do Plugin de IRC, controles de acesso e solução de problemas
title: IRC
x-i18n:
    generated_at: "2026-04-24T05:41:39Z"
    model: gpt-5.4
    provider: openai
    source_hash: 76f316c0f026d0387a97dc5dcb6d8967f6e4841d94b95b36e42f6f6284882a69
    source_path: channels/irc.md
    workflow: 15
---

Use IRC quando você quiser o OpenClaw em canais clássicos (`#room`) e mensagens diretas.
O IRC é fornecido como um Plugin incluído, mas é configurado na configuração principal em `channels.irc`.

## Início rápido

1. Habilite a configuração de IRC em `~/.openclaw/openclaw.json`.
2. Defina pelo menos:

```json5
{
  channels: {
    irc: {
      enabled: true,
      host: "irc.example.com",
      port: 6697,
      tls: true,
      nick: "openclaw-bot",
      channels: ["#openclaw"],
    },
  },
}
```

Prefira um servidor IRC privado para coordenação do bot. Se você usar intencionalmente uma rede IRC pública, escolhas comuns incluem Libera.Chat, OFTC e Snoonet. Evite canais públicos previsíveis para tráfego de backchannel de bots ou swarm.

3. Inicie/reinicie o gateway:

```bash
openclaw gateway run
```

## Padrões de segurança

- `channels.irc.dmPolicy` usa `"pairing"` por padrão.
- `channels.irc.groupPolicy` usa `"allowlist"` por padrão.
- Com `groupPolicy="allowlist"`, defina `channels.irc.groups` para definir os canais permitidos.
- Use TLS (`channels.irc.tls=true`) a menos que você aceite intencionalmente transporte em texto simples.

## Controle de acesso

Há dois “portões” separados para canais IRC:

1. **Acesso ao canal** (`groupPolicy` + `groups`): se o bot aceita mensagens de um canal.
2. **Acesso do remetente** (`groupAllowFrom` / por canal `groups["#channel"].allowFrom`): quem tem permissão para acionar o bot dentro desse canal.

Chaves de configuração:

- allowlist de DM (acesso do remetente em DM): `channels.irc.allowFrom`
- allowlist de remetentes em grupo (acesso do remetente no canal): `channels.irc.groupAllowFrom`
- Controles por canal (canal + remetente + regras de menção): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` permite canais não configurados (**ainda exigindo menção por padrão**)

Entradas de allowlist devem usar identidades estáveis de remetente (`nick!user@host`).
A correspondência apenas por nick é mutável e só é habilitada quando `channels.irc.dangerouslyAllowNameMatching: true`.

### Pegadinha comum: `allowFrom` é para DMs, não para canais

Se você vir logs como:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

…isso significa que o remetente não foi permitido para mensagens de **grupo/canal**. Corrija isso de uma destas formas:

- definindo `channels.irc.groupAllowFrom` (global para todos os canais), ou
- definindo allowlists de remetente por canal: `channels.irc.groups["#channel"].allowFrom`

Exemplo (permitir que qualquer pessoa em `#tuirc-dev` fale com o bot):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Acionamento de resposta (menções)

Mesmo que um canal seja permitido (via `groupPolicy` + `groups`) e o remetente seja permitido, o OpenClaw usa por padrão **exigência de menção** em contextos de grupo.

Isso significa que você pode ver logs como `drop channel … (missing-mention)` a menos que a mensagem inclua um padrão de menção que corresponda ao bot.

Para fazer o bot responder em um canal IRC **sem precisar de menção**, desative a exigência de menção para esse canal:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#tuirc-dev": {
          requireMention: false,
          allowFrom: ["*"],
        },
      },
    },
  },
}
```

Ou, para permitir **todos** os canais IRC (sem allowlist por canal) e ainda responder sem menções:

```json5
{
  channels: {
    irc: {
      groupPolicy: "open",
      groups: {
        "*": { requireMention: false, allowFrom: ["*"] },
      },
    },
  },
}
```

## Observação de segurança (recomendada para canais públicos)

Se você permitir `allowFrom: ["*"]` em um canal público, qualquer pessoa poderá dar prompts ao bot.
Para reduzir o risco, restrinja as ferramentas desse canal.

### As mesmas ferramentas para todos no canal

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          tools: {
            deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
          },
        },
      },
    },
  },
}
```

### Ferramentas diferentes por remetente (o proprietário recebe mais poder)

Use `toolsBySender` para aplicar uma política mais restrita a `"*"` e uma política mais flexível ao seu nick:

```json5
{
  channels: {
    irc: {
      groups: {
        "#tuirc-dev": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:eigen": {
              deny: ["gateway", "nodes", "cron"],
            },
          },
        },
      },
    },
  },
}
```

Observações:

- As chaves de `toolsBySender` devem usar `id:` para valores de identidade de remetente IRC:
  `id:eigen` ou `id:eigen!~eigen@174.127.248.171` para uma correspondência mais forte.
- Chaves legadas sem prefixo ainda são aceitas e correspondem apenas como `id:`.
- A primeira política de remetente correspondente vence; `"*"` é o fallback curinga.

Para saber mais sobre acesso a grupos vs. exigência de menção (e como eles interagem), consulte: [/channels/groups](/pt-BR/channels/groups).

## NickServ

Para se identificar com NickServ após a conexão:

```json5
{
  channels: {
    irc: {
      nickserv: {
        enabled: true,
        service: "NickServ",
        password: "your-nickserv-password",
      },
    },
  },
}
```

Registro opcional único na conexão:

```json5
{
  channels: {
    irc: {
      nickserv: {
        register: true,
        registerEmail: "bot@example.com",
      },
    },
  },
}
```

Desative `register` após o nick ser registrado para evitar tentativas repetidas de REGISTER.

## Variáveis de ambiente

A conta padrão oferece suporte a:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (separados por vírgula)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` não pode ser definido a partir de um `.env` do workspace; consulte [Arquivos `.env` do workspace](/pt-BR/gateway/security).

## Solução de problemas

- Se o bot se conecta, mas nunca responde em canais, verifique `channels.irc.groups` **e** se a exigência de menção está descartando mensagens (`missing-mention`). Se você quiser que ele responda sem pings, defina `requireMention:false` para o canal.
- Se o login falhar, verifique a disponibilidade do nick e a senha do servidor.
- Se o TLS falhar em uma rede personalizada, verifique host/porta e a configuração do certificado.

## Relacionado

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pairing
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e exigência de menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e endurecimento
