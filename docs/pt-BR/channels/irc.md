---
read_when:
    - Você quer conectar o OpenClaw a canais IRC ou DMs
    - Você está configurando listas de permissões de IRC, política de grupo ou controle de menções
summary: Configuração, controles de acesso e solução de problemas do Plugin IRC
title: IRC
x-i18n:
    generated_at: "2026-06-27T17:10:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 7182796ff92f98bd1e6c24cbd456dd1037fa304e3fca4eee13f62eea8cd946f6
    source_path: channels/irc.md
    workflow: 16
---

Use IRC quando quiser usar o OpenClaw em canais clássicos (`#room`) e mensagens diretas.
Instale o Plugin oficial de IRC e configure-o em `channels.irc`.

## Início rápido

1. Instale o Plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Habilite a configuração de IRC em `~/.openclaw/openclaw.json`.
3. Defina pelo menos:

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

Prefira um servidor IRC privado para coordenação de bots. Se você usar intencionalmente uma rede IRC pública, opções comuns incluem Libera.Chat, OFTC e Snoonet. Evite canais públicos previsíveis para tráfego de bastidores de bots ou enxames.

4. Inicie/reinicie o gateway:

```bash
openclaw gateway run
```

## Padrões de segurança

- O IRC usa soquetes TCP/TLS brutos fora do roteamento de proxy de encaminhamento gerenciado pelo operador do OpenClaw. Em implantações que exigem todo o tráfego de saída por esse proxy de encaminhamento, defina `channels.irc.enabled=false`, a menos que a saída direta via IRC seja explicitamente aprovada.
- `channels.irc.dmPolicy` usa `"pairing"` por padrão.
- `channels.irc.groupPolicy` usa `"allowlist"` por padrão.
- Com `groupPolicy="allowlist"`, defina `channels.irc.groups` para especificar os canais permitidos.
- Use TLS (`channels.irc.tls=true`), a menos que você aceite intencionalmente transporte em texto claro.

## Controle de acesso

Há dois "portões" separados para canais IRC:

1. **Acesso ao canal** (`groupPolicy` + `groups`): se o bot aceita mensagens de um canal.
2. **Acesso do remetente** (`groupAllowFrom` / `groups["#channel"].allowFrom` por canal): quem tem permissão para acionar o bot dentro desse canal.

Chaves de configuração:

- Lista de permissões de DM (acesso de remetente de DM): `channels.irc.allowFrom`
- Lista de permissões de remetentes de grupo (acesso de remetente de canal): `channels.irc.groupAllowFrom`
- Controles por canal (regras de canal + remetente + menção): `channels.irc.groups["#channel"]`
- `channels.irc.groupPolicy="open"` permite canais não configurados (**ainda com exigência de menção por padrão**)

As entradas da lista de permissões devem usar identidades de remetente estáveis (`nick!user@host`).
A correspondência apenas por nick é mutável e só é habilitada quando `channels.irc.dangerouslyAllowNameMatching: true`.

### Pegadinha comum: `allowFrom` é para DMs, não para canais

Se você vir logs como:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...isso significa que o remetente não tinha permissão para mensagens de **grupo/canal**. Corrija isso de uma destas formas:

- definindo `channels.irc.groupAllowFrom` (global para todos os canais), ou
- definindo listas de permissões de remetentes por canal: `channels.irc.groups["#channel"].allowFrom`

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

## Acionamento de respostas (menções)

Mesmo que um canal seja permitido (via `groupPolicy` + `groups`) e o remetente seja permitido, o OpenClaw usa por padrão **bloqueio por menção** em contextos de grupo.

Isso significa que você pode ver logs como `drop channel … (missing-mention)`, a menos que a mensagem inclua um padrão de menção que corresponda ao bot.

Para fazer o bot responder em um canal IRC **sem precisar de menção**, desative o bloqueio por menção para esse canal:

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

Ou, para permitir **todos** os canais IRC (sem lista de permissões por canal) e ainda responder sem menções:

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

### Mesmas ferramentas para todos no canal

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

Use `toolsBySender` para aplicar uma política mais rigorosa a `"*"` e uma mais flexível ao seu nick:

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
  `id:eigen` ou `id:eigen!~eigen@174.127.248.171` para correspondência mais forte.
- Chaves legadas sem prefixo ainda são aceitas e correspondem apenas como `id:`.
- A primeira política de remetente correspondente vence; `"*"` é o fallback curinga.

Para saber mais sobre acesso de grupo versus bloqueio por menção (e como eles interagem), consulte: [/channels/groups](/pt-BR/channels/groups).

## NickServ

Para identificar-se com o NickServ após conectar:

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

Registro único opcional ao conectar:

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
- `IRC_CHANNELS` (separados por vírgula)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` não pode ser definido a partir de um `.env` de workspace; consulte [Arquivos `.env` de workspace](/pt-BR/gateway/security).

## Solução de problemas

- Se o bot conecta, mas nunca responde em canais, verifique `channels.irc.groups` **e** se o bloqueio por menção está descartando mensagens (`missing-mention`). Se quiser que ele responda sem pings, defina `requireMention:false` para o canal.
- Se o login falhar, verifique a disponibilidade do nick e a senha do servidor.
- Se o TLS falhar em uma rede personalizada, verifique o host/porta e a configuração do certificado.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e bloqueio por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
