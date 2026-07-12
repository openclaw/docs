---
read_when:
    - Trabalhando nos recursos do canal Tlon/Urbit
summary: Status do suporte, recursos e configuração do Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-07-12T14:56:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: d53ea7d97a7445910c5692a247758b652e1fce82793e65950e1e21a10fa16813
    source_path: channels/tlon.md
    workflow: 16
---

Tlon é um mensageiro descentralizado desenvolvido sobre o Urbit. O OpenClaw se conecta à sua nave Urbit e
responde a mensagens diretas e mensagens de chats em grupo. Por padrão, as respostas em grupo exigem uma menção com @, com
regras de autorização e um fluxo de aprovação do proprietário implementados adicionalmente.

Status: plugin incluído. Há suporte a mensagens diretas, menções em grupos, threads, rich text, upload/download de imagens e um
sistema de aprovação do proprietário. Não há suporte a reações nem enquetes.

## Plugin incluído

O Tlon é incluído nas versões atuais do OpenClaw; builds empacotados não precisam de uma instalação separada.

Em um build mais antigo ou em uma instalação personalizada que não o inclua, instale pelo npm:

```bash
openclaw plugins install @openclaw/tlon
```

Use apenas o nome do pacote para acompanhar a tag da versão atual. Fixe uma versão (`@openclaw/tlon@x.y.z`)
somente para instalações reproduzíveis.

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
      ownerShip: "~your-main-ship", // recomendado: sua nave, sempre autorizada
    },
  },
}
```

Reinicie o Gateway após editar a configuração diretamente. Em seguida, envie uma mensagem direta ao bot ou mencione-o com @ em um
canal de grupo.

## Naves privadas/da LAN

Por padrão, o OpenClaw bloqueia nomes de host e intervalos de IP privados/internos para proteção contra SSRF. Se a sua
nave for executada em uma rede privada (localhost, IP da LAN, nome de host interno), habilite isso explicitamente:

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
`http://my-ship.local:8080`. Habilite isso somente para uma URL de nave em que você confia; essa opção desabilita a proteção contra SSRF
para as solicitações HTTP dessa conta.

<Note>
`channels.tlon.allowPrivateNetwork` (chave simples) foi descontinuada. `openclaw doctor --fix` a move para
`channels.tlon.network.dangerouslyAllowPrivateNetwork` automaticamente.
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

`autoDiscoverChannels` tem como padrão `false` quando não está definido na configuração; o assistente de configuração apresenta
sim como resposta padrão e grava `true` explicitamente. Quando essa opção está ativada, o OpenClaw consulta os grupos dos quais participa na inicialização,
monitora novos canais conforme os convites para grupos são aceitos e verifica novamente a cada 2 minutos.

## Controle de acesso

Lista de permissões para mensagens diretas (vazia = nenhuma mensagem direta é permitida, a menos que o remetente seja `ownerShip`):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Por padrão, a autorização de grupos é `restricted` em cada canal. Defina `defaultAuthorizedShips` para estabelecer uma
linha de base e substitua-a em cada nest de canal:

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

Depois que o bot responde dentro de uma thread, ele continua respondendo às mensagens posteriores nessa thread
sem exigir outra menção.

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

A nave do proprietário está autorizada em todos os lugares: convites para MD são sempre aceitos automaticamente, convites para grupos são
sempre aceitos automaticamente e mensagens em canais sempre passam pela autorização. O proprietário não precisa
estar em `dmAllowlist`, `defaultAuthorizedShips` nem `groupInviteAllowlist`.

Quando `ownerShip` está definido, solicitações não autorizadas não são simplesmente descartadas — elas entram em uma fila de
aprovações pendentes e uma MD é enviada ao proprietário:

- Solicitações de MD de naves que não estão em `dmAllowlist`
- Menções em canais nos quais o remetente não passa pela autorização
- Convites para grupos de naves que não estão em `groupInviteAllowlist` (quando a aceitação automática está desativada ou está ativada, mas o
  remetente do convite não está na lista de permissões)

O proprietário responde por MD para agir sobre uma solicitação:

| Resposta do proprietário     | Efeito                                                                     |
| ---------------------------- | -------------------------------------------------------------------------- |
| `approve` / `deny` / `block` | Atua sobre a aprovação pendente mais recente                               |
| `approve <id>` / `deny <id>` | Atua sobre uma aprovação específica por id                                 |
| `block`                      | Também bloqueia a nave nativamente para que ela não possa se reconectar     |
| `unblock ~ship`              | Reverte um bloqueio nativo                                                  |
| `blocked`                    | Lista as naves atualmente bloqueadas                                        |
| `pending`                    | Lista as solicitações de aprovação pendentes                                |

Sem `ownerShip` configurado, MDs e menções em canais não autorizadas são simplesmente descartadas e registradas;
não há solicitação de aprovação.

## Configurações de aceitação automática

Aceite automaticamente convites para MD de naves que já estejam em `dmAllowlist` (o proprietário sempre é aceito automaticamente,
independentemente deste sinalizador):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Aceite automaticamente convites para grupos de uma lista de permissões (falha de modo fechado: com `autoAcceptGroupInvites: true` e
uma `groupInviteAllowlist` vazia, nenhum convite que não seja do proprietário é aceito):

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

## Recarga dinâmica por meio do armazenamento de configurações do Urbit

A maioria das configurações acima (`dmAllowlist`, `groupInviteAllowlist`, `groupChannels`,
`defaultAuthorizedShips`, `autoDiscoverChannels`, `autoAcceptDmInvites`,
`autoAcceptGroupInvites`, `ownerShip`, `showModelSignature`) é espelhada no agente
`%settings` da nave (desk `moltbot`, bucket `tlon`) na primeira execução e, depois, lida dinamicamente de lá,
portanto, as alterações feitas por meio de um cliente Landscape ou dos comandos de configuração da skill incluída são aplicadas sem
reiniciar o Gateway. `channelRules` e as aprovações pendentes também são persistidas ali como JSON. A configuração em
arquivo permanece a fonte da verdade para valores que nunca foram gravados no armazenamento de configurações.

## Destinos de entrega (CLI/cron)

Use com `openclaw message send` ou entrega por cron:

- MD: `~sampel-palnet` ou `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` ou `group:~host-ship/channel`

## Skill incluída

O plugin inclui [`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill), uma CLI para
operações diretas no Urbit, disponível automaticamente após a instalação do plugin:

- **Atividade**: menções, respostas, itens não lidos
- **Canais**: listar, criar, renomear
- **Contatos**: listar/obter/atualizar perfis
- **Grupos**: criar, entrar, fluxos de convite/solicitação, funções
- **Hooks**: gerenciar hooks de canais
- **Mensagens**: histórico, pesquisa
- **Mensagens diretas**: enviar, reagir, aceitar/recusar
- **Publicações**: reagir, excluir
- **Caderno**: publicar em canais de diário
- **Configurações**: recarregar a configuração do plugin sem reinicialização por meio do armazenamento de configurações acima

## Recursos

| Recurso           | Status                                                   |
| ----------------- | -------------------------------------------------------- |
| Mensagens diretas | Compatível                                               |
| Grupos/canais     | Compatível (exige menção por padrão)                     |
| Threads           | Compatível (continua respondendo após entrar)            |
| Texto formatado   | Markdown convertido para o formato nativo do Tlon        |
| Imagens           | Baixadas ao receber, enviadas ao transmitir               |
| Reações           | Somente por meio da [skill incluída](#bundled-skill)      |
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

- **MDs ignoradas**: o remetente não está em `dmAllowlist` e nenhuma `ownerShip` está configurada para o fluxo de aprovação.
- **Mensagens de grupo ignoradas**: o canal não foi descoberto/fixado, ou o remetente não passa na autorização e não há
  `ownerShip` para colocar uma aprovação na fila.
- **Erros de conexão**: verifique se a URL da ship está acessível; defina
  `network.dangerouslyAllowPrivateNetwork` para ships locais.
- **Erros de autenticação**: os códigos de login são alternados — copie o código atual da sua ship.

## Referência de configuração

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

| Chave                                                    | Significado                                                        |
| ------------------------------------------------------ | -------------------------------------------------------------- |
| `channels.tlon.enabled`                                | Ativa/desativa a inicialização do canal.                                |
| `channels.tlon.ship`                                   | Nome da nave Urbit do bot (por exemplo, `~sampel-palnet`).                 |
| `channels.tlon.url`                                    | URL da nave (por exemplo, `https://sampel-palnet.tlon.network`).          |
| `channels.tlon.code`                                   | Código de login da nave.                                               |
| `channels.tlon.network.dangerouslyAllowPrivateNetwork` | Permite URLs de naves em localhost/LAN (adesão explícita a SSRF).                   |
| `channels.tlon.ownerShip`                              | Nave proprietária: sempre autorizada, recebe solicitações de aprovação.     |
| `channels.tlon.dmAllowlist`                            | Naves autorizadas a enviar mensagens diretas (vazio = nenhuma além da proprietária).              |
| `channels.tlon.autoAcceptDmInvites`                    | Aceita automaticamente mensagens diretas de naves em `dmAllowlist`.                   |
| `channels.tlon.autoAcceptGroupInvites`                 | Aceita automaticamente convites para grupos de `groupInviteAllowlist`.         |
| `channels.tlon.groupInviteAllowlist`                   | Naves cujos convites para grupos são aceitos automaticamente.                   |
| `channels.tlon.autoDiscoverChannels`                   | Descobre automaticamente canais de grupos ingressados (padrão: `false`).        |
| `channels.tlon.groupChannels`                          | Ninhos de canais fixados manualmente.                                 |
| `channels.tlon.defaultAuthorizedShips`                 | Naves autorizadas para todos os canais (usado quando nenhuma regra corresponde). |
| `channels.tlon.authorization.channelRules`             | Modo de autorização e lista de permissões por ninho de canal.                        |
| `channels.tlon.showModelSignature`                     | Anexa `_[Generated by <model>]_` às respostas.                  |
| `channels.tlon.responsePrefix`                         | Prefixo estático adicionado antes das respostas de saída.                   |
| `channels.tlon.accounts.<id>`                          | Contas nomeadas adicionais (configurações com várias naves).                 |

## Observações

- As respostas em grupo precisam de uma menção @ (por exemplo, `~your-bot-ship`), a menos que o bot já tenha participado dessa thread.
- As respostas a uma thread são publicadas nela; o bot também recebe as últimas 10 mensagens do contexto da thread, adicionadas no início
  para o agente.
- O texto rico (negrito, itálico, código, cabeçalhos, listas) é convertido para o formato nativo do Tlon.
- O envio de uma mensagem recebida que solicita um resumo do canal (por exemplo, "resuma este
  canal") aciona um resumo de histórico integrado em vez do fluxo normal de resposta.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chats em grupo e exigência de menções
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessões para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção adicional
