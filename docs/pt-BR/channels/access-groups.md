---
read_when:
    - Configurando a mesma lista de permissões em vários canais de mensagens
    - Compartilhamento de regras de acesso para remetentes de mensagens diretas e grupos
    - Revisando o controle de acesso dos canais de mensagens
summary: Listas reutilizáveis de remetentes permitidos para canais de mensagens
title: Grupos de acesso
x-i18n:
    generated_at: "2026-07-11T23:43:50Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

Grupos de acesso são listas nomeadas de remetentes que você define uma vez em `accessGroups` e referencia nas listas de permissões dos canais com `accessGroup:<name>`.

Use-os quando as mesmas pessoas precisarem ser permitidas em vários canais de mensagens ou quando um único conjunto confiável precisar ser aplicado tanto à autorização de remetentes de mensagens diretas quanto de grupos.

Um grupo não concede nada por si só. Ele só tem efeito quando um campo de lista de permissões o referencia.

## Grupos estáticos de remetentes de mensagens

Grupos estáticos de remetentes usam `type: "message.senders"`. `members` é organizado por id de canal de mensagens, além de `"*"` para entradas compartilhadas por todos os canais:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        "*": ["global-owner-id"],
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
}
```

| Chave                      | Significado                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `"*"`                      | Entradas compartilhadas verificadas em todos os canais de mensagens que referenciam o grupo.         |
| `discord`, `telegram`, ... | Entradas verificadas somente na correspondência com a lista de permissões desse canal.                |

As entradas são comparadas usando as regras normais de `allowFrom` do canal de destino. O OpenClaw não converte ids de remetentes entre canais: se Alice tiver um id do Telegram e um id do Discord, liste ambos os ids nas chaves dos canais correspondentes.

## Referenciar grupos em listas de permissões

Referencie um grupo com `accessGroup:<name>` em qualquer lugar em que o caminho do canal de mensagens aceite listas de permissões de remetentes.

Exemplo de lista de permissões de mensagens diretas:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
      },
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
    telegram: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators"],
    },
  },
}
```

Exemplo de lista de permissões de remetentes de grupos:

```json5
{
  accessGroups: {
    oncall: {
      type: "message.senders",
      members: {
        whatsapp: ["+15551234567"],
        googlechat: ["users/1234567890"],
      },
    },
  },
  channels: {
    whatsapp: {
      groupPolicy: "allowlist",
      groupAllowFrom: ["accessGroup:oncall"],
    },
    googlechat: {
      groups: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Você pode combinar grupos e entradas diretas:

```json5
{
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:operators", "discord:123456789012345678"],
    },
  },
}
```

## Caminhos de canais de mensagens compatíveis

Os grupos de acesso funcionam nos caminhos compartilhados de autorização de canais de mensagens:

- listas de permissões de remetentes de mensagens diretas, como `channels.<channel>.allowFrom`
- listas de permissões de remetentes de grupos, como `channels.<channel>.groupAllowFrom`
- listas de permissões de remetentes por sala específicas do canal que usam as mesmas regras de correspondência de remetentes (por exemplo, `groups.<space>.users` do Google Chat)
- caminhos de autorização de comandos que reutilizam listas de permissões de remetentes de canais de mensagens

A compatibilidade de cada canal depende de ele estar integrado aos auxiliares compartilhados de autorização de remetentes do OpenClaw. A compatibilidade atualmente incluída abrange ClickClack, Discord, Feishu, Google Chat, iMessage, IRC, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Signal, Slack, SMS, Telegram, WhatsApp, Zalo e Zalo Personal. Grupos estáticos `message.senders` são independentes de canal; portanto, novos canais de mensagens passam a oferecer suporte a eles ao usar os auxiliares compartilhados de entrada do SDK de plugins, em vez de uma expansão personalizada da lista de permissões.

## Públicos de canais do Discord

O Discord também oferece suporte a um tipo dinâmico de grupo de acesso:

```json5
{
  accessGroups: {
    maintainers: {
      type: "discord.channelAudience",
      guildId: "1456350064065904867",
      channelId: "1456744319972282449",
      membership: "canViewChannel",
    },
  },
  channels: {
    discord: {
      dmPolicy: "allowlist",
      allowFrom: ["accessGroup:maintainers"],
    },
  },
}
```

`discord.channelAudience` significa "permitir remetentes de mensagens diretas do Discord que atualmente podem visualizar este canal do servidor". O OpenClaw resolve o remetente por meio do Discord no momento da autorização e aplica as regras da permissão `ViewChannel` do Discord. `membership` é opcional e seu padrão é `canViewChannel`.

Use isso quando um canal do Discord já for a fonte de verdade de uma equipe, como `#maintainers` ou `#on-call`.

Requisitos e comportamento em caso de falha:

- O bot precisa ter acesso ao servidor e ao canal.
- O bot precisa da opção **Server Members Intent** no Discord Developer Portal.
- O grupo de acesso bloqueia por padrão quando o Discord retorna `Missing Access`, quando não é possível resolver o remetente como membro do servidor ou quando o canal pertence a outro servidor.

Mais exemplos específicos do Discord: [Controle de acesso do Discord](/pt-BR/channels/discord#access-control-and-routing)

## Diagnóstico de plugins

Autores de plugins podem inspecionar o estado estruturado dos grupos de acesso sem expandi-lo novamente para uma lista de permissões plana:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/access-groups";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

O resultado informa grupos referenciados, correspondentes, ausentes, não compatíveis e com falha. Use-o para diagnósticos ou testes de conformidade. Use `expandAllowFromWithAccessGroups(...)` somente em caminhos de compatibilidade que ainda esperam um array `allowFrom` plano.

## Observações de segurança

- Grupos de acesso são aliases de listas de permissões, não funções. Eles não criam proprietários, aprovam solicitações de pareamento nem concedem permissões de ferramentas por si só.
- `dmPolicy: "open"` ainda exige `"*"` na lista efetiva de permissões de mensagens diretas. Referenciar um grupo de acesso não equivale a acesso público.
- Nomes de grupos ausentes bloqueiam por padrão. Se `allowFrom` contiver `accessGroup:operators` e `accessGroups.operators` estiver ausente, essa entrada não autorizará ninguém.
- Mantenha os ids dos canais estáveis. Prefira ids numéricos/de usuário a nomes de exibição quando o canal aceitar ambos.

## Solução de problemas

Se um remetente deveria corresponder, mas estiver bloqueado:

1. Confirme se o campo da lista de permissões contém a referência exata `accessGroup:<name>`.
2. Confirme se `accessGroups.<name>.type` está correto.
3. Confirme se o id do remetente está listado na chave do canal correspondente ou em `"*"`.
4. Confirme se a entrada usa a sintaxe normal da lista de permissões desse canal.
5. Para públicos de canais do Discord, confirme se o bot consegue ver o canal do servidor e se **Server Members Intent** está ativada.

Execute `openclaw doctor` após editar a configuração de controle de acesso. Ele detecta muitas combinações inválidas de listas de permissões e políticas antes da execução.
