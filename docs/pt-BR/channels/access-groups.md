---
read_when:
    - Configurando a mesma lista de permissões em vários canais de mensagens
    - Compartilhamento de regras de acesso para remetentes de mensagens diretas e grupos
    - Revisão do controle de acesso aos canais de mensagens
summary: Listas reutilizáveis de remetentes permitidos para canais de mensagens
title: Grupos de acesso
x-i18n:
    generated_at: "2026-07-12T14:55:27Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 099abc95e90d9a7b7006d19062c46b4ffdb2aecb1e8e714454a3182131a786d0
    source_path: channels/access-groups.md
    workflow: 16
---

Grupos de acesso são listas nomeadas de remetentes que você define uma vez em `accessGroups` e referencia nas listas de permissões dos canais com `accessGroup:<name>`.

Use-os quando as mesmas pessoas precisarem ser autorizadas em vários canais de mensagens ou quando um único conjunto confiável precisar valer tanto para mensagens diretas quanto para a autorização de remetentes em grupos.

Um grupo, por si só, não concede nada. Ele só tem efeito quando um campo de lista de permissões faz referência a ele.

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

| Chave                      | Significado                                                                        |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `"*"`                      | Entradas compartilhadas verificadas em cada canal de mensagens que referencia o grupo. |
| `discord`, `telegram`, ... | Entradas verificadas somente ao comparar a lista de permissões desse canal.         |

As entradas são comparadas usando as regras normais de `allowFrom` do canal de destino. O OpenClaw não converte ids de remetentes entre canais: se Alice tiver um id do Telegram e um id do Discord, liste ambos sob as chaves dos canais correspondentes.

## Referenciar grupos em listas de permissões

Faça referência a um grupo com `accessGroup:<name>` em qualquer lugar em que o caminho do canal de mensagens aceite listas de permissões de remetentes.

Exemplo de lista de permissões para mensagens diretas:

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

Exemplo de lista de permissões de remetentes em grupos:

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
- listas de permissões de remetentes por sala específicas de cada canal que usam as mesmas regras de correspondência de remetentes (por exemplo, `groups.<space>.users` do Google Chat)
- caminhos de autorização de comandos que reutilizam as listas de permissões de remetentes dos canais de mensagens

A compatibilidade de cada canal depende de ele estar integrado aos auxiliares compartilhados de autorização de remetentes do OpenClaw. A compatibilidade incluída atualmente abrange ClickClack, Discord, Feishu, Google Chat, iMessage, IRC, LINE, Mattermost, Microsoft Teams, Nextcloud Talk, Nostr, QQ Bot, Signal, Slack, SMS, Telegram, WhatsApp, Zalo e Zalo Personal. Grupos estáticos `message.senders` são independentes de canal; portanto, novos canais de mensagens passam a ser compatíveis com eles ao usar os auxiliares compartilhados de entrada do SDK de plugins, em vez de uma expansão personalizada da lista de permissões.

## Públicos de canais do Discord

O Discord também aceita um tipo dinâmico de grupo de acesso:

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

`discord.channelAudience` significa "permitir remetentes de mensagens diretas do Discord que atualmente podem visualizar este canal do servidor". O OpenClaw resolve o remetente por meio do Discord no momento da autorização e aplica as regras da permissão `ViewChannel` do Discord. `membership` é opcional e usa `canViewChannel` como padrão.

Use isso quando um canal do Discord já for a fonte de verdade para uma equipe, como `#maintainers` ou `#on-call`.

Requisitos e comportamento em caso de falha:

- O bot precisa ter acesso ao servidor e ao canal.
- O bot precisa da opção **Server Members Intent** do Discord Developer Portal.
- O grupo de acesso nega o acesso em caso de falha quando o Discord retorna `Missing Access`, quando não é possível resolver o remetente como membro do servidor ou quando o canal pertence a outro servidor.

Mais exemplos específicos do Discord: [Controle de acesso do Discord](/pt-BR/channels/discord#access-control-and-routing)

## Diagnósticos de plugins

Autores de plugins podem inspecionar o estado estruturado dos grupos de acesso sem expandi-lo novamente em uma lista de permissões simples:

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

O resultado informa os grupos referenciados, correspondentes, ausentes, não compatíveis e com falha. Use-o para diagnósticos ou testes de conformidade. Use `expandAllowFromWithAccessGroups(...)` somente em caminhos de compatibilidade que ainda esperam um array `allowFrom` simples.

## Observações de segurança

- Grupos de acesso são aliases de listas de permissões, não funções. Eles não criam proprietários, aprovam solicitações de pareamento nem concedem permissões de ferramentas por si mesmos.
- `dmPolicy: "open"` ainda exige `"*"` na lista de permissões efetiva de mensagens diretas. Referenciar um grupo de acesso não equivale a conceder acesso público.
- Nomes de grupos ausentes negam o acesso. Se `allowFrom` contiver `accessGroup:operators` e `accessGroups.operators` estiver ausente, essa entrada não autorizará ninguém.
- Mantenha os ids dos canais estáveis. Prefira ids numéricos/de usuários a nomes de exibição quando o canal aceitar ambos.

## Solução de problemas

Se um remetente deveria corresponder, mas estiver bloqueado:

1. Confirme que o campo da lista de permissões contém a referência exata `accessGroup:<name>`.
2. Confirme que `accessGroups.<name>.type` está correto.
3. Confirme que o id do remetente está listado sob a chave do canal correspondente ou sob `"*"`.
4. Confirme que a entrada usa a sintaxe normal da lista de permissões desse canal.
5. Para públicos de canais do Discord, confirme que o bot consegue visualizar o canal do servidor e que Server Members Intent está habilitado.

Execute `openclaw doctor` depois de editar a configuração de controle de acesso. Ele detecta muitas combinações inválidas de listas de permissões e políticas antes da execução.
