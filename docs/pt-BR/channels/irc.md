---
read_when:
    - Você quer conectar o OpenClaw a canais ou mensagens diretas do IRC
    - Você está configurando listas de permissões do IRC, políticas de grupo ou controle por menções
summary: Configuração do plugin de IRC, controles de acesso e solução de problemas
title: IRC
x-i18n:
    generated_at: "2026-07-12T14:54:01Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

Use IRC quando quiser usar o OpenClaw em canais clássicos (`#room`) e mensagens diretas.
Instale o plugin oficial de IRC e configure-o em `channels.irc`.

## Início rápido

1. Instale o plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Defina pelo menos o host, o nick e os canais a serem acessados em `~/.openclaw/openclaw.json`:

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

3. Inicie ou reinicie o Gateway:

```bash
openclaw gateway run
```

Prefira um servidor IRC privado para a coordenação de bots. Se você optar intencionalmente por usar uma rede IRC pública, algumas opções comuns são Libera.Chat, OFTC e Snoonet. Evite canais públicos previsíveis para tráfego de comunicação interna de bots ou enxames.

## Configurações de conexão

| Chave                         | Padrão                        | Observações                                                   |
| ----------------------------- | ----------------------------- | ------------------------------------------------------------- |
| `host`                        | nenhum (obrigatório)          | Nome do host do servidor IRC                                  |
| `port`                        | `6697` com TLS, `6667` simples | 1-65535                                                      |
| `tls`                         | `true`                        | Defina como `false` somente para texto simples intencional    |
| `nick`                        | nenhum (obrigatório)          | Nick do bot                                                   |
| `username`                    | nick, senão `openclaw`        | Nome de usuário do IRC                                        |
| `realname`                    | `OpenClaw`                    | Campo de nome real/GECOS                                      |
| `password` / `passwordFile`   | nenhum                        | Senha do servidor; o arquivo deve ser um arquivo comum        |
| `channels`                    | nenhum                        | Canais a serem acessados (`["#openclaw"]`)                    |
| `accounts` / `defaultAccount` | nenhum                        | Configuração de várias contas; variáveis de ambiente preenchem apenas a conta padrão |

## Padrões de segurança

- O IRC usa soquetes TCP/TLS brutos fora do roteamento de proxy de encaminhamento gerenciado pelo operador do OpenClaw. Em implantações que exigem que todo o tráfego de saída passe por esse proxy de encaminhamento, defina `channels.irc.enabled=false`, a menos que a saída direta de IRC seja explicitamente aprovada.
- O padrão de `channels.irc.dmPolicy` é `"pairing"`: remetentes desconhecidos de mensagens diretas recebem um código de pareamento, que você aprova com `openclaw pairing approve irc <code>`.
- O padrão de `channels.irc.groupPolicy` é `"allowlist"`.
- Com `groupPolicy="allowlist"`, defina `channels.irc.groups` para especificar os canais permitidos.
- Use TLS (`channels.irc.tls=true`), a menos que você aceite intencionalmente o transporte em texto simples.

## Controle de acesso

Há dois "controles" separados para canais IRC:

1. **Acesso ao canal** (`groupPolicy` + `groups`): determina se o bot aceita mensagens de um canal.
2. **Acesso do remetente** (`groupAllowFrom` / `groups["#channel"].allowFrom` por canal): determina quem pode acionar o bot dentro desse canal.

Chaves de configuração:

- Lista de permissões de mensagens diretas (acesso do remetente de mensagens diretas): `channels.irc.allowFrom`
- Lista de permissões de remetentes de grupo (acesso do remetente do canal): `channels.irc.groupAllowFrom`
- Controles por canal (regras de canal, remetente e menção): `channels.irc.groups["#channel"]` com `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` e `systemPrompt`
- `channels.irc.groupPolicy="open"` permite canais não configurados (**ainda exigindo menção por padrão**)

As entradas da lista de permissões devem usar identidades estáveis de remetente (`nick!user@host`).
A correspondência somente pelo nick é mutável e só é habilitada quando `channels.irc.dangerouslyAllowNameMatching: true`.

### Erro comum: `allowFrom` serve para mensagens diretas, não para canais

Se você vir logs como:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...isso significa que o remetente não tinha permissão para mensagens de **grupo/canal**. Corrija de uma destas formas:

- defina `channels.irc.groupAllowFrom` (globalmente para todos os canais); ou
- defina listas de permissões de remetentes por canal: `channels.irc.groups["#channel"].allowFrom`

Exemplo (permitir que qualquer pessoa em `#openclaw` fale com o bot):

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": { allowFrom: ["*"] },
      },
    },
  },
}
```

## Acionamento de respostas (menções)

Mesmo que um canal seja permitido (por meio de `groupPolicy` + `groups`) e o remetente tenha permissão, o OpenClaw, por padrão, **exige menção** em contextos de grupo. O bot considera que foi mencionado quando a mensagem contém o nick conectado do bot ou corresponde aos padrões de menção configurados.

Isso significa que você pode ver logs como `drop channel … (missing-mention)`, a menos que a mensagem inclua um padrão de menção correspondente ao bot.

Para fazer o bot responder em um canal IRC **sem exigir uma menção**, desative a exigência de menção nesse canal:

```json5
{
  channels: {
    irc: {
      groupPolicy: "allowlist",
      groups: {
        "#openclaw": {
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

### As mesmas ferramentas para todos no canal

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
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

### Ferramentas diferentes por remetente (o proprietário recebe mais permissões)

Use `toolsBySender` para aplicar uma política mais restrita a `"*"` e outra menos restrita ao seu nick:

```json5
{
  channels: {
    irc: {
      groups: {
        "#openclaw": {
          allowFrom: ["*"],
          toolsBySender: {
            "*": {
              deny: ["group:runtime", "group:fs", "gateway", "nodes", "cron", "browser"],
            },
            "id:alice": {
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

- As chaves de `toolsBySender` devem usar prefixos explícitos (`channel:`, `id:`, `e164:`, `username:`, `name:`). Para IRC, use `id:` com o valor da identidade do remetente: `id:alice` ou `id:alice!~alice@203.0.113.7` para uma correspondência mais rigorosa.
- Chaves legadas sem prefixo ainda são aceitas, correspondem apenas como `id:` e emitem um aviso de descontinuação.
- A primeira política de remetente correspondente prevalece; `"*"` é o curinga de fallback.

Para saber mais sobre acesso a grupos em comparação com a exigência de menção (e como eles interagem), consulte: [/channels/groups](/pt-BR/channels/groups).

## NickServ

Para se identificar no NickServ após a conexão:

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

Por padrão, a identificação no NickServ é executada sempre que uma senha está definida (`enabled` só precisa ser `false` para desativá-la). O padrão de `service` é `NickServ`; `passwordFile` é uma alternativa a `password` em linha.

Registro único opcional durante a conexão (`register: true` exige `registerEmail`):

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

Desative `register` depois que o nick for registrado para evitar tentativas repetidas de REGISTER.

## Variáveis de ambiente

A conta padrão é compatível com:

- `IRC_HOST`
- `IRC_PORT`
- `IRC_TLS`
- `IRC_NICK`
- `IRC_USERNAME`
- `IRC_REALNAME`
- `IRC_PASSWORD`
- `IRC_CHANNELS` (separados por vírgulas)
- `IRC_NICKSERV_PASSWORD`
- `IRC_NICKSERV_REGISTER_EMAIL`

`IRC_HOST` não pode ser definido por meio de um arquivo `.env` do workspace; consulte [Arquivos `.env` do workspace](/pt-BR/gateway/security).

## Solução de problemas

- Se o bot se conectar, mas nunca responder nos canais, verifique `channels.irc.groups` **e** se a exigência de menção está descartando mensagens (`missing-mention`). Se quiser que ele responda sem menções, defina `requireMention:false` para o canal.
- Se o login falhar, verifique a disponibilidade do nick e a senha do servidor.
- Se o TLS falhar em uma rede personalizada, verifique o host, a porta e a configuração do certificado.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chats em grupo e exigência de menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
