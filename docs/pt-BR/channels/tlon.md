---
read_when:
    - Trabalhando nos recursos do canal Tlon/Urbit
summary: Status, recursos e configuração do suporte ao Tlon/Urbit
title: Tlon
x-i18n:
    generated_at: "2026-05-04T02:22:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1718044541b431ff2437508e7e6659c14206f4aa84ab8b207e0d791dea2a48c5
    source_path: channels/tlon.md
    workflow: 16
---

Tlon é um mensageiro descentralizado criado sobre Urbit. O OpenClaw se conecta ao seu ship Urbit e pode
responder a DMs e mensagens de chat em grupo. Respostas em grupo exigem uma menção @ por padrão e podem
ser ainda mais restritas por allowlists.

Status: plugin integrado. DMs, menções em grupo, respostas em threads, formatação de rich text e
uploads de imagens são compatíveis. Reações e enquetes ainda não são compatíveis.

## Plugin integrado

Tlon é distribuído como um plugin integrado nas versões atuais do OpenClaw, então builds empacotados
normais não precisam de uma instalação separada.

Se você estiver em um build antigo ou em uma instalação personalizada que exclui o Tlon, instale um
pacote npm atual:

Instalar via CLI (registro npm):

```bash
openclaw plugins install @openclaw/tlon
```

Use o pacote sem versão fixa para acompanhar a tag oficial de lançamento atual. Fixe uma versão
exata somente quando precisar de uma instalação reproduzível.

Checkout local (ao executar a partir de um repositório git):

```bash
openclaw plugins install ./path/to/local/tlon-plugin
```

Detalhes: [Plugins](/pt-BR/tools/plugin)

## Configuração

1. Verifique se o plugin Tlon está disponível.
   - Versões empacotadas atuais do OpenClaw já o incluem.
   - Instalações antigas/personalizadas podem adicioná-lo manualmente com os comandos acima.
2. Reúna a URL do seu ship e o código de login.
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
      ownerShip: "~your-main-ship", // recommended: your ship, always allowed
    },
  },
}
```

## Ships privados/LAN

Por padrão, o OpenClaw bloqueia nomes de host e faixas de IP privados/internos para proteção contra SSRF.
Se o seu ship estiver sendo executado em uma rede privada (localhost, IP da LAN ou nome de host interno),
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

⚠️ Habilite isso somente se você confiar na sua rede local. Essa configuração desativa as proteções contra SSRF
para solicitações à URL do seu ship.

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

Allowlist de DMs (vazio = nenhuma DM permitida, use `ownerShip` para fluxo de aprovação):

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

Defina um ship proprietário para receber solicitações de aprovação quando usuários não autorizados tentarem interagir:

```json5
{
  channels: {
    tlon: {
      ownerShip: "~your-main-ship",
    },
  },
}
```

O ship proprietário é **automaticamente autorizado em todos os lugares** — convites de DM são aceitos automaticamente e
mensagens de canal são sempre permitidas. Você não precisa adicionar o proprietário a `dmAllowlist` ou
`defaultAuthorizedShips`.

Quando definido, o proprietário recebe notificações por DM para:

- Solicitações de DM de ships fora da allowlist
- Menções em canais sem autorização
- Solicitações de convite para grupo

## Configurações de aceitação automática

Aceitar automaticamente convites de DM (para ships em dmAllowlist):

```json5
{
  channels: {
    tlon: {
      autoAcceptDmInvites: true,
    },
  },
}
```

Aceitar automaticamente convites de grupo de ships confiáveis:

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

`autoAcceptGroupInvites` falha fechado quando `groupInviteAllowlist` está vazia. Defina a
allowlist para os ships cujos convites de grupo devem ser aceitos automaticamente.

## Destinos de entrega (CLI/cron)

Use estes com `openclaw message send` ou entrega por cron:

- DM: `~sampel-palnet` ou `dm/~sampel-palnet`
- Grupo: `chat/~host-ship/channel` ou `group:~host-ship/channel`

## Skill integrada

O plugin Tlon inclui uma skill integrada ([`@tloncorp/tlon-skill`](https://github.com/tloncorp/tlon-skill))
que fornece acesso pela CLI a operações do Tlon:

- **Contatos**: obter/atualizar perfis, listar contatos
- **Canais**: listar, criar, publicar mensagens, buscar histórico
- **Grupos**: listar, criar, gerenciar membros
- **DMs**: enviar mensagens, reagir a mensagens
- **Reações**: adicionar/remover reações de emoji em publicações e DMs
- **Configurações**: gerenciar permissões do plugin por comandos slash

A skill fica disponível automaticamente quando o plugin é instalado.

## Recursos

| Recurso             | Status                                             |
| ------------------- | -------------------------------------------------- |
| Mensagens diretas   | ✅ Compatível                                      |
| Grupos/canais       | ✅ Compatível (exige menção por padrão)            |
| Threads             | ✅ Compatível (respostas automáticas na thread)    |
| Rich text           | ✅ Markdown convertido para o formato do Tlon      |
| Imagens             | ✅ Enviadas ao armazenamento do Tlon               |
| Reações             | ✅ Via [skill integrada](#bundled-skill)           |
| Enquetes            | ❌ Ainda não compatível                            |
| Comandos nativos    | ✅ Compatível (somente proprietário por padrão)    |

## Solução de problemas

Execute esta sequência primeiro:

```bash
openclaw status
openclaw gateway status
openclaw logs --follow
openclaw doctor
```

Falhas comuns:

- **DMs ignoradas**: remetente não está em `dmAllowlist` e nenhum `ownerShip` foi configurado para o fluxo de aprovação.
- **Mensagens de grupo ignoradas**: canal não descoberto ou remetente não autorizado.
- **Erros de conexão**: verifique se a URL do ship está acessível; habilite `allowPrivateNetwork` para ships locais.
- **Erros de autenticação**: verifique se o código de login está atual (códigos fazem rotação).

## Referência de configuração

Configuração completa: [Configuração](/pt-BR/gateway/configuration)

Opções do provedor:

- `channels.tlon.enabled`: habilita/desabilita a inicialização do canal.
- `channels.tlon.ship`: nome do ship Urbit do bot (por exemplo, `~sampel-palnet`).
- `channels.tlon.url`: URL do ship (por exemplo, `https://sampel-palnet.tlon.network`).
- `channels.tlon.code`: código de login do ship.
- `channels.tlon.allowPrivateNetwork`: permite URLs localhost/LAN (bypass de SSRF).
- `channels.tlon.ownerShip`: ship proprietário para o sistema de aprovação (sempre autorizado).
- `channels.tlon.dmAllowlist`: ships autorizados a enviar DM (vazio = nenhum).
- `channels.tlon.autoAcceptDmInvites`: aceita automaticamente DMs de ships na allowlist.
- `channels.tlon.autoAcceptGroupInvites`: aceita automaticamente convites de grupo de ships na allowlist.
- `channels.tlon.groupInviteAllowlist`: ships cujos convites de grupo podem ser aceitos automaticamente.
- `channels.tlon.autoDiscoverChannels`: descobre automaticamente canais de grupo (padrão: true).
- `channels.tlon.groupChannels`: ninhos de canais fixados manualmente.
- `channels.tlon.defaultAuthorizedShips`: ships autorizados para todos os canais.
- `channels.tlon.authorization.channelRules`: regras de autenticação por canal.
- `channels.tlon.showModelSignature`: anexa o nome do modelo às mensagens.

## Observações

- Respostas em grupo exigem uma menção (por exemplo, `~your-bot-ship`) para responder.
- Respostas em threads: se a mensagem recebida estiver em uma thread, o OpenClaw responde na thread.
- Rich text: a formatação Markdown (negrito, itálico, código, cabeçalhos, listas) é convertida para o formato nativo do Tlon.
- Imagens: URLs são enviadas ao armazenamento do Tlon e incorporadas como blocos de imagem.

## Relacionados

- [Visão geral dos canais](/pt-BR/channels) — todos os canais compatíveis
- [Pareamento](/pt-BR/channels/pairing) — autenticação por DM e fluxo de pareamento
- [Grupos](/pt-BR/channels/groups) — comportamento de chat em grupo e exigência de menção
- [Roteamento de canais](/pt-BR/channels/channel-routing) — roteamento de sessão para mensagens
- [Segurança](/pt-BR/gateway/security) — modelo de acesso e proteção
