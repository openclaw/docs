---
read_when:
    - Configurando o controle de acesso a mensagens diretas
    - Emparelhando um novo Node iOS/Android
    - Analisando a postura de segurança do OpenClaw
summary: 'Visão geral do pareamento: aprove quem pode enviar mensagens diretas para você + quais nós podem ingressar'
title: Emparelhamento
x-i18n:
    generated_at: "2026-05-06T17:52:43Z"
    model: gpt-5.5
    provider: openai
    source_hash: dcee04ae47bf28caa76c5f6e7218e8b1b24f9ee70bc1b7b65d3f8859797a4645
    source_path: channels/pairing.md
    workflow: 16
---

"Pareamento" é a etapa explícita de aprovação de acesso do OpenClaw.
Ele é usado em dois lugares:

1. **Pareamento por DM** (quem tem permissão para falar com o bot)
2. **Pareamento de Node** (quais dispositivos/nós têm permissão para entrar na rede do Gateway)

Contexto de segurança: [Segurança](/pt-BR/gateway/security)

## 1) Pareamento por DM (acesso de chat de entrada)

Quando um canal é configurado com a política de DM `pairing`, remetentes desconhecidos recebem um código curto e a mensagem deles **não é processada** até você aprovar.

As políticas de DM padrão são documentadas em: [Segurança](/pt-BR/gateway/security)

`dmPolicy: "open"` é público somente quando a allowlist efetiva de DM inclui `"*"`.
A configuração e a validação exigem esse curinga para configurações públicas abertas. Se o estado existente
contiver `open` com entradas `allowFrom` concretas, em tempo de execução ainda serão admitidos
somente esses remetentes, e aprovações do armazenamento de pareamento não ampliam o acesso `open`.

Códigos de pareamento:

- 8 caracteres, maiúsculos, sem caracteres ambíguos (`0O1I`).
- **Expiram após 1 hora**. O bot só envia a mensagem de pareamento quando uma nova solicitação é criada (aproximadamente uma vez por hora por remetente).
- Solicitações pendentes de pareamento por DM são limitadas a **3 por canal** por padrão; solicitações adicionais são ignoradas até que uma expire ou seja aprovada.

### Aprovar um remetente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Se nenhum proprietário de comandos estiver configurado ainda, aprovar um código de pareamento por DM também inicializa
`commands.ownerAllowFrom` para o remetente aprovado, como `telegram:123456789`.
Isso dá às configurações iniciais um proprietário explícito para comandos privilegiados e prompts de aprovação de execução.
Depois que um proprietário existe, aprovações de pareamento posteriores concedem apenas acesso por DM;
elas não adicionam mais proprietários.

Canais compatíveis: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupos de remetentes reutilizáveis

Use `accessGroups` de nível superior quando o mesmo conjunto de remetentes confiáveis deve se aplicar a
vários canais de mensagem ou tanto a allowlists de DM quanto de grupo.

Grupos estáticos usam `type: "message.senders"` e são referenciados com
`accessGroup:<name>` a partir das allowlists do canal:

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

- Contas não padrão leem/gravam somente o arquivo de allowlist com escopo próprio.
- A conta padrão usa o arquivo de allowlist sem escopo específico do canal.

Trate esses dados como sensíveis (eles controlam o acesso ao seu assistente).

<Note>
O armazenamento da allowlist de pareamento é para acesso por DM. A autorização de grupo é separada.
Aprovar um código de pareamento por DM não permite automaticamente que esse remetente execute comandos de grupo
ou controle o bot em grupos. A inicialização do primeiro proprietário é um estado de configuração separado
em `commands.ownerAllowFrom`, e a entrega em chats de grupo ainda segue as allowlists de grupo do
canal (por exemplo, `groupAllowFrom`, `groups` ou substituições por grupo
ou por tópico, dependendo do canal).
</Note>

## 2) Pareamento de dispositivo Node (Nodes iOS/Android/macOS/headless)

Nodes se conectam ao Gateway como **dispositivos** com `role: node`. O Gateway
cria uma solicitação de pareamento de dispositivo que precisa ser aprovada.

### Parear via Telegram (recomendado para iOS)

Se você usa o Plugin `device-pair`, pode fazer o primeiro pareamento de dispositivo inteiramente pelo Telegram:

1. No Telegram, envie uma mensagem ao seu bot: `/pair`
2. O bot responde com duas mensagens: uma mensagem de instruções e uma mensagem separada com o **código de configuração** (fácil de copiar/colar no Telegram).
3. No seu telefone, abra o app OpenClaw para iOS → Configurações → Gateway.
4. Escaneie o código QR ou cole o código de configuração e conecte.
5. De volta ao Telegram: `/pair pending` (revise IDs de solicitação, função e escopos), depois aprove.

O código de configuração é uma carga JSON codificada em base64 que contém:

- `url`: a URL WebSocket do Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken`: um token de bootstrap de curta duração para um único dispositivo usado no handshake de pareamento inicial

Esse token de bootstrap carrega o perfil de bootstrap de pareamento integrado:

- o token `node` principal transferido permanece com `scopes: []`
- qualquer token `operator` transferido permanece limitado à allowlist de bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- as verificações de escopo de bootstrap usam prefixo por função, não um único conjunto plano de escopos:
  entradas de escopo de operador só satisfazem solicitações de operador, e funções não operadoras
  ainda precisam solicitar escopos sob seu próprio prefixo de função
- rotação/revogação posterior de tokens permanece limitada tanto pelo contrato de função aprovado do dispositivo
  quanto pelos escopos de operador da sessão chamadora

Trate o código de configuração como uma senha enquanto ele estiver válido.

Para Tailscale, pareamento móvel público ou outro pareamento móvel remoto, use Tailscale Serve/Funnel
ou outra URL `wss://` do Gateway. Códigos de configuração `ws://` em texto claro são aceitos somente
para loopback, endereços de LAN privada, hosts Bonjour `.local` e o host do emulador
Android. Endereços CGNAT de tailnet, nomes `.ts.net` e hosts públicos ainda
falham de modo fechado antes da emissão do QR/código de configuração.

### Aprovar um dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando uma aprovação explícita é negada porque a sessão do dispositivo pareado aprovador
foi aberta apenas com escopo de pareamento, a CLI tenta novamente a mesma solicitação com
`operator.admin`. Isso permite que um dispositivo pareado existente com capacidade de administração recupere um novo
pareamento da Control UI/navegador sem editar `devices/paired.json` manualmente. O
Gateway ainda valida a conexão repetida; tokens que não conseguem autenticar
com `operator.admin` continuam bloqueados.

Se o mesmo dispositivo tentar novamente com detalhes de autenticação diferentes (por exemplo, função/escopos/chave pública diferentes), a solicitação pendente anterior será substituída e um novo `requestId` será criado.

<Note>
Um dispositivo já pareado não recebe acesso mais amplo silenciosamente. Se ele se reconectar solicitando mais escopos ou uma função mais ampla, o OpenClaw mantém a aprovação existente como está e cria uma nova solicitação pendente de upgrade. Use `openclaw devices list` para comparar o acesso atualmente aprovado com o novo acesso solicitado antes de aprovar.
</Note>

### Aprovação automática opcional de Node por CIDR confiável

O pareamento de dispositivos continua manual por padrão. Para redes de Nodes estritamente controladas,
você pode ativar a aprovação automática inicial de Node com CIDRs explícitos ou IPs exatos:

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

Isso se aplica apenas a novas solicitações de pareamento `role: node` sem escopos
solicitados. Clientes operador, navegador, Control UI e WebChat ainda exigem aprovação manual.
Alterações de função, escopo, metadados e chave pública ainda exigem aprovação manual.

### Armazenamento de estado de pareamento de Node

Armazenado em `~/.openclaw/devices/`:

- `pending.json` (curta duração; solicitações pendentes expiram)
- `paired.json` (dispositivos pareados + tokens)

### Observações

- A API legada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) é um
  armazenamento de pareamento separado pertencente ao Gateway. Nodes WS ainda exigem pareamento de dispositivo.
- O registro de pareamento é a fonte de verdade durável para funções aprovadas. Tokens de dispositivos
  ativos permanecem limitados a esse conjunto de funções aprovado; uma entrada de token avulsa
  fora das funções aprovadas não cria novo acesso.

## Documentação relacionada

- Modelo de segurança + injeção de prompt: [Segurança](/pt-BR/gateway/security)
- Atualização segura (executar doctor): [Atualização](/pt-BR/install/updating)
- Configurações de canal:
  - Telegram: [Telegram](/pt-BR/channels/telegram)
  - WhatsApp: [WhatsApp](/pt-BR/channels/whatsapp)
  - Signal: [Signal](/pt-BR/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/pt-BR/channels/bluebubbles)
  - iMessage (legado): [iMessage](/pt-BR/channels/imessage)
  - Discord: [Discord](/pt-BR/channels/discord)
  - Slack: [Slack](/pt-BR/channels/slack)
