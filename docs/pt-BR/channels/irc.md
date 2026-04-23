---
read_when:
    - Você quer conectar o OpenClaw a canais ou DMs do IRC
    - Você está configurando listas de permissão do IRC, política de grupo ou restrição por menção
summary: Configuração do plugin IRC, controles de acesso e solução de problemas
title: IRC
x-i18n:
    generated_at: "2026-04-23T13:57:58Z"
    model: gpt-5.4
    provider: openai
    source_hash: e198c03db9aaf4ec64db462d44d42aa352a2ddba808bcd29e21eb2791d9755ad
    source_path: channels/irc.md
    workflow: 15
---

# IRC

Use o IRC quando quiser o OpenClaw em canais clássicos (`#room`) e mensagens diretas.
O IRC é distribuído como um plugin empacotado, mas é configurado na configuração principal em `channels.irc`.

## Início rápido

1. Ative a configuração do IRC em `~/.openclaw/openclaw.json`.
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

Prefira um servidor IRC privado para coordenação do bot. Se você usar intencionalmente uma rede IRC pública, escolhas comuns incluem Libera.Chat, OFTC e Snoonet. Evite canais públicos previsíveis para tráfego de bastidor do bot ou do swarm.

3. Inicie/reinicie o Gateway:

```bash
openclaw gateway run
```

## Padrões de segurança

- `channels.irc.dmPolicy` tem como padrão `"pairing"`.
- `channels.irc.groupPolicy` tem como padrão `"allowlist"`.
- Com `groupPolicy="allowlist"`, defina `channels.irc.groups` para especificar os canais permitidos.
- Use TLS (`channels.irc.tls=true`), a menos que você aceite intencionalmente transporte em texto simples.

## Controle de acesso

Há dois “bloqueios” separados para canais IRC:

1. **Acesso ao canal** (`groupPolicy` + `groups`): se o bot aceita mensagens de um canal.
2. **Acesso do remetente** (`groupAllowFrom` / `groups["#channel"].allowFrom` por canal): quem tem permissão para acionar o bot dentro desse canal.

Chaves de configuração:

- Allowlist de DM (acesso do remetente em DM): `channels.irc.allowFrom`
- Allowlist de remetentes em grupo (acesso do remetente no canal): `channels.irc.groupAllowFrom`
- Controles por canal (canal + remetente + regras de menção): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` permite canais não configurados (**ainda restritos por menção por padrão**)

As entradas da allowlist devem usar identidades estáveis do remetente (`nick!user@host`).
A correspondência apenas por nick é mutável e só é ativada quando `channels.irc.dangerouslyAllowNameMatching: true`.

### Armadilha comum: `allowFrom` é para DMs, não para canais

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

Mesmo que um canal seja permitido (via `groupPolicy` + `groups`) e o remetente seja permitido, o OpenClaw usa por padrão **restrição por menção** em contextos de grupo.

Isso significa que você pode ver logs como `drop channel … (missing-mention)` a menos que a mensagem inclua um padrão de menção que corresponda ao bot.

Para fazer o bot responder em um canal IRC **sem precisar de uma menção**, desative a restrição por menção para esse canal:

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

## Observação de segurança (recomendado para canais públicos)

Se você permitir `allowFrom: ["*"]` em um canal público, qualquer pessoa poderá enviar prompts ao bot.
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

### Ferramentas diferentes por remetente (o proprietário tem mais poder)

Use `toolsBySender` para aplicar uma política mais restrita a `"*"` e uma mais flexível ao seu nick:

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

- As chaves de `toolsBySender` devem usar `id:` para valores de identidade de remetente do IRC:
  `id:eigen` ou `id:eigen!~eigen@174.127.248.171` para correspondência mais forte.
- Chaves legadas sem prefixo ainda são aceitas e correspondem apenas como `id:`.
- A primeira política de remetente correspondente vence; `"*"` é o fallback curinga.

Para saber mais sobre acesso em grupo versus restrição por menção (e como eles interagem), veja: [/channels/groups](/pt-BR/channels/groups).

## NickServ

Para se identificar com o NickServ após a conexão:

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

Desative `register` depois que o nick estiver registrado para evitar tentativas repetidas de REGISTER.

## Variáveis de ambiente

A conta padrão oferece suporte a:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (separado por vírgulas)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` não pode ser definido a partir de um `.env` do workspace; veja [Arquivos `.env` do workspace](/pt-BR/gateway/security).

## Solução de problemas

- Se o bot se conectar, mas nunca responder nos canais, verifique `channels.irc.groups` **e** se a restrição por menção está descartando mensagens (`missing-mention`). Se quiser que ele responda sem pings, defina `requireMention:false` para o canal.
- Se o login falhar, verifique a disponibilidade do nick e a senha do servidor.
- Se o TLS falhar em uma rede personalizada, verifique host/porta e a configuração do certificado.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação por DM e fluxo de Pairing
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e restrição por menção
- [Roteamento de canal](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
