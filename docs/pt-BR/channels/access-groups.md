---
read_when:
    - Configurando a mesma lista de permissões em vários canais de mensagem
    - Compartilhando regras de acesso para remetentes em mensagens diretas e grupos
    - Revisando o controle de acesso do canal de mensagens
summary: Listas de permissões de remetentes reutilizáveis para canais de mensagens
title: Grupos de acesso
x-i18n:
    generated_at: "2026-05-10T19:21:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1dba4fc84deb6e0c8c7b17ebc10182aa6e4bc2c821070e33df44f384e285266f
    source_path: channels/access-groups.md
    workflow: 16
---

Grupos de acesso são listas nomeadas de remetentes que você define uma vez e referencia a partir de listas de permissão de canais com `accessGroup:<name>`.

Use-os quando as mesmas pessoas devem ser permitidas em vários canais de mensagens, ou quando um conjunto confiável deve se aplicar tanto à autorização de remetentes em mensagens diretas quanto em grupos.

Grupos de acesso não concedem acesso por si só. Um grupo só importa quando um campo de lista de permissão o referencia.

## Grupos estáticos de remetentes de mensagens

Grupos estáticos de remetentes usam `type: "message.senders"`.

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

As listas de membros são indexadas pelo id do canal de mensagens:

| Chave      | Significado                                                             |
| ---------- | ----------------------------------------------------------------------- |
| `"*"`      | Entradas compartilhadas verificadas para todo canal de mensagens que referencia o grupo. |
| `discord`  | Entradas verificadas apenas para correspondência da lista de permissão do Discord. |
| `telegram` | Entradas verificadas apenas para correspondência da lista de permissão do Telegram. |
| `whatsapp` | Entradas verificadas apenas para correspondência da lista de permissão do WhatsApp. |

As entradas são correspondidas com as regras normais de `allowFrom` do canal de destino. O OpenClaw não traduz ids de remetentes entre canais. Se Alice tem um id do Telegram e um id do Discord, liste ambos os ids nas chaves apropriadas.

## Referenciar grupos a partir de listas de permissão

Referencie um grupo com `accessGroup:<name>` em qualquer lugar em que o caminho do canal de mensagens ofereça suporte a listas de permissão de remetentes.

Exemplo de lista de permissão de mensagens diretas:

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

Exemplo de lista de permissão de remetentes de grupo:

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
      spaces: {
        "spaces/AAA": {
          users: ["accessGroup:oncall"],
        },
      },
    },
  },
}
```

Você pode misturar grupos e entradas diretas:

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

Grupos de acesso estão disponíveis em caminhos compartilhados de autorização de canais de mensagens, incluindo:

- listas de permissão de remetentes de mensagens diretas, como `channels.<channel>.allowFrom`
- listas de permissão de remetentes de grupo, como `channels.<channel>.groupAllowFrom`
- listas de permissão de remetentes por sala específicas do canal que usam as mesmas regras de correspondência de remetentes
- caminhos de autorização de comandos que reutilizam listas de permissão de remetentes de canais de mensagens

O suporte do canal depende de esse canal estar conectado aos helpers compartilhados de autorização de remetentes do OpenClaw. O suporte incluído atualmente inclui Discord, Feishu, Google Chat, iMessage, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQBot, Signal, WhatsApp, Zalo e Zalo Personal. Grupos estáticos `message.senders` são projetados para serem agnósticos a canais, portanto novos canais de mensagens devem oferecer suporte a eles usando os helpers compartilhados do SDK de Plugin em vez de expansão personalizada de listas de permissão.

## Diagnósticos de Plugin

Autores de Plugin podem inspecionar o estado estruturado de grupos de acesso sem expandi-lo de volta para uma lista de permissão plana:

```typescript
import { resolveAccessGroupAllowFromState } from "openclaw/plugin-sdk/security-runtime";

const state = await resolveAccessGroupAllowFromState({
  accessGroups: cfg.accessGroups,
  allowFrom: channelConfig.allowFrom,
  channel: "my-channel",
  accountId: "default",
  senderId,
  isSenderAllowed,
});
```

O resultado informa grupos referenciados, correspondidos, ausentes, sem suporte e com falha. Use isso quando precisar de diagnósticos ou testes de conformidade. Use `expandAllowFromWithAccessGroups(...)` apenas para caminhos de compatibilidade que ainda esperam um array `allowFrom` plano.

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

`discord.channelAudience` significa "permitir remetentes de mensagens diretas do Discord que atualmente podem visualizar este canal do guild." O OpenClaw resolve o remetente pelo Discord no momento da autorização e aplica as regras de permissão `ViewChannel` do Discord.

Use isso quando um canal do Discord já for a fonte da verdade para uma equipe, como `#maintainers` ou `#on-call`.

Requisitos e comportamento de falha:

- O bot precisa de acesso ao guild e ao canal.
- O bot precisa da **Server Members Intent** no Discord Developer Portal.
- O grupo de acesso falha fechado quando o Discord retorna `Missing Access`, o remetente não pode ser resolvido como membro do guild ou o canal pertence a outro guild.

Mais exemplos específicos do Discord: [Controle de acesso do Discord](/pt-BR/channels/discord#access-control-and-routing)

## Observações de segurança

- Grupos de acesso são aliases de listas de permissão, não papéis. Eles não criam proprietários, não aprovam solicitações de pareamento nem concedem permissões de ferramentas por si só.
- `dmPolicy: "open"` ainda exige `"*"` na lista de permissão efetiva de mensagens diretas. Referenciar um grupo de acesso não é o mesmo que acesso público.
- Nomes de grupos ausentes falham fechados. Se `allowFrom` contém `accessGroup:operators` e `accessGroups.operators` está ausente, essa entrada não autoriza ninguém.
- Mantenha os ids de canais estáveis. Prefira ids numéricos/de usuário a nomes de exibição quando o canal oferecer suporte a ambos.

## Solução de problemas

Se um remetente deveria corresponder, mas está bloqueado:

1. Confirme que o campo da lista de permissão contém a referência exata `accessGroup:<name>`.
2. Confirme que `accessGroups.<name>.type` está correto.
3. Confirme que o id do remetente está listado na chave de canal correspondente ou em `"*"`.
4. Confirme que a entrada usa a sintaxe normal de lista de permissão desse canal.
5. Para públicos de canais do Discord, confirme que o bot consegue ver o canal do guild e tem Server Members Intent habilitada.

Execute `openclaw doctor` depois de editar a configuração de controle de acesso. Ele detecta muitas combinações inválidas de listas de permissão e políticas antes do runtime.
