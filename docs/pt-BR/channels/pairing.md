---
read_when:
    - Configurando o controle de acesso a mensagens diretas
    - Pareando um novo Node iOS/Android
    - Revisando a postura de segurança do OpenClaw
summary: 'Visão geral do pareamento: aprove quem pode enviar mensagens diretas para você + quais Node podem entrar'
title: Emparelhamento
x-i18n:
    generated_at: "2026-05-02T05:41:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: bb68d87c0e1dfe7c9a6a6d9415f4c63625755fb43a2e22a1d1374ff0a63e49c4
    source_path: channels/pairing.md
    workflow: 16
---

“Emparelhamento” é a etapa explícita de aprovação de acesso do OpenClaw.
Ele é usado em dois lugares:

1. **Emparelhamento por DM** (quem tem permissão para falar com o bot)
2. **Emparelhamento de Node** (quais dispositivos/nós têm permissão para entrar na rede do Gateway)

Contexto de segurança: [Segurança](/pt-BR/gateway/security)

## 1) Emparelhamento por DM (acesso de chat de entrada)

Quando um canal é configurado com a política de DM `pairing`, remetentes desconhecidos recebem um código curto e a mensagem deles **não é processada** até você aprovar.

As políticas de DM padrão estão documentadas em: [Segurança](/pt-BR/gateway/security)

`dmPolicy: "open"` só é público quando a lista de permissões de DM efetiva inclui `"*"`.
A configuração e a validação exigem esse curinga para configurações públicas abertas. Se o estado existente
contiver `open` com entradas concretas de `allowFrom`, o runtime ainda admitirá
somente esses remetentes, e aprovações do armazenamento de emparelhamento não ampliam o acesso `open`.

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
`commands.ownerAllowFrom` com o remetente aprovado, como `telegram:123456789`.
Isso dá às configurações iniciais um proprietário explícito para comandos privilegiados e solicitações de aprovação de execução.
Depois que um proprietário existir, aprovações de emparelhamento posteriores concedem apenas acesso por DM;
elas não adicionam mais proprietários.

Canais compatíveis: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupos de remetentes reutilizáveis

Use `accessGroups` no nível superior quando o mesmo conjunto de remetentes confiáveis deve se aplicar a
vários canais de mensagem ou tanto a listas de permissões de DM quanto de grupos.

Grupos estáticos usam `type: "message.senders"` e são referenciados com
`accessGroup:<name>` nas listas de permissões de canais:

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

Grupos de acesso estão documentados em detalhes aqui: [Grupos de acesso](/pt-BR/channels/access-groups)

### Onde o estado fica armazenado

Armazenado em `~/.openclaw/credentials/`:

- Solicitações pendentes: `<channel>-pairing.json`
- Armazenamento da lista de permissões aprovada:
  - Conta padrão: `<channel>-allowFrom.json`
  - Conta não padrão: `<channel>-<accountId>-allowFrom.json`

Comportamento de escopo de conta:

- Contas não padrão leem/gravam somente seu arquivo de lista de permissões com escopo.
- A conta padrão usa o arquivo de lista de permissões sem escopo do canal.

Trate-os como sensíveis (eles controlam o acesso ao seu assistente).

<Note>
O armazenamento da lista de permissões de emparelhamento é para acesso por DM. A autorização em grupo é separada.
Aprovar um código de emparelhamento por DM não permite automaticamente que esse remetente execute comandos de grupo
ou controle o bot em grupos. A inicialização do primeiro proprietário é um estado de configuração separado
em `commands.ownerAllowFrom`, e a entrega em chats de grupo ainda segue as listas de permissões de grupo do
canal (por exemplo `groupAllowFrom`, `groups` ou substituições por grupo
ou por tópico, dependendo do canal).
</Note>

## 2) Emparelhamento de dispositivo Node (nós iOS/Android/macOS/headless)

Nós se conectam ao Gateway como **dispositivos** com `role: node`. O Gateway
cria uma solicitação de emparelhamento de dispositivo que precisa ser aprovada.

### Emparelhar via Telegram (recomendado para iOS)

Se você usa o Plugin `device-pair`, pode fazer o emparelhamento inicial do dispositivo inteiramente pelo Telegram:

1. No Telegram, envie uma mensagem ao seu bot: `/pair`
2. O bot responde com duas mensagens: uma mensagem de instruções e uma mensagem separada com o **código de configuração** (fácil de copiar/colar no Telegram).
3. No seu telefone, abra o aplicativo OpenClaw para iOS → Configurações → Gateway.
4. Cole o código de configuração e conecte.
5. De volta ao Telegram: `/pair pending` (revise IDs de solicitação, função e escopos), depois aprove.

O código de configuração é uma carga JSON codificada em base64 que contém:

- `url`: a URL WebSocket do Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken`: um token de inicialização de dispositivo único e curta duração usado para o handshake inicial de emparelhamento

Esse token de inicialização carrega o perfil interno de inicialização de emparelhamento:

- o token `node` primário repassado permanece com `scopes: []`
- qualquer token `operator` repassado permanece limitado à lista de permissões de inicialização:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- verificações de escopo de inicialização têm prefixo de função, não um único conjunto plano de escopos:
  entradas de escopo de operador só satisfazem solicitações de operador, e funções não operadoras
  ainda precisam solicitar escopos sob seu próprio prefixo de função
- rotação/revogação posterior de tokens permanece limitada tanto pelo contrato de função aprovado do dispositivo
  quanto pelos escopos de operador da sessão chamadora

Trate o código de configuração como uma senha enquanto ele for válido.

### Aprovar um dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Se o mesmo dispositivo tentar novamente com detalhes de autenticação diferentes (por exemplo, função/escopos/chave pública diferentes), a solicitação pendente anterior será substituída e um novo
`requestId` será criado.

<Note>
Um dispositivo já emparelhado não recebe acesso mais amplo silenciosamente. Se ele se reconectar pedindo mais escopos ou uma função mais ampla, o OpenClaw mantém a aprovação existente como está e cria uma nova solicitação pendente de upgrade. Use `openclaw devices list` para comparar o acesso atualmente aprovado com o acesso recém-solicitado antes de aprovar.
</Note>

### Aprovação automática opcional de Node por CIDR confiável

O emparelhamento de dispositivos continua manual por padrão. Para redes de nós rigidamente controladas,
você pode optar pela aprovação automática de Node inicial com CIDRs explícitos ou IPs exatos:

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

Isso se aplica somente a novas solicitações de emparelhamento com `role: node` sem
escopos solicitados. Clientes Operator, navegador, Control UI e WebChat ainda exigem aprovação manual.
Alterações de função, escopo, metadados e chave pública ainda exigem aprovação manual.

### Armazenamento de estado de emparelhamento de Node

Armazenado em `~/.openclaw/devices/`:

- `pending.json` (curta duração; solicitações pendentes expiram)
- `paired.json` (dispositivos emparelhados + tokens)

### Observações

- A API legada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) é um
  armazenamento de emparelhamento separado e pertencente ao gateway. Nós WS ainda exigem emparelhamento de dispositivo.
- O registro de emparelhamento é a fonte durável da verdade para funções aprovadas. Tokens de dispositivo ativos
  permanecem limitados a esse conjunto de funções aprovado; uma entrada de token solta
  fora das funções aprovadas não cria novo acesso.

## Documentos relacionados

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
