---
read_when:
    - Trabalhando em recursos do canal Tlon/Urbit
summary: Status do suporte ao Tlon/Urbit, capacidades e configuração
title: Tlon
x-i18n:
    generated_at: "2026-04-24T05:43:04Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1ff92473a958a4cba355351a686431748ea801b1c640cc5873e8bdac8f37a53f
    source_path: channels/tlon.md
    workflow: 15
---

Tlon é um mensageiro descentralizado construído sobre Urbit. O OpenClaw se conecta à sua ship Urbit e pode
responder a DMs e mensagens de chat em grupo. Respostas em grupo exigem uma menção com @ por padrão e podem
ser ainda mais restritas por meio de allowlists.

Status: Plugin empacotado. DMs, menções em grupo, respostas em thread, formatação de rich text e
upload de imagens são compatíveis. Reações e enquetes ainda não são compatíveis.

## Plugin empacotado

O Tlon é distribuído como um Plugin empacotado nas versões atuais do OpenClaw, portanto builds
empacotadas normais não precisam de uma instalação separada.

Se você estiver em uma build mais antiga ou em uma instalação personalizada que exclui o Tlon, instale-o
manualmente:

Instalar via CLI (registro npm):

```bash
openclaw plugins install @openclaw/tlon
```

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração

1. Certifique-se de que o Plugin Tlon esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Obtenha a URL da sua ship e o código de login.
3. Configure `channels.tlon`.
4. Reinicie o gateway.
5. Envie uma DM ao bot ou mencione-o em um canal de grupo.

Configuração mínima (conta única):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recomendado: sua ship, sempre permitida
    },
  },
}
```

## Ships privadas/LAN

Por padrão, o OpenClaw bloqueia nomes de host privados/internos e intervalos de IP para proteção contra SSRF.
Se sua ship estiver em execução em uma rede privada (localhost, IP da LAN ou nome de host interno),
você deve aderir explicitamente:

```json5
{
  channels: {
    tlon: {
      url: "http://localhost:8080",
      allowPrivateNetwork: true,
    },
  },
}
```

Isso se aplica a URLs como:

- `http://localhost:8080`
- `http://192.168.x.x:8080`
- `http://my-ship.local:8080`

⚠️ Habilite isso apenas se você confiar na sua rede local. Essa configuração desabilita as proteções contra SSRF
para requisições à URL da sua ship.

## Canais de grupo

A descoberta automática é habilitada por padrão. Você também pode fixar canais manualmente:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Desabilitar descoberta automática:

```json5
{
  channels: {
    tlon: {
      autoDiscoverChannels: false,
    },
  },
}
```

## Controle de acesso

Allowlist de DM (vazia = nenhuma DM permitida, use `ownerShip` para o fluxo de aprovação):

```json5
{
  channels: {
    tlon: {
      dmAllowlist: ["~zod", "~nec"],
    },
  },
}
```

Autorização de grupo (restrita por padrão):

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

## Dono e sistema de aprovação

Defina uma ship proprietária para receber solicitações de aprovação quando usuários não autorizados tentarem interagir:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

A ship proprietária é **automaticamente autorizada em todos os lugares** — convites de DM são aceitos automaticamente e
mensagens de canal são sempre permitidas. Você não precisa adicionar o dono a `dmAllowlist` ou
`defaultAuthorizedShips`.

Quando definida, a ship proprietária recebe notificações por DM para:

- Solicitações de DM de ships que não estão na allowlist
- Menções em canais sem autorização
- Solicitações de convite para grupo

## Configurações de aceitação automática

Aceitar automaticamente convites de DM (para ships em `dmAllowlist`):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Aceitar automaticamente convites de grupo:

```json5
{
  channels: {
    tlon: {
      autoAcceptGroupInvites: true,
    },
  },
}
```

## Destinos de entrega (CLI/Cron)

Use estes com `openclaw message send` ou entrega por Cron:

- DM: `~sampel-palnet` ou `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` ou `group:~host-ship/channel`

## Skill empacotada

O Plugin Tlon inclui uma Skill empacotada ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
que fornece acesso via CLI a operações do Tlon:

- **Contatos**: obter/atualizar perfis, listar contatos
- **Canais**: listar, criar, publicar mensagens, buscar histórico
- **Grupos**: listar, criar, gerenciar membros
- **DMs**: enviar mensagens, reagir a mensagens
- **Reações**: adicionar/remover reações com emoji a posts e DMs
- **Configurações**: gerenciar permissões de Plugin por comandos slash

A Skill fica automaticamente disponível quando o Plugin é instalado.

## Capacidades

| Recurso         | Status                                     |
| ---------------- | ------------------------------------------ |
| Mensagens diretas | ✅ Compatível                              |
| Grupos/canais    | ✅ Compatível (com exigência de menção por padrão) |
| Threads          | ✅ Compatível (respostas automáticas na thread) |
| Rich text        | ✅ Markdown convertido para o formato do Tlon |
| Imagens          | ✅ Enviadas para o armazenamento do Tlon   |
| Reações          | ✅ Via [Skill empacotada](#bundled-skill)  |
| Enquetes         | ❌ Ainda não compatível                    |
| Comandos nativos | ✅ Compatível (somente dono por padrão)    |

## Solução de problemas

Execute esta sequência primeiro:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Falhas comuns:

- **DMs ignoradas**: remetente não está em `dmAllowlist` e nenhum `ownerShip` foi configurado para fluxo de aprovação.
- **Mensagens de grupo ignoradas**: canal não descoberto ou remetente não autorizado.
- **Erros de conexão**: verifique se a URL da ship está acessível; habilite `allowPrivateNetwork` para ships locais.
- **Erros de autenticação**: verifique se o código de login ainda está atual (os códigos são rotacionados).

## Referência de configuração

Configuração completa: [Configuration](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.tlon.enabled`: habilitar/desabilitar inicialização do canal.
- `channels.tlon.ship`: nome da ship Urbit do bot (por exemplo, `~sampel-palnet`).
- `channels.tlon.url`: URL da ship (por exemplo, `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: código de login da ship.
- `channels.tlon.allowPrivateNetwork`: permitir URLs localhost/LAN (bypass de SSRF).
- `channels.tlon.ownerShip`: ship proprietária para o sistema de aprovação (sempre autorizada).
- `channels.tlon.dmAllowlist`: ships autorizadas a enviar DM (vazia = nenhuma).
- `channels.tlon.autoAcceptDmInvites`: aceitar automaticamente DMs de ships na allowlist.
- `channels.tlon.autoAcceptGroupInvites`: aceitar automaticamente todos os convites de grupo.
- `channels.tlon.autoDiscoverChannels`: descobrir automaticamente canais de grupo (padrão: true).
- `channels.tlon.groupChannels`: nests de canal fixados manualmente.
- `channels.tlon.defaultAuthorizedShips`: ships autorizadas para todos os canais.
- `channels.tlon.authorization.channelRules`: regras de autenticação por canal.
- `channels.tlon.showModelSignature`: anexar o nome do modelo às mensagens.

## Observações

- Respostas em grupo exigem uma menção (por exemplo, `~your-bot-ship`) para responder.
- Respostas em thread: se a mensagem de entrada estiver em uma thread, o OpenClaw responde na thread.
- Rich text: a formatação Markdown (negrito, itálico, código, cabeçalhos, listas) é convertida para o formato nativo do Tlon.
- Imagens: URLs são enviadas para o armazenamento do Tlon e incorporadas como blocos de imagem.

## Relacionados

- [Channels Overview](/pt-BR/channels) — todos os canais compatíveis
- [Pairing](/pt-BR/channels/pairing) — autenticação de DM e fluxo de pareamento
- [Groups](/pt-BR/channels/groups) — comportamento de chat em grupo e exigência de menção
- [Channel Routing](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Security](/pt-BR/gateway/security) — modelo de ameaça e hardening
