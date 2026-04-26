---
read_when:
    - Configurando o controle de acesso a DM
    - Pareando um novo Node iOS/Android
    - Analisando a postura de segurança do OpenClaw
summary: 'Visão geral do pareamento: aprove quem pode enviar DM para você + quais Nodes podem participar'
title: Pareamento
x-i18n:
    generated_at: "2026-04-26T11:24:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: f9d28547baacce638347ce0062e3bc4f194704eb369b4ca45f7158d5e16cee93
    source_path: channels/pairing.md
    workflow: 15
---

“Pareamento” é a etapa explícita de **aprovação do proprietário** no OpenClaw.
Ela é usada em dois lugares:

1. **Pareamento de DM** (quem pode falar com o bot)
2. **Pareamento de Node** (quais dispositivos/nodes podem entrar na rede do Gateway)

Contexto de segurança: [Security](/pt-BR/gateway/security)

## 1) Pareamento de DM (acesso de chat de entrada)

Quando um canal é configurado com a política de DM `pairing`, remetentes desconhecidos recebem um código curto e a mensagem deles **não é processada** até você aprovar.

As políticas padrão de DM estão documentadas em: [Security](/pt-BR/gateway/security)

Códigos de pareamento:

- 8 caracteres, maiúsculos, sem caracteres ambíguos (`0O1I`).
- **Expiram após 1 hora**. O bot só envia a mensagem de pareamento quando uma nova solicitação é criada (aproximadamente uma vez por hora por remetente).
- As solicitações pendentes de pareamento de DM são limitadas a **3 por canal** por padrão; solicitações adicionais são ignoradas até que uma expire ou seja aprovada.

### Aprovar um remetente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Canais compatíveis: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Onde o estado fica armazenado

Armazenado em `~/.openclaw/credentials/`:

- Solicitações pendentes: `<channel>-pairing.json`
- Armazenamento da lista de permissões aprovada:
  - Conta padrão: `<channel>-allowFrom.json`
  - Conta não padrão: `<channel>-<accountId>-allowFrom.json`

Comportamento do escopo por conta:

- Contas não padrão leem/escrevem apenas no seu arquivo de lista de permissões com escopo.
- A conta padrão usa o arquivo de lista de permissões do canal sem escopo.

Trate esses arquivos como sensíveis (eles controlam o acesso ao seu assistente).

Importante: esse armazenamento é para acesso por DM. A autorização de grupo é separada.
Aprovar um código de pareamento de DM não permite automaticamente que esse remetente execute comandos de grupo ou controle o bot em grupos. Para acesso em grupos, configure as listas explícitas de permissões de grupo do canal (por exemplo `groupAllowFrom`, `groups` ou substituições por grupo/por tópico, dependendo do canal).

## 2) Pareamento de dispositivos Node (Nodes iOS/Android/macOS/headless)

Os Nodes se conectam ao Gateway como **dispositivos** com `role: node`. O Gateway
cria uma solicitação de pareamento de dispositivo que precisa ser aprovada.

### Parear via Telegram (recomendado para iOS)

Se você usa o Plugin `device-pair`, pode fazer o pareamento inicial do dispositivo inteiramente pelo Telegram:

1. No Telegram, envie uma mensagem para o seu bot: `/pair`
2. O bot responde com duas mensagens: uma mensagem de instrução e uma mensagem separada com o **código de configuração** (fácil de copiar/colar no Telegram).
3. No seu telefone, abra o app OpenClaw para iOS → Settings → Gateway.
4. Cole o código de configuração e conecte.
5. De volta ao Telegram: `/pair pending` (revise IDs de solicitação, papel e escopos) e então aprove.

O código de configuração é uma carga JSON codificada em base64 que contém:

- `url`: a URL WebSocket do Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken`: um token de bootstrap de curto prazo e dispositivo único usado para o handshake inicial de pareamento

Esse token de bootstrap carrega o perfil embutido de bootstrap de pareamento:

- o token `node` principal transferido continua com `scopes: []`
- qualquer token `operator` transferido continua limitado à lista de permissões de bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- as verificações de escopo de bootstrap são prefixadas por papel, não um único conjunto plano de escopos:
  entradas de escopo de operator satisfazem apenas solicitações de operator, e papéis não operator
  ainda precisam solicitar escopos sob o próprio prefixo de papel
- rotação/revogação posterior de token continua limitada tanto pelo contrato de papel aprovado do dispositivo
  quanto pelos escopos de operator da sessão chamadora

Trate o código de configuração como uma senha enquanto ele for válido.

### Aprovar um dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Se o mesmo dispositivo tentar novamente com detalhes de autenticação diferentes (por exemplo, papel/escopos/chave pública diferentes), a solicitação pendente anterior é substituída e um novo
`requestId` é criado.

Importante: um dispositivo já pareado não recebe acesso mais amplo silenciosamente. Se ele
se reconectar pedindo mais escopos ou um papel mais amplo, o OpenClaw mantém a
aprovação existente como está e cria uma nova solicitação pendente de upgrade. Use
`openclaw devices list` para comparar o acesso atualmente aprovado com o acesso
recém-solicitado antes de aprovar.

### Aprovação automática opcional de Node por CIDR confiável

O pareamento de dispositivos continua manual por padrão. Para redes de Nodes rigidamente controladas,
você pode optar pela aprovação automática inicial de Nodes com CIDRs explícitos ou IPs exatos:

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

Isso se aplica apenas a solicitações novas de pareamento `role: node` sem
escopos solicitados. Clientes operator, browser, Control UI e WebChat ainda exigem
aprovação manual. Alterações de papel, escopo, metadados e chave pública ainda exigem
aprovação manual.

### Armazenamento do estado de pareamento de Node

Armazenado em `~/.openclaw/devices/`:

- `pending.json` (curta duração; solicitações pendentes expiram)
- `paired.json` (dispositivos pareados + tokens)

### Observações

- A API legada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|rename`) é um
  armazenamento de pareamento separado, controlado pelo Gateway. Nodes WS ainda exigem pareamento de dispositivo.
- O registro de pareamento é a fonte de verdade durável para papéis aprovados. Tokens ativos de
  dispositivo continuam limitados a esse conjunto de papéis aprovados; uma entrada de token dispersa
  fora dos papéis aprovados não cria novo acesso.

## Documentação relacionada

- Modelo de segurança + injeção de prompt: [Security](/pt-BR/gateway/security)
- Atualização segura (execute doctor): [Updating](/pt-BR/install/updating)
- Configurações de canal:
  - Telegram: [Telegram](/pt-BR/channels/telegram)
  - WhatsApp: [WhatsApp](/pt-BR/channels/whatsapp)
  - Signal: [Signal](/pt-BR/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/pt-BR/channels/bluebubbles)
  - iMessage (legado): [iMessage](/pt-BR/channels/imessage)
  - Discord: [Discord](/pt-BR/channels/discord)
  - Slack: [Slack](/pt-BR/channels/slack)
