---
read_when:
    - Trabalhando nos recursos do canal Tlon/Urbit
summary: Status de suporte, capacidades e configuração do Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-04-30T09:38:23Z"
    model: gpt-5.5
    provider: openai
    source_hash: bec632f946796a0ea4bceb5ad26f1ff1825c4304bf7252e9d2fd4d3889d36b52
    source_path: channels/tlon.md
    workflow: 16
---

Tlon é um mensageiro descentralizado criado sobre o Urbit. O OpenClaw se conecta à sua nave Urbit e pode
responder a DMs e mensagens de chat em grupo. Respostas em grupo exigem uma menção @ por padrão e podem
ser ainda mais restritas por meio de listas de permissões.

Status: Plugin incluído. DMs, menções em grupo, respostas em threads, formatação de texto rico e
uploads de imagens são compatíveis. Reações e enquetes ainda não são compatíveis.

## Plugin incluído

O Tlon é distribuído como um Plugin incluído nas versões atuais do OpenClaw, portanto builds
empacotados normais não precisam de uma instalação separada.

Se você estiver em um build mais antigo ou em uma instalação personalizada que exclui o Tlon, instale um
pacote npm atual quando um for publicado:

Instale via CLI (registro npm, quando existir um pacote atual):

```bash
openclaw plugins install @openclaw/tlon
```

Se o npm informar que o pacote de propriedade do OpenClaw está obsoleto, use um build
empacotado atual do OpenClaw ou o caminho de checkout local até que um pacote npm mais novo seja
publicado.

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração

1. Garanta que o Plugin Tlon esteja disponível.
   - As versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações mais antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Reúna a URL da sua nave e o código de login.
3. Configure `channels.tlon`.
4. Reinicie o Gateway.
5. Envie uma DM para o bot ou mencione-o em um canal de grupo.

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

Por padrão, o OpenClaw bloqueia nomes de host e faixas de IP privados/internos para proteção contra SSRF.
Se sua nave estiver em execução em uma rede privada (localhost, IP de LAN ou nome de host interno),
você deve ativar isso explicitamente:

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

⚠️ Ative isso somente se você confiar na sua rede local. Essa configuração desativa as proteções contra SSRF
para solicitações à URL da sua nave.

## Canais de grupo

A descoberta automática é ativada por padrão. Você também pode fixar canais manualmente:

```json5
{
  channels: {
    tlon: {
      groupChannels: ["chat/~host-ship/general", "chat/~host-ship/support"],
    },
  },
}
```

Desative a descoberta automática:

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

Lista de permissões de DM (vazia = nenhuma DM permitida, use `ownerShip` para o fluxo de aprovação):

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

## Sistema de proprietário e aprovação

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

A nave proprietária é **autorizada automaticamente em todos os lugares** — convites de DM são aceitos automaticamente e
mensagens de canal são sempre permitidas. Você não precisa adicionar o proprietário a `dmAllowlist` nem a
`defaultAuthorizedShips`.

Quando configurado, o proprietário recebe notificações por DM para:

- Solicitações de DM de naves que não estão na lista de permissões
- Menções em canais sem autorização
- Solicitações de convite para grupo

## Configurações de aceitação automática

Aceitar automaticamente convites de DM (para naves em dmAllowlist):

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

## Destinos de entrega (CLI/cron)

Use estes com `openclaw message send` ou entrega por Cron:

- DM: `~sampel-palnet` ou `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` ou `group:~host-ship/channel`

## Skill incluída

O Plugin Tlon inclui uma Skill incluída ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
que fornece acesso por CLI a operações do Tlon:

- **Contatos**: obter/atualizar perfis, listar contatos
- **Canais**: listar, criar, publicar mensagens, buscar histórico
- **Grupos**: listar, criar, gerenciar membros
- **DMs**: enviar mensagens, reagir a mensagens
- **Reações**: adicionar/remover reações de emoji em publicações e DMs
- **Configurações**: gerenciar permissões do Plugin por meio de comandos de barra

A Skill fica automaticamente disponível quando o Plugin é instalado.

## Recursos

| Recurso          | Status                                      |
| ---------------- | ------------------------------------------- |
| Mensagens diretas | ✅ Compatível                               |
| Grupos/canais    | ✅ Compatível (exige menção por padrão)     |
| Threads          | ✅ Compatível (respostas automáticas na thread) |
| Texto rico       | ✅ Markdown convertido para o formato do Tlon |
| Imagens          | ✅ Enviadas para o armazenamento do Tlon     |
| Reações          | ✅ Via [Skill incluída](#bundled-skill)      |
| Enquetes         | ❌ Ainda não compatível                     |
| Comandos nativos | ✅ Compatível (somente proprietário por padrão) |

## Solução de problemas

Execute esta sequência primeiro:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Falhas comuns:

- **DMs ignoradas**: remetente não está em `dmAllowlist` e nenhum `ownerShip` está configurado para o fluxo de aprovação.
- **Mensagens de grupo ignoradas**: canal não descoberto ou remetente não autorizado.
- **Erros de conexão**: verifique se a URL da nave está acessível; ative `allowPrivateNetwork` para naves locais.
- **Erros de autenticação**: verifique se o código de login está atual (códigos são rotacionados).

## Referência de configuração

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.tlon.enabled`: ativar/desativar inicialização do canal.
- `channels.tlon.ship`: nome da nave Urbit do bot (por exemplo, `~sampel-palnet`).
- `channels.tlon.url`: URL da nave (por exemplo, `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: código de login da nave.
- `channels.tlon.allowPrivateNetwork`: permitir URLs localhost/LAN (bypass de SSRF).
- `channels.tlon.ownerShip`: nave proprietária para o sistema de aprovação (sempre autorizada).
- `channels.tlon.dmAllowlist`: naves autorizadas a enviar DM (vazio = nenhuma).
- `channels.tlon.autoAcceptDmInvites`: aceitar automaticamente DMs de naves na lista de permissões.
- `channels.tlon.autoAcceptGroupInvites`: aceitar automaticamente todos os convites de grupo.
- `channels.tlon.autoDiscoverChannels`: descobrir automaticamente canais de grupo (padrão: true).
- `channels.tlon.groupChannels`: nests de canal fixados manualmente.
- `channels.tlon.defaultAuthorizedShips`: naves autorizadas para todos os canais.
- `channels.tlon.authorization.channelRules`: regras de autenticação por canal.
- `channels.tlon.showModelSignature`: anexar o nome do modelo às mensagens.

## Observações

- Respostas em grupo exigem uma menção (por exemplo, `~your-bot-ship`) para responder.
- Respostas em thread: se a mensagem recebida estiver em uma thread, o OpenClaw responde na thread.
- Texto rico: a formatação Markdown (negrito, itálico, código, cabeçalhos, listas) é convertida para o formato nativo do Tlon.
- Imagens: URLs são enviadas para o armazenamento do Tlon e incorporadas como blocos de imagem.

## Relacionado

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e controle por menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e fortalecimento
