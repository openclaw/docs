---
read_when:
    - Você quer conectar o OpenClaw a canais ou mensagens diretas do IRC
    - Você está configurando listas de permissões do IRC, políticas de grupo ou controle por menções
summary: Configuração do plugin IRC, controles de acesso e solução de problemas
title: IRC
x-i18n:
    generated_at: "2026-07-11T23:44:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23e288f18a57a3ee74a433feb1ffb7dda0480f998cf74d4ec825bd7f3c0745c5
    source_path: channels/irc.md
    workflow: 16
---

Use IRC quando quiser usar o OpenClaw em canais clássicos (`#room`) e mensagens diretas.
Instale o plugin oficial do IRC e configure-o em `channels.irc`.

## Início rápido

1. Instale o plugin:

```bash
openclaw plugins install @openclaw/irc
```

2. Defina pelo menos o host, o apelido e os canais aos quais se conectar em `~/.openclaw/openclaw.json`:

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

3. Inicie/reinicie o Gateway:

```bash
openclaw gateway run
```

Prefira um servidor IRC privado para a coordenação de bots. Se você usar intencionalmente uma rede IRC pública, algumas opções comuns incluem Libera.Chat, OFTC e Snoonet. Evite canais públicos previsíveis para o tráfego de comunicação interna de bots ou enxames.

## Configurações de conexão

| Chave                         | Padrão                        | Observações                                                  |
| ----------------------------- | ----------------------------- | ------------------------------------------------------------ |
| `host`                        | nenhum (obrigatório)          | Nome do host do servidor IRC                                 |
| `port`                        | `6697` com TLS, `6667` simples | 1-65535                                                     |
| `tls`                         | `true`                        | Defina como `false` somente para texto simples intencional   |
| `nick`                        | nenhum (obrigatório)          | Apelido do bot                                               |
| `username`                    | apelido, senão `openclaw`     | Nome de usuário do IRC                                       |
| `realname`                    | `OpenClaw`                    | Campo de nome real/GECOS                                     |
| `password` / `passwordFile`   | nenhum                        | Senha do servidor; o arquivo deve ser um arquivo regular     |
| `channels`                    | nenhum                        | Canais aos quais se conectar (`["#openclaw"]`)               |
| `accounts` / `defaultAccount` | nenhum                        | Configuração de várias contas; variáveis de ambiente preenchem somente a conta padrão |

## Padrões de segurança

- O IRC usa soquetes TCP/TLS brutos fora do roteamento por proxy de encaminhamento gerenciado pelo operador do OpenClaw. Em implantações que exigem que todo o tráfego de saída passe por esse proxy de encaminhamento, defina `channels.irc.enabled=false`, a menos que o tráfego de saída direto para IRC seja explicitamente aprovado.
- O padrão de `channels.irc.dmPolicy` é `"pairing"`: remetentes desconhecidos de mensagens diretas recebem um código de pareamento que você aprova com `openclaw pairing approve irc <code>`.
- O padrão de `channels.irc.groupPolicy` é `"allowlist"`.
- Com `groupPolicy="allowlist"`, defina `channels.irc.groups` para especificar os canais permitidos.
- Use TLS (`channels.irc.tls=true`), a menos que você aceite intencionalmente o transporte em texto simples.

## Controle de acesso

Há dois "controles" separados para canais IRC:

1. **Acesso ao canal** (`groupPolicy` + `groups`): se o bot aceita ou não mensagens de um canal.
2. **Acesso do remetente** (`groupAllowFrom` / `groups["#channel"].allowFrom` por canal): quem tem permissão para acionar o bot dentro desse canal.

Chaves de configuração:

- Lista de permissões para mensagens diretas (acesso do remetente): `channels.irc.allowFrom`
- Lista de permissões de remetentes de grupos (acesso do remetente no canal): `channels.irc.groupAllowFrom`
- Controles por canal (regras de canal, remetente e menção): `channels.irc.groups["#channel"]` com `requireMention`, `allowFrom`, `enabled`, `tools`, `toolsBySender`, `skills` e `systemPrompt`
- `channels.irc.groupPolicy="open"` permite canais não configurados (**ainda exige menção por padrão**)

As entradas da lista de permissões devem usar identidades estáveis de remetentes (`nick!user@host`).
A correspondência apenas pelo apelido é mutável e somente é ativada quando `channels.irc.dangerouslyAllowNameMatching: true`.

### Armadilha comum: `allowFrom` é para mensagens diretas, não para canais

Se você vir registros como:

- `irc: drop group sender alice!ident@host (policy=allowlist)`

...isso significa que o remetente não tinha permissão para mensagens de **grupo/canal**. Corrija isso de uma destas formas:

- definindo `channels.irc.groupAllowFrom` (global para todos os canais), ou
- definindo listas de permissões de remetentes por canal: `channels.irc.groups["#channel"].allowFrom`

Exemplo (permitir que qualquer pessoa em `#openclaw` converse com o bot):

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

Mesmo que um canal seja permitido (por meio de `groupPolicy` + `groups`) e o remetente seja permitido, o OpenClaw exige **menção** por padrão em contextos de grupo. O bot é considerado mencionado quando a mensagem contém o apelido do bot conectado ou corresponde aos padrões de menção configurados.

Isso significa que você pode ver registros como `drop channel … (missing-mention)`, a menos que a mensagem inclua um padrão de menção correspondente ao bot.

Para fazer o bot responder em um canal IRC **sem precisar de uma menção**, desative a exigência de menção para esse canal:

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

## Observação de segurança (recomendada para canais públicos)

Se você permitir `allowFrom: ["*"]` em um canal público, qualquer pessoa poderá enviar instruções ao bot.
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

### Ferramentas diferentes por remetente (o proprietário recebe mais poder)

Use `toolsBySender` para aplicar uma política mais rígida a `"*"` e uma mais flexível ao seu apelido:

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
- Chaves antigas sem prefixo ainda são aceitas, correspondem somente como `id:` e emitem um aviso de descontinuação.
- A primeira política de remetente correspondente prevalece; `"*"` é a opção curinga de contingência.

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

A identificação no NickServ é executada por padrão sempre que uma senha é definida (`enabled` só precisa ser `false` para desativá-la). O padrão de `service` é `NickServ`; `passwordFile` é uma alternativa a `password` em linha.

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

Desative `register` depois que o apelido for registrado para evitar tentativas repetidas de REGISTER.

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

`IRC_HOST` não pode ser definido por um arquivo `.env` do espaço de trabalho; consulte [Arquivos `.env` do espaço de trabalho](/pt-BR/gateway/security).

## Solução de problemas

- Se o bot se conectar, mas nunca responder nos canais, verifique `channels.irc.groups` **e** se a exigência de menção está descartando mensagens (`missing-mention`). Se quiser que ele responda sem menções, defina `requireMention:false` para o canal.
- Se o login falhar, verifique a disponibilidade do apelido e a senha do servidor.
- Se o TLS falhar em uma rede personalizada, verifique o host, a porta e a configuração do certificado.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação de mensagens diretas e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de conversas em grupo e exigência de menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e reforço de segurança
