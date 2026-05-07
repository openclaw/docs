---
read_when:
    - Configurando o controle de acesso por DM
    - Emparelhando um novo nó iOS/Android
    - Analisando a postura de segurança do OpenClaw
summary: 'Visão geral do pareamento: aprove quem pode enviar mensagem direta para você + quais nós podem participar'
title: Pareamento
x-i18n:
    generated_at: "2026-05-07T01:50:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6e1b9082342209b7d37a790ecc61330f74131b070d0560cb71fb533379d9016a
    source_path: channels/pairing.md
    workflow: 16
---

"Emparelhamento" é a etapa explícita de aprovação de acesso do OpenClaw.
Ela é usada em dois lugares:

1. **Emparelhamento por DM** (quem tem permissão para falar com o bot)
2. **Emparelhamento de Node** (quais dispositivos/nós têm permissão para entrar na rede do Gateway)

Contexto de segurança: [Segurança](/pt-BR/gateway/security)

## 1) Emparelhamento por DM (acesso de chat recebido)

Quando um canal é configurado com a política de DM `pairing`, remetentes desconhecidos recebem um código curto e a mensagem deles **não é processada** até você aprovar.

As políticas de DM padrão estão documentadas em: [Segurança](/pt-BR/gateway/security)

`dmPolicy: "open"` é público somente quando a lista de permissões de DM efetiva inclui `"*"`.
A configuração e a validação exigem esse curinga para configurações públicas abertas. Se o estado existente
contiver `open` com entradas concretas em `allowFrom`, em tempo de execução ainda serão admitidos
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
`commands.ownerAllowFrom` com o remetente aprovado, como `telegram:123456789`.
Isso dá às configurações iniciais um proprietário explícito para comandos privilegiados e prompts de aprovação de execução.
Depois que um proprietário existe, aprovações de emparelhamento posteriores concedem apenas acesso por DM;
elas não adicionam mais proprietários.

Canais compatíveis: `bluebubbles`, `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupos de remetentes reutilizáveis

Use `accessGroups` de nível superior quando o mesmo conjunto de remetentes confiáveis deve se aplicar a
vários canais de mensagem ou tanto a listas de permissões de DM quanto de grupos.

Grupos estáticos usam `type: "message.senders"` e são referenciados com
`accessGroup:<name>` nas listas de permissões dos canais:

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

- Contas não padrão leem/gravam apenas seu arquivo de lista de permissões com escopo.
- A conta padrão usa o arquivo de lista de permissões sem escopo, com escopo de canal.

Trate esses arquivos como sensíveis (eles controlam o acesso ao seu assistente).

<Note>
O armazenamento da lista de permissões de emparelhamento é para acesso por DM. A autorização de grupo é separada.
Aprovar um código de emparelhamento por DM não permite automaticamente que esse remetente execute comandos de grupo
ou controle o bot em grupos. A inicialização do primeiro proprietário é um estado de configuração separado
em `commands.ownerAllowFrom`, e a entrega em chats de grupo ainda segue as listas de permissões de grupo do
canal (por exemplo, `groupAllowFrom`, `groups` ou substituições por grupo
ou por tópico, dependendo do canal).
</Note>

## 2) Emparelhamento de dispositivo Node (nós iOS/Android/macOS/headless)

Nós se conectam ao Gateway como **dispositivos** com `role: node`. O Gateway
cria uma solicitação de emparelhamento de dispositivo que precisa ser aprovada.

### Emparelhar via Telegram (recomendado para iOS)

Se você usa o Plugin `device-pair`, pode fazer o emparelhamento inicial do dispositivo inteiramente pelo Telegram:

1. No Telegram, envie uma mensagem ao seu bot: `/pair`
2. O bot responde com duas mensagens: uma mensagem de instruções e uma mensagem separada de **código de configuração** (fácil de copiar/colar no Telegram).
3. No seu telefone, abra o app OpenClaw para iOS → Configurações → Gateway.
4. Escaneie o código QR ou cole o código de configuração e conecte.
5. De volta ao Telegram: `/pair pending` (revise IDs de solicitação, função e escopos), depois aprove.

O código de configuração é um payload JSON codificado em base64 que contém:

- `url`: a URL WebSocket do Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken`: um token de bootstrap de curta duração e dispositivo único usado para o handshake inicial de emparelhamento

Esse token de bootstrap carrega o perfil de bootstrap de emparelhamento integrado:

- o token `node` entregue principal permanece com `scopes: []`
- qualquer token `operator` entregue permanece limitado à lista de permissões de bootstrap:
  `operator.approvals`, `operator.read`, `operator.talk.secrets`, `operator.write`
- verificações de escopo de bootstrap são prefixadas por função, não um único conjunto plano de escopos:
  entradas de escopo de operador satisfazem apenas solicitações de operador, e funções que não são de operador
  ainda precisam solicitar escopos sob seu próprio prefixo de função
- rotação/revogação posterior de tokens continua limitada tanto pelo contrato de função aprovado do dispositivo
  quanto pelos escopos de operador da sessão chamadora

Trate o código de configuração como uma senha enquanto ele estiver válido.

Para Tailscale, emparelhamento móvel público ou outro emparelhamento móvel remoto, use Tailscale Serve/Funnel
ou outra URL `wss://` do Gateway. Códigos de configuração em texto claro `ws://` são aceitos somente
para local loopback, endereços de LAN privada, hosts Bonjour `.local` e o host do emulador
Android. Endereços CGNAT de tailnet, nomes `.ts.net` e hosts públicos ainda
falham de forma fechada antes da emissão do QR/código de configuração.

### Aprovar um dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando uma aprovação explícita é negada porque a sessão de dispositivo emparelhado aprovadora
foi aberta com escopo somente de emparelhamento, a CLI tenta novamente a mesma solicitação com
`operator.admin`. Isso permite que um dispositivo emparelhado existente com capacidade de admin recupere um novo
emparelhamento de UI de Controle/navegador sem editar `devices/paired.json` manualmente. O
Gateway ainda valida a conexão repetida; tokens que não conseguem autenticar
com `operator.admin` permanecem bloqueados.

Se o mesmo dispositivo tentar novamente com detalhes de autenticação diferentes (por exemplo, função/escopos/chave pública
diferentes), a solicitação pendente anterior é substituída e um novo
`requestId` é criado.

<Note>
Um dispositivo já emparelhado não recebe acesso mais amplo silenciosamente. Se ele se reconectar pedindo mais escopos ou uma função mais ampla, o OpenClaw mantém a aprovação existente como está e cria uma nova solicitação pendente de upgrade. Use `openclaw devices list` para comparar o acesso aprovado atualmente com o novo acesso solicitado antes de aprovar.
</Note>

### Autoaprovação opcional de Node por CIDR confiável

O emparelhamento de dispositivo permanece manual por padrão. Para redes de nós rigidamente controladas,
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

Isso se aplica somente a novas solicitações de emparelhamento com `role: node` sem escopos
solicitados. Clientes operador, navegador, UI de Controle e WebChat ainda exigem aprovação manual.
Mudanças de função, escopo, metadados e chave pública ainda exigem aprovação manual.

### Armazenamento de estado de emparelhamento de Node

Armazenado em `~/.openclaw/devices/`:

- `pending.json` (curta duração; solicitações pendentes expiram)
- `paired.json` (dispositivos emparelhados + tokens)

### Observações

- A API legada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) é um
  armazenamento de emparelhamento separado, pertencente ao gateway. Nós WS ainda exigem emparelhamento de dispositivo.
- O registro de emparelhamento é a fonte durável da verdade para funções aprovadas. Tokens de dispositivo
  ativos permanecem limitados a esse conjunto de funções aprovado; uma entrada de token avulsa
  fora das funções aprovadas não cria novo acesso.

## Documentos relacionados

- Modelo de segurança + injeção de prompt: [Segurança](/pt-BR/gateway/security)
- Atualização segura (execute o doctor): [Atualização](/pt-BR/install/updating)
- Configurações de canais:
  - Telegram: [Telegram](/pt-BR/channels/telegram)
  - WhatsApp: [WhatsApp](/pt-BR/channels/whatsapp)
  - Signal: [Signal](/pt-BR/channels/signal)
  - iMessage: [iMessage](/pt-BR/channels/imessage)
  - BlueBubbles (ponte legada de iMessage): [BlueBubbles](/pt-BR/channels/bluebubbles)
  - Discord: [Discord](/pt-BR/channels/discord)
  - Slack: [Slack](/pt-BR/channels/slack)
