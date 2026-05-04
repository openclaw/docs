---
read_when:
    - Configurando o controle de acesso a DMs
    - Emparelhamento de um novo Node iOS/Android
    - Revisando a postura de segurança do OpenClaw
summary: 'Visão geral do pareamento: aprove quem pode enviar mensagens diretas para você + quais nós podem participar'
title: Pareamento
x-i18n:
    generated_at: "2026-05-04T02:21:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: 4fb27840f7c9ef55e7270cc29f813e6db90b240aa2180f30952eb9485f0f8874
    source_path: channels/pairing.md
    workflow: 16
---

“Pareamento” é a etapa explícita de aprovação de acesso do OpenClaw.
Ela é usada em dois lugares:

1. **Pareamento de DM** (quem tem permissão para falar com o bot)
2. **Pareamento de Node** (quais dispositivos/nós têm permissão para entrar na rede do Gateway)

Contexto de segurança: [Segurança](/pt-BR/gateway/security)

## 1) Pareamento de DM (acesso de chat de entrada)

Quando um canal é configurado com a política de DM `pairing`, remetentes desconhecidos recebem um código curto e a mensagem deles **não é processada** até você aprovar.

As políticas padrão de DM estão documentadas em: [Segurança](/pt-BR/gateway/security)

`dmPolicy: "open"` é público somente quando a lista de permissões efetiva de DM inclui `"*"`.
A configuração e a validação exigem esse curinga para configurações público-abertas. Se o estado existente
contiver `open` com entradas concretas em `allowFrom`, o runtime ainda admite
somente esses remetentes, e aprovações no armazenamento de pareamento não ampliam o acesso `open`.

Códigos de pareamento:

- 8 caracteres, maiúsculos, sem caracteres ambíguos (`0O1I`).
- **Expiram após 1 hora**. O bot só envia a mensagem de pareamento quando uma nova solicitação é criada (aproximadamente uma vez por hora por remetente).
- Solicitações pendentes de pareamento de DM são limitadas a **3 por canal** por padrão; solicitações adicionais são ignoradas até que uma expire ou seja aprovada.

### Aprovar um remetente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Se nenhum proprietário de comando estiver configurado ainda, aprovar um código de pareamento de DM também inicializa
`commands.ownerAllowFrom` para o remetente aprovado, como `telegram:123456789`.
Isso dá às configurações de primeira execução um proprietário explícito para comandos privilegiados e prompts de aprovação de exec.
Depois que um proprietário existe, aprovações de pareamento posteriores concedem apenas acesso de DM;
elas não adicionam mais proprietários.

Canais compatíveis: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupos de remetentes reutilizáveis

Use `accessGroups` de nível superior quando o mesmo conjunto de remetentes confiáveis deve ser aplicado a
vários canais de mensagem ou tanto a listas de permissões de DM quanto de grupo.

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

Comportamento de escopo por conta:

- Contas não padrão leem/gravam somente o arquivo de lista de permissões com escopo delas.
- A conta padrão usa o arquivo de lista de permissões sem escopo, com escopo do canal.

Trate esses arquivos como sensíveis (eles controlam o acesso ao seu assistente).

<Note>
O armazenamento da lista de permissões de pareamento é para acesso de DM. A autorização de grupo é separada.
Aprovar um código de pareamento de DM não permite automaticamente que esse remetente execute comandos de grupo
ou controle o bot em grupos. A inicialização do primeiro proprietário é um estado de configuração separado
em `commands.ownerAllowFrom`, e a entrega em chats de grupo ainda segue as listas de permissões de grupo
do canal (por exemplo, `groupAllowFrom`, `groups` ou substituições por grupo
ou por tópico, dependendo do canal).
</Note>

## 2) Pareamento de dispositivo Node (nós iOS/Android/macOS/headless)

Nós se conectam ao Gateway como **dispositivos** com `role: node`. O Gateway
cria uma solicitação de pareamento de dispositivo que precisa ser aprovada.

### Parear via Telegram (recomendado para iOS)

Se você usa o Plugin `device-pair`, pode fazer o pareamento inicial do dispositivo inteiramente pelo Telegram:

1. No Telegram, envie uma mensagem para seu bot: `/pair`
2. O bot responde com duas mensagens: uma mensagem de instruções e uma mensagem separada com o **código de configuração** (fácil de copiar/colar no Telegram).
3. No telefone, abra o app iOS do OpenClaw → Settings → Gateway.
4. Cole o código de configuração e conecte.
5. De volta ao Telegram: `/pair pending` (revise IDs de solicitação, função e escopos) e então aprove.

O código de configuração é uma carga JSON codificada em base64 que contém:

- `url`: a URL WebSocket do Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken`: um token de bootstrap de curta duração para um único dispositivo, usado no handshake inicial de pareamento

Esse token de bootstrap carrega o perfil integrado de bootstrap de pareamento:

- o token `node` principal transferido permanece com `scopes: []`
- qualquer token `operator` transferido permanece limitado à lista de permissões de bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- verificações de escopo de bootstrap são prefixadas por função, não um único conjunto plano de escopos:
  entradas de escopo de operador só satisfazem solicitações de operador, e funções não operadoras
  ainda devem solicitar escopos sob o próprio prefixo de função
- rotação/revogação posterior de token permanece limitada tanto pelo contrato de função aprovado
  do dispositivo quanto pelos escopos de operador da sessão chamadora

Trate o código de configuração como uma senha enquanto ele estiver válido.

### Aprovar um dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando uma aprovação explícita é negada porque a sessão de dispositivo pareado aprovadora
foi aberta com escopo apenas de pareamento, a CLI tenta novamente a mesma solicitação com
`operator.admin`. Isso permite que um dispositivo pareado existente com capacidade de administrador recupere um novo
pareamento da Control UI/navegador sem editar `devices/paired.json` manualmente. O
Gateway ainda valida a conexão repetida; tokens que não conseguem se autenticar
com `operator.admin` permanecem bloqueados.

Se o mesmo dispositivo tentar novamente com detalhes de autenticação diferentes (por exemplo, função/escopos/chave pública diferentes),
a solicitação pendente anterior é substituída e um novo `requestId` é criado.

<Note>
Um dispositivo já pareado não recebe acesso mais amplo silenciosamente. Se ele reconectar solicitando mais escopos ou uma função mais ampla, o OpenClaw mantém a aprovação existente como está e cria uma nova solicitação pendente de upgrade. Use `openclaw devices list` para comparar o acesso aprovado atualmente com o novo acesso solicitado antes de aprovar.
</Note>

### Aprovação automática opcional de Node por CIDR confiável

O pareamento de dispositivo permanece manual por padrão. Para redes de Node estritamente controladas,
você pode optar pela aprovação automática de Node na primeira execução com CIDRs explícitos ou IPs exatos:

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

Isso se aplica somente a novas solicitações de pareamento com `role: node` sem escopos solicitados.
Clientes de operador, navegador, Control UI e WebChat ainda exigem aprovação manual.
Alterações de função, escopo, metadados e chave pública ainda exigem aprovação manual.

### Armazenamento do estado de pareamento de Node

Armazenado em `~/.openclaw/devices/`:

- `pending.json` (curta duração; solicitações pendentes expiram)
- `paired.json` (dispositivos pareados + tokens)

### Observações

- A API legada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) é um
  armazenamento de pareamento separado, de propriedade do gateway. Nós WS ainda exigem pareamento de dispositivo.
- O registro de pareamento é a fonte durável da verdade para funções aprovadas. Tokens de dispositivo ativos
  permanecem limitados a esse conjunto de funções aprovado; uma entrada de token avulsa
  fora das funções aprovadas não cria novo acesso.

## Documentação relacionada

- Modelo de segurança + injeção de prompt: [Segurança](/pt-BR/gateway/security)
- Atualizar com segurança (executar doctor): [Atualização](/pt-BR/install/updating)
- Configurações de canal:
  - Telegram: [Telegram](/pt-BR/channels/telegram)
  - WhatsApp: [WhatsApp](/pt-BR/channels/whatsapp)
  - Signal: [Signal](/pt-BR/channels/signal)
  - BlueBubbles (iMessage): [BlueBubbles](/pt-BR/channels/bluebubbles)
  - iMessage (legado): [iMessage](/pt-BR/channels/imessage)
  - Discord: [Discord](/pt-BR/channels/discord)
  - Slack: [Slack](/pt-BR/channels/slack)
