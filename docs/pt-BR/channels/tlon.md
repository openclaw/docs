---
read_when:
    - Trabalhando nos recursos do canal Tlon/Urbit
summary: Status de suporte, recursos e configuração do Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-05-02T22:16:32Z"
    model: gpt-5.5
    provider: openai
    source_hash: 30915170786fc1ee8b84fb8be2ea42280262923064cfa9ca7107036096a13add
    source_path: channels/tlon.md
    workflow: 16
---

O Tlon é um mensageiro descentralizado criado sobre o Urbit. O OpenClaw se conecta à sua nave Urbit e pode
responder a mensagens diretas e mensagens de chat em grupo. Respostas em grupo exigem uma menção @ por padrão e podem
ser ainda mais restritas por listas de permissão.

Status: Plugin incluído. Mensagens diretas, menções em grupo, respostas em threads, formatação de rich text e
uploads de imagens são compatíveis. Reações e enquetes ainda não são compatíveis.

## Plugin incluído

O Tlon é distribuído como um Plugin incluído nas versões atuais do OpenClaw, então builds empacotados
normais não precisam de uma instalação separada.

Se você estiver em uma build mais antiga ou em uma instalação personalizada que exclui o Tlon, instale um
pacote npm atual:

Instale via CLI (registro npm):

```bash
openclaw plugins install @openclaw/tlon
```

Use o pacote sem versão fixa para acompanhar a tag de versão oficial atual. Fixe uma versão exata
somente quando precisar de uma instalação reproduzível.

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração

1. Verifique se o Plugin Tlon está disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Reúna a URL da sua nave e o código de login.
3. Configure `channels.tlon`.
4. Reinicie o Gateway.
5. Envie uma mensagem direta para o bot ou mencione-o em um canal de grupo.

Configuração mínima (conta única):

```json5
{
  channels: {
    tlon: {
      enabled: true,
      ship: "~sampel-palnet",
      url: "https://your-ship-host",
      code: "lidlut-tabwed-pillex-ridrup",
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Naves privadas/LAN

Por padrão, o OpenClaw bloqueia nomes de host e intervalos de IP privados/internos para proteção contra SSRF.
Se sua nave estiver em execução em uma rede privada (localhost, IP de LAN ou nome de host interno),
você precisa habilitar isso explicitamente:

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

⚠️ Habilite isso somente se você confiar na sua rede local. Esta configuração desativa as proteções contra SSRF
para solicitações à URL da sua nave.

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

Desabilite a descoberta automática:

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

Lista de permissão de mensagens diretas (vazia = nenhuma mensagem direta permitida, use `ownerShip` para fluxo de aprovação):

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

## Proprietário e sistema de aprovação

Defina uma nave proprietária para receber solicitações de aprovação quando usuários não autorizados tentarem interagir:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

A nave proprietária é **automaticamente autorizada em todos os lugares** — convites de mensagem direta são aceitos automaticamente e
mensagens de canal são sempre permitidas. Você não precisa adicionar o proprietário a `dmAllowlist` ou
`defaultAuthorizedShips`.

Quando definida, a nave proprietária recebe notificações por mensagem direta para:

- Solicitações de mensagem direta de naves que não estão na lista de permissão
- Menções em canais sem autorização
- Solicitações de convite para grupo

## Configurações de aceitação automática

Aceitar automaticamente convites de mensagem direta (para naves em dmAllowlist):

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

Use estes com `openclaw message send` ou entrega por cron:

- Mensagem direta: `~sampel-palnet` ou `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` ou `group:~host-ship/channel`

## Skill incluída

O Plugin Tlon inclui uma Skill incluída ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
que fornece acesso via CLI a operações do Tlon:

- **Contatos**: obter/atualizar perfis, listar contatos
- **Canais**: listar, criar, publicar mensagens, buscar histórico
- **Grupos**: listar, criar, gerenciar membros
- **Mensagens diretas**: enviar mensagens, reagir a mensagens
- **Reações**: adicionar/remover reações de emoji em publicações e mensagens diretas
- **Configurações**: gerenciar permissões do Plugin via comandos de barra

A Skill fica disponível automaticamente quando o Plugin é instalado.

## Capacidades

| Recurso          | Status                                           |
| ---------------- | ------------------------------------------------ |
| Mensagens diretas | ✅ Compatível                                    |
| Grupos/canais    | ✅ Compatível (exige menção por padrão)          |
| Threads          | ✅ Compatível (respostas automáticas na thread)  |
| Rich text        | ✅ Markdown convertido para o formato do Tlon    |
| Imagens          | ✅ Enviadas para o armazenamento do Tlon         |
| Reações          | ✅ Via [Skill incluída](#bundled-skill)          |
| Enquetes         | ❌ Ainda não compatível                          |
| Comandos nativos | ✅ Compatível (somente proprietário por padrão)  |

## Solução de problemas

Execute esta sequência primeiro:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Falhas comuns:

- **Mensagens diretas ignoradas**: remetente não está em `dmAllowlist` e nenhum `ownerShip` foi configurado para o fluxo de aprovação.
- **Mensagens de grupo ignoradas**: canal não descoberto ou remetente não autorizado.
- **Erros de conexão**: verifique se a URL da nave está acessível; habilite `allowPrivateNetwork` para naves locais.
- **Erros de autenticação**: verifique se o código de login está atual (códigos são rotacionados).

## Referência de configuração

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.tlon.enabled`: habilita/desabilita a inicialização do canal.
- `channels.tlon.ship`: nome da nave Urbit do bot (por exemplo, `~sampel-palnet`).
- `channels.tlon.url`: URL da nave (por exemplo, `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: código de login da nave.
- `channels.tlon.allowPrivateNetwork`: permite URLs localhost/LAN (desvio de SSRF).
- `channels.tlon.ownerShip`: nave proprietária para o sistema de aprovação (sempre autorizada).
- `channels.tlon.dmAllowlist`: naves com permissão para enviar mensagem direta (vazia = nenhuma).
- `channels.tlon.autoAcceptDmInvites`: aceita automaticamente mensagens diretas de naves na lista de permissão.
- `channels.tlon.autoAcceptGroupInvites`: aceita automaticamente todos os convites de grupo.
- `channels.tlon.autoDiscoverChannels`: descobre automaticamente canais de grupo (padrão: true).
- `channels.tlon.groupChannels`: ninhos de canais fixados manualmente.
- `channels.tlon.defaultAuthorizedShips`: naves autorizadas para todos os canais.
- `channels.tlon.authorization.channelRules`: regras de autenticação por canal.
- `channels.tlon.showModelSignature`: acrescenta o nome do modelo às mensagens.

## Observações

- Respostas em grupo exigem uma menção (por exemplo, `~your-bot-ship`) para responder.
- Respostas em threads: se a mensagem recebida estiver em uma thread, o OpenClaw responde na thread.
- Rich text: a formatação Markdown (negrito, itálico, código, cabeçalhos, listas) é convertida para o formato nativo do Tlon.
- Imagens: URLs são enviadas para o armazenamento do Tlon e incorporadas como blocos de imagem.

## Relacionado

- [Visão geral de canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por mensagem direta e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e exigência de menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e fortalecimento
