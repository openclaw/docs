---
read_when:
    - Configurando a mesma lista de permissões em vários canais de mensagens
    - Regras de acesso para compartilhamento de remetentes em mensagens diretas e grupos
    - Revisando o controle de acesso ao canal de mensagens
summary: Listas de permissões de remetentes reutilizáveis para canais de mensagens
title: Grupos de acesso
x-i18n:
    generated_at: "2026-05-02T05:41:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: fc7bc1d4fb80e5c5d4e72b190d49821aa93ced575eafcf89864ac800e8558f94
    source_path: channels/access-groups.md
    workflow: 16
---

Grupos de acesso são listas nomeadas de remetentes que você define uma vez e referencia nas listas de permissão de canais com `accessGroup:<name>`.

Use-os quando as mesmas pessoas devem ser permitidas em vários canais de mensagem, ou quando um conjunto confiável deve se aplicar tanto à autorização de remetentes em DMs quanto em grupos.

Grupos de acesso não concedem acesso por si só. Um grupo só importa quando um campo de lista de permissão o referencia.

## Grupos estáticos de remetentes de mensagem

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

As listas de membros são indexadas pelo id do canal de mensagem:

| Chave      | Significado                                                                 |
| ---------- | --------------------------------------------------------------------------- |
| `"*"`      | Entradas compartilhadas verificadas para cada canal de mensagem que referencia o grupo. |
| `discord`  | Entradas verificadas somente para correspondência da lista de permissão do Discord. |
| `telegram` | Entradas verificadas somente para correspondência da lista de permissão do Telegram. |
| `whatsapp` | Entradas verificadas somente para correspondência da lista de permissão do WhatsApp. |

As entradas são correspondidas pelas regras normais de `allowFrom` do canal de destino. A OpenClaw não traduz ids de remetentes entre canais. Se Alice tiver um id do Telegram e um id do Discord, liste ambos os ids nas chaves apropriadas.

## Referenciar grupos em listas de permissão

Referencie um grupo com `accessGroup:<name>` em qualquer lugar em que o caminho do canal de mensagem ofereça suporte a listas de permissão de remetentes.

Exemplo de lista de permissão para DM:

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

## Caminhos de canais de mensagem compatíveis

Grupos de acesso estão disponíveis em caminhos compartilhados de autorização de canais de mensagem, incluindo:

- listas de permissão de remetentes de DM, como `channels.<channel>.allowFrom`
- listas de permissão de remetentes de grupo, como `channels.<channel>.groupAllowFrom`
- listas de permissão de remetentes por sala específicas do canal que usam as mesmas regras de correspondência de remetente
- caminhos de autorização de comandos que reutilizam listas de permissão de remetentes de canais de mensagem

O suporte do canal depende de esse canal estar conectado aos auxiliares compartilhados de autorização de remetente da OpenClaw. O suporte atual incluído no pacote inclui Discord, Google Chat, Nostr, WhatsApp, Zalo e Zalo Personal. Grupos estáticos `message.senders` são projetados para serem independentes de canal, então novos canais de mensagem devem oferecer suporte a eles usando os auxiliares compartilhados do SDK de Plugin em vez de expansão personalizada da lista de permissão.

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

`discord.channelAudience` significa "permitir remetentes de DM do Discord que podem visualizar este canal do servidor atualmente." A OpenClaw resolve o remetente pelo Discord no momento da autorização e aplica as regras de permissão `ViewChannel` do Discord.

Use isso quando um canal do Discord já for a fonte da verdade para uma equipe, como `#maintainers` ou `#on-call`.

Requisitos e comportamento de falha:

- O bot precisa de acesso ao servidor e ao canal.
- O bot precisa da **Intenção de membros do servidor** no Portal de Desenvolvedores do Discord.
- O grupo de acesso falha fechado quando o Discord retorna `Missing Access`, o remetente não pode ser resolvido como membro do servidor, ou o canal pertence a outro servidor.

Mais exemplos específicos do Discord: [Controle de acesso do Discord](/pt-BR/channels/discord#access-control-and-routing)

## Observações de segurança

- Grupos de acesso são aliases de listas de permissão, não funções. Eles não criam proprietários, aprovam solicitações de emparelhamento nem concedem permissões de ferramentas por si só.
- `dmPolicy: "open"` ainda exige `"*"` na lista de permissão efetiva de DM. Referenciar um grupo de acesso não é o mesmo que acesso público.
- Nomes de grupo ausentes falham fechados. Se `allowFrom` contiver `accessGroup:operators` e `accessGroups.operators` estiver ausente, essa entrada não autoriza ninguém.
- Mantenha ids de canal estáveis. Prefira ids numéricos/de usuário a nomes de exibição quando o canal oferecer suporte a ambos.

## Solução de problemas

Se um remetente deveria corresponder, mas está bloqueado:

1. Confirme que o campo da lista de permissão contém a referência exata `accessGroup:<name>`.
2. Confirme que `accessGroups.<name>.type` está correto.
3. Confirme que o id do remetente está listado na chave de canal correspondente, ou em `"*"`.
4. Confirme que a entrada usa a sintaxe normal de lista de permissão desse canal.
5. Para públicos de canais do Discord, confirme que o bot consegue ver o canal do servidor e tem a Intenção de membros do servidor habilitada.

Execute `openclaw doctor` depois de editar a configuração de controle de acesso. Ele detecta muitas combinações inválidas de listas de permissão e políticas antes do tempo de execução.
