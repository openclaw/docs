---
read_when:
    - Configurando o controle de acesso a DMs
    - Emparelhando um novo nó iOS/Android
    - Revisando a postura de segurança do OpenClaw
summary: 'Visão geral do emparelhamento: aprove quem pode enviar DM para você + quais nós podem participar'
title: Pareamento
x-i18n:
    generated_at: "2026-07-03T13:20:42Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c62f42116b71467576b2c1e005fa2e606a3d0f40cbf7b92fc4a7dd47c8f0568e
    source_path: channels/pairing.md
    workflow: 16
---

"Emparelhamento" é a etapa explícita de aprovação de acesso do OpenClaw.
Ela é usada em dois lugares:

1. **Emparelhamento por DM** (quem tem permissão para falar com o bot)
2. **Emparelhamento de Node** (quais dispositivos/nós têm permissão para entrar na rede do Gateway)

Contexto de segurança: [Segurança](/pt-BR/gateway/security)

## 1) Emparelhamento por DM (acesso de chat de entrada)

Quando um canal é configurado com a política de DM `pairing`, remetentes desconhecidos recebem um código curto e a mensagem deles **não é processada** até você aprovar.

As políticas padrão de DM estão documentadas em: [Segurança](/pt-BR/gateway/security)

`dmPolicy: "open"` é público somente quando a allowlist efetiva de DM inclui `"*"`.
A configuração e a validação exigem esse curinga para configurações públicas abertas. Se o estado existente
contiver `open` com entradas concretas de `allowFrom`, o runtime ainda admitirá
somente esses remetentes, e aprovações no armazenamento de emparelhamento não ampliam o acesso `open`.

Códigos de emparelhamento:

- 8 caracteres, maiúsculos, sem caracteres ambíguos (`0O1I`).
- **Expiram após 1 hora**. O bot só envia a mensagem de emparelhamento quando uma nova solicitação é criada (aproximadamente uma vez por hora por remetente).
- Solicitações pendentes de emparelhamento por DM são limitadas a **3 por canal** por padrão; solicitações adicionais são ignoradas até que uma expire ou seja aprovada.

### Aprovar um remetente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Se nenhum proprietário de comandos estiver configurado ainda, aprovar um código de emparelhamento por DM também inicializa
`commands.ownerAllowFrom` para o remetente aprovado, como `telegram:123456789`.
Isso dá às configurações iniciais um proprietário explícito para comandos privilegiados e prompts de aprovação de exec.
Depois que um proprietário existe, aprovações de emparelhamento posteriores concedem apenas acesso por DM;
elas não adicionam mais proprietários.

Canais compatíveis: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupos de remetentes reutilizáveis

Use `accessGroups` no nível superior quando o mesmo conjunto de remetentes confiáveis deve se aplicar a
vários canais de mensagem ou tanto a allowlists de DM quanto de grupo.

Grupos estáticos usam `type: "message.senders"` e são referenciados com
`accessGroup:<name>` a partir das allowlists de canal:

```json5
{
  accessGroups: {
    operators: {
      type: "message.senders",
      members: {
        discord: ["discord:123456789012345678"],
        telegram: ["987654321"],
        whatsapp: ["+15551234567"],
      },
    },
  },
  channels: {
    telegram: { dmPolicy: "allowlist", allowFrom: ["accessGroup:operators"] },
    whatsapp: { groupPolicy: "allowlist", groupAllowFrom: ["accessGroup:operators"] },
  },
}
```

Grupos de acesso são documentados em detalhes aqui: [Grupos de acesso](/pt-BR/channels/access-groups)

### Onde o estado fica

Armazenado em `~/.openclaw/credentials/`:

- Solicitações pendentes: `<channel>-pairing.json`
- Armazenamento da allowlist aprovada:
  - Conta padrão: `<channel>-allowFrom.json`
  - Conta não padrão: `<channel>-<accountId>-allowFrom.json`

Comportamento de escopo por conta:

- Contas não padrão leem/gravam apenas o arquivo de allowlist com escopo próprio.
- A conta padrão usa o arquivo de allowlist sem escopo específico do canal.

Trate esses arquivos como sensíveis (eles controlam o acesso ao seu assistente).

<Note>
O armazenamento da allowlist de emparelhamento é para acesso por DM. A autorização de grupo é separada.
Aprovar um código de emparelhamento por DM não permite automaticamente que esse remetente execute comandos de grupo
ou controle o bot em grupos. A inicialização do primeiro proprietário é um estado de configuração separado
em `commands.ownerAllowFrom`, e a entrega em chats de grupo ainda segue as allowlists de grupo
do canal (por exemplo, `groupAllowFrom`, `groups` ou substituições por grupo
ou por tópico, dependendo do canal).
</Note>

## 2) Emparelhamento de dispositivo Node (nós iOS/Android/macOS/headless)

Nodes se conectam ao Gateway como **dispositivos** com `role: node`. O Gateway
cria uma solicitação de emparelhamento de dispositivo que precisa ser aprovada.

### Emparelhar via Telegram (recomendado para iOS)

Se você usa o Plugin `device-pair`, pode fazer o emparelhamento inicial de dispositivo inteiramente pelo Telegram:

1. No Telegram, envie uma mensagem ao seu bot: `/pair`
2. O bot responde com duas mensagens: uma mensagem de instruções e uma mensagem separada de **código de configuração** (fácil de copiar/colar no Telegram).
3. No seu telefone, abra o app OpenClaw para iOS → Configurações → Gateway.
4. Escaneie o QR code ou cole o código de configuração e conecte.
5. De volta ao Telegram: `/pair pending` (revise IDs de solicitação, função e escopos) e então aprove.

O código de configuração é um payload JSON codificado em base64 que contém:

- `url`: a URL WebSocket do Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken`: um token de bootstrap de curta duração para um único dispositivo, usado no handshake inicial de emparelhamento

Esse token de bootstrap carrega o perfil interno de bootstrap de emparelhamento:

- o perfil interno de configuração permite apenas a linha de base nova de QR/código de configuração:
  `node` mais uma transferência limitada de `operator`
- o token `node` transferido permanece com `scopes: []`
- o token `operator` transferido é limitado a `operator.approvals`,
  `operator.read`, `operator.talk.secrets` e `operator.write`
- `operator.admin` não é concedido pelo bootstrap de QR/código de configuração; ele exige um
  fluxo separado aprovado de emparelhamento ou token de operador
- rotação/revogação posterior de tokens continua limitada tanto pelo contrato de função aprovado
  do dispositivo quanto pelos escopos de operador da sessão chamadora

Trate o código de configuração como uma senha enquanto ele estiver válido.

Para Tailscale, pareamento móvel público ou outro pareamento remoto, use Tailscale Serve/Funnel
ou outra URL `wss://` do Gateway. Códigos de configuração `ws://` em texto claro são aceitos apenas
para local loopback, endereços de LAN privada, hosts Bonjour `.local` e o host do emulador
Android. Endereços CGNAT de tailnet, nomes `.ts.net` e hosts públicos ainda
falham de modo fechado antes da emissão de QR/código de configuração.

### Aprovar um dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando uma aprovação explícita é negada porque a sessão do dispositivo pareado aprovador
foi aberta com escopo apenas de emparelhamento, a CLI repete a mesma solicitação com
`operator.admin`. Isso permite que um dispositivo pareado existente com capacidade de administrador recupere um novo
emparelhamento da Control UI/navegador sem editar `devices/paired.json` manualmente. O
Gateway ainda valida a conexão repetida; tokens que não conseguem autenticar
com `operator.admin` permanecem bloqueados.

Se o mesmo dispositivo tentar novamente com detalhes de autenticação diferentes (por exemplo, função/escopos/chave pública diferentes),
a solicitação pendente anterior será substituída e um novo
`requestId` será criado.

<Note>
Um dispositivo já pareado não recebe acesso mais amplo silenciosamente. Se ele se reconectar pedindo mais escopos ou uma função mais ampla, o OpenClaw mantém a aprovação existente como está e cria uma nova solicitação pendente de upgrade. Use `openclaw devices list` para comparar o acesso atualmente aprovado com o acesso recém-solicitado antes de aprovar.
</Note>

### Autoaprovação opcional de Node por CIDR confiável

O emparelhamento de dispositivos permanece manual por padrão. Para redes de Node rigidamente controladas,
você pode optar pela autoaprovação inicial de Node com CIDRs explícitos ou IPs exatos:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        autoApproveCidrs: ["192.168.1.0/24"],
      },
    },
  },
}
```

Isso se aplica apenas a novas solicitações de emparelhamento com `role: node` sem escopos
solicitados. Clientes operador, navegador, Control UI e WebChat ainda exigem aprovação
manual. Alterações de função, escopo, metadados e chave pública ainda exigem aprovação
manual.

### Armazenamento de estado de emparelhamento de Node

Armazenado em `~/.openclaw/devices/`:

- `pending.json` (curta duração; solicitações pendentes expiram)
- `paired.json` (dispositivos pareados + tokens)

### Observações

- A API legada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) é um
  armazenamento de emparelhamento separado, pertencente ao gateway. Nodes WS ainda exigem emparelhamento de dispositivo.
- O registro de emparelhamento é a fonte durável da verdade para funções aprovadas. Tokens de
  dispositivo ativos permanecem limitados a esse conjunto de funções aprovadas; uma entrada de token avulsa
  fora das funções aprovadas não cria novo acesso.

## Documentos relacionados

- Modelo de segurança + injeção de prompt: [Segurança](/pt-BR/gateway/security)
- Atualização segura (execute o doctor): [Atualização](/pt-BR/install/updating)
- Configurações de canal:
  - Telegram: [Telegram](/pt-BR/channels/telegram)
  - WhatsApp: [WhatsApp](/pt-BR/channels/whatsapp)
  - Signal: [Signal](/pt-BR/channels/signal)
  - iMessage: [iMessage](/pt-BR/channels/imessage)
  - Discord: [Discord](/pt-BR/channels/discord)
  - Slack: [Slack](/pt-BR/channels/slack)
