---
read_when:
    - Trabalhando nos recursos do canal Tlon/Urbit
summary: Status do suporte, recursos e configuração do Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-07-11T23:45:18Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon é um mensageiro descentralizado criado sobre o Urbit. O OpenClaw se conecta à sua nave Urbit e
responde a mensagens diretas e mensagens de chats em grupo. Por padrão, respostas em grupo exigem
uma menção com @, além de regras de autorização e um fluxo de aprovação pelo proprietário.

Status: plugin incluído. Há suporte a mensagens diretas, menções em grupos, threads, rich text,
upload/download de imagens e um sistema de aprovação pelo proprietário. Não há suporte a reações
nem enquetes.

## Plugin incluído

O Tlon vem incluído nas versões atuais do OpenClaw; compilações empacotadas não precisam de uma
instalação separada.

Em uma compilação mais antiga ou instalação personalizada que não o inclua, instale-o pelo npm:

```bash
openclaw plugins install @openclaw/tlon
```

Use somente o nome do pacote para acompanhar a tag da versão atual. Fixe uma versão
(`@openclaw/tlon@x.y.z`) apenas para instalações reproduzíveis.

A partir de um checkout local:

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração

```bash
openclaw channels add --channel tlon --ship ~sampel-palnet --url https://your-ship-host --code lidlut-tabwed-pillex-ridrup
```

Ou edite a configuração diretamente:

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always authorized
    },
  },
}
```

Reinicie o Gateway após editar a configuração diretamente. Em seguida, envie uma mensagem direta
ao bot ou mencione-o com @ em um canal de grupo.

## Naves privadas/LAN

Por padrão, o OpenClaw bloqueia nomes de host e intervalos de IP privados/internos para proteção
contra SSRF. Se sua nave for executada em uma rede privada (localhost, IP da LAN, nome de host
interno), habilite isso explicitamente:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      network: {
        dangerouslyAllowPrivateNetwork: true,
      },
    },
  },
}
```

Aplica-se a destinos como `http://localhost:8080`, `http://192.168.x.x:8080` e
`http://my-ship.local:8080`. Habilite isso apenas para uma URL de nave em que você confia; essa
opção desativa a proteção contra SSRF nas solicitações HTTP dessa conta.

<Note>
`channels.tlon.allowPrivateNetwork` (chave simples) foi descontinuada. `openclaw doctor --fix` a
move automaticamente para `channels.tlon.network.dangerouslyAllowPrivateNetwork`.
</Note>

## Canais de grupo

Fixe os canais manualmente ou ative a descoberta automática:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
      autoDiscoverChannels: true,
    },
  },
}
```

Quando não definido na configuração, `autoDiscoverChannels` assume `false`; o assistente de
configuração apresenta sim como resposta padrão e grava `true` explicitamente. Quando ativado, o
OpenClaw consulta os grupos ingressados na inicialização, monitora novos canais à medida que
convites para grupos são aceitos e verifica novamente a cada 2 minutos.

## Controle de acesso

Lista de permissões para mensagens diretas (vazia = nenhuma mensagem direta permitida, exceto
quando o remetente é `ownerShip`):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Por padrão, a autorização de grupos é `restricted` para cada canal. Defina
`defaultAuthorizedShips` como base e substitua-a para cada nest de canal:

```json5
{
  channels: {
    tlon: {
      defaultAuthorizedShips: ["~zod"],
      authorization: {
        channelRules: {
          "chat/~host-ship/general": {
            mode: "restricted",
            allowedShips: ["~zod", "~nec"],
          },
          "chat/~host-ship/announcements": {
            mode: "open",
          },
        },
      },
    },
  },
}
```

Depois que o bot responde em uma thread, ele continua respondendo às mensagens posteriores nessa
thread sem exigir outra menção.

## Sistema de proprietário e aprovação

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

A nave proprietária é autorizada em todos os lugares: convites para mensagens diretas sempre são
aceitos automaticamente, convites para grupos sempre são aceitos automaticamente e mensagens nos
canais sempre passam pela autorização. O proprietário não precisa estar em `dmAllowlist`,
`defaultAuthorizedShips` nem `groupInviteAllowlist`.

Quando `ownerShip` está definido, solicitações não autorizadas não são simplesmente descartadas:
elas entram em uma fila de aprovações pendentes e uma mensagem direta é enviada ao proprietário:

- Solicitações de mensagens diretas de naves que não estão em `dmAllowlist`
- Menções em canais nos quais o remetente não passa pela autorização
- Convites para grupos de naves que não estão em `groupInviteAllowlist` (quando a aceitação
  automática está desativada ou está ativada, mas o remetente do convite não consta na lista de
  permissões)

O proprietário responde por mensagem direta para tomar uma ação sobre uma solicitação:

| Resposta do proprietário     | Efeito                                                            |
| ---------------------------- | ----------------------------------------------------------------- |
| `approve` / `deny` / `block` | Atua sobre a aprovação pendente mais recente                      |
| `approve <id>` / `deny <id>` | Atua sobre uma aprovação específica pelo identificador            |
| `block`                      | Também bloqueia a nave nativamente para impedir que ela se reconecte |
| `unblock ~ship`              | Reverte um bloqueio nativo                                        |
| `blocked`                    | Lista as naves bloqueadas no momento                              |
| `pending`                    | Lista as solicitações de aprovação pendentes                      |

Sem `ownerShip` configurado, mensagens diretas e menções em canais não autorizadas são apenas
descartadas e registradas; não há solicitação de aprovação.

## Configurações de aceitação automática

Aceite automaticamente convites para mensagens diretas de naves que já estejam em `dmAllowlist`
(o proprietário sempre é aceito automaticamente, independentemente desta opção):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Aceite automaticamente convites para grupos com base em uma lista de permissões (falha de modo
fechado: com `autoAcceptGroupInvites: true` e uma `groupInviteAllowlist` vazia, nenhum convite que
não seja do proprietário é aceito):

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
      groupInviteAllowlist: ["~zod"],
    },
  },
}
```

## Recarga dinâmica pelo armazenamento de configurações do Urbit

A maioria das configurações acima (`dmAllowlist`, `groupInviteAllowlist`, `groupChannels`,
`defaultAuthorizedShips`, `autoDiscoverChannels`, `autoAcceptDmInvites`,
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) é espelhada no agente `%settings` da
nave (desk `moltbot`, bucket `tlon`) na primeira execução e depois lida dinamicamente a partir
dele. Assim, alterações feitas por um cliente Landscape ou pelos comandos de configuração da
habilidade incluída são aplicadas sem reiniciar o Gateway. `channelRules` e as aprovações
pendentes também são persistidas ali como JSON. A configuração em arquivo continua sendo a fonte
da verdade para valores nunca gravados no armazenamento de configurações.

## Destinos de entrega (CLI/Cron)

Use com `openclaw message send` ou com a entrega por Cron:

- Mensagem direta: `~sampel-palnet` ou `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` ou `group:~host-ship/channel`

## Habilidade incluída

O plugin inclui [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), uma CLI para
operações diretas no Urbit, disponível automaticamente após a instalação do plugin:

- **Atividade**: menções, respostas, itens não lidos
- **Canais**: listar, criar, renomear
- **Contatos**: listar/obter/atualizar perfis
- **Grupos**: criar, ingressar, fluxos de convite/solicitação, funções
- **Hooks**: gerenciar hooks de canais
- **Mensagens**: histórico, pesquisa
- **Mensagens diretas**: enviar, reagir, aceitar/recusar
- **Publicações**: reagir, excluir
- **Caderno**: publicar em canais de diário
- **Configurações**: recarregar dinamicamente a configuração do plugin pelo armazenamento de
  configurações descrito acima

## Recursos

| Recurso           | Status                                                   |
| ----------------- | -------------------------------------------------------- |
| Mensagens diretas | Compatível                                               |
| Grupos/canais     | Compatível (exige menção por padrão)                     |
| Threads           | Compatível (continua respondendo depois de ingressar)    |
| Rich text         | Markdown convertido para o formato nativo do Tlon        |
| Imagens           | Baixadas na entrada e enviadas na saída                   |
| Reações           | Somente pela [habilidade incluída](#bundled-skill)       |
| Enquetes          | Não compatível                                           |
| Comandos nativos  | Restritos ao proprietário por padrão                     |

## Solução de problemas

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Falhas comuns:

- **Mensagens diretas ignoradas**: o remetente não está em `dmAllowlist` e nenhum `ownerShip` foi
  configurado para o fluxo de aprovação.
- **Mensagens de grupo ignoradas**: o canal não foi descoberto/fixado ou o remetente não passa
  pela autorização e não há `ownerShip` para enfileirar uma aprovação.
- **Erros de conexão**: verifique se a URL da nave está acessível; defina
  `network.dangerouslyAllowPrivateNetwork` para naves locais.
- **Erros de autenticação**: os códigos de login mudam periodicamente; copie o código atual da sua
  nave.

## Referência de configuração

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

| Chave                                                  | Significado                                                        |
| ------------------------------------------------------ | ------------------------------------------------------------------ |
| `channels.tlon.enabled`                                | Ativa/desativa a inicialização do canal.                           |
| `channels.tlon.ship`                                   | Nome da nave Urbit do bot (por exemplo, `~sampel-palnet`).         |
| `channels.tlon.url`                                    | URL da nave (por exemplo, `https://sampel-palnet.tlon.network`).   |
| `channels.tlon.code`                                   | Código de login da nave.                                           |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Permite URLs de naves em localhost/LAN (adesão explícita a SSRF).  |
| `channels.tlon.ownerShip`                              | Nave proprietária: sempre autorizada e recebe solicitações de aprovação. |
| `channels.tlon.dmAllowlist`                            | Naves autorizadas a enviar mensagens diretas (vazia = nenhuma além do proprietário). |
| `channels.tlon.autoAcceptDmInvites`                    | Aceita automaticamente mensagens diretas de naves em `dmAllowlist`. |
| `channels.tlon.autoAcceptGroupInvites`                 | Aceita automaticamente convites para grupos de `groupInviteAllowlist`. |
| `channels.tlon.groupInviteAllowlist`                   | Naves cujos convites para grupos são aceitos automaticamente.      |
| `channels.tlon.autoDiscoverChannels`                   | Descobre automaticamente canais de grupos ingressados (padrão: `false`). |
| `channels.tlon.groupChannels`                          | Nests de canais fixados manualmente.                               |
| `channels.tlon.defaultAuthorizedShips`                 | Naves autorizadas em todos os canais (usado quando nenhuma regra corresponde). |
| `channels.tlon.authorization.channelRules`             | Modo de autenticação + lista de permissões por nest de canal.      |
| `channels.tlon.showModelSignature`                     | Acrescenta `_[Generated by <model>]_` às respostas.                |
| `channels.tlon.responsePrefix`                         | Prefixo estático acrescentado ao início das respostas de saída.    |
| `channels.tlon.accounts.<id>`                          | Contas adicionais nomeadas (configurações com várias naves).       |

## Observações

- Respostas em grupo precisam de uma menção com @ (por exemplo, `~your-bot-ship`), a menos que o
  bot já tenha ingressado nessa thread.
- Respostas a threads são enviadas dentro da própria thread; o bot também recebe as últimas 10
  mensagens do contexto da thread adicionadas antes da entrada do agente.
- Rich text (negrito, itálico, código, cabeçalhos e listas) é convertido para o formato nativo do
  Tlon.
- O envio de uma mensagem recebida que solicite um resumo do canal (por exemplo, "resuma este
  canal") aciona uma sumarização integrada do histórico em vez do fluxo normal de resposta.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — fluxo de autenticação e pareamento de mensagens diretas
- [Grupos](/pt-BR/channels/groups) — comportamento de chats em grupo e exigência de menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção
