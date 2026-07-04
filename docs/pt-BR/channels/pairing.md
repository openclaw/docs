---
read_when:
    - Configurando o controle de acesso por DM
    - Emparelhando um novo nó iOS/Android
    - Revisando a postura de segurança do OpenClaw
summary: 'Visão geral do pareamento: aprove quem pode enviar mensagens diretas para você + quais nós podem participar'
title: Emparelhamento
x-i18n:
    generated_at: "2026-07-04T17:52:18Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: e9c6508b8fd991f3a61ce026d1d453364de566a5b1373a6311ad24f43dcdb267
    source_path: channels/pairing.md
    workflow: 16
---

"Pairing" é a etapa explícita de aprovação de acesso do OpenClaw.
Ela é usada em dois lugares:

1. **Pareamento por DM** (quem tem permissão para falar com o bot)
2. **Pareamento de Node** (quais dispositivos/nós têm permissão para entrar na rede do Gateway)

Contexto de segurança: [Segurança](/pt-BR/gateway/security)

## 1) Pareamento por DM (acesso de chat de entrada)

Quando um canal é configurado com a política de DM `pairing`, remetentes desconhecidos recebem um código curto e sua mensagem **não é processada** até você aprovar.

As políticas de DM padrão estão documentadas em: [Segurança](/pt-BR/gateway/security)

`dmPolicy: "open"` é público somente quando a lista efetiva de permissões de DM inclui `"*"`.
A configuração e a validação exigem esse curinga para configurações públicas abertas. Se o estado existente
contiver `open` com entradas concretas de `allowFrom`, o runtime ainda admitirá
somente esses remetentes, e as aprovações do armazenamento de pareamento não ampliam o acesso `open`.

Códigos de pareamento:

- 8 caracteres, maiúsculos, sem caracteres ambíguos (`0O1I`).
- **Expiram após 1 hora**. O bot só envia a mensagem de pareamento quando uma nova solicitação é criada (aproximadamente uma vez por hora por remetente).
- Solicitações pendentes de pareamento por DM são limitadas a **3 por canal** por padrão; solicitações adicionais são ignoradas até que uma expire ou seja aprovada.

### Aprovar um remetente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Se nenhum proprietário de comandos ainda estiver configurado, aprovar um código de pareamento por DM também inicializa
`commands.ownerAllowFrom` para o remetente aprovado, como `telegram:123456789`.
Isso dá às configurações iniciais um proprietário explícito para comandos privilegiados e prompts de aprovação de exec.
Depois que um proprietário existe, aprovações de pareamento posteriores concedem apenas acesso por DM;
elas não adicionam mais proprietários.

Canais compatíveis: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupos de remetentes reutilizáveis

Use `accessGroups` de nível superior quando o mesmo conjunto de remetentes confiáveis deve se aplicar a
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

### Onde o estado fica

Armazenado em `~/.openclaw/credentials/`:

- Solicitações pendentes: `<channel>-pairing.json`
- Armazenamento da lista de permissões aprovada:
  - Conta padrão: `<channel>-allowFrom.json`
  - Conta não padrão: `<channel>-<accountId>-allowFrom.json`

Comportamento de escopo de conta:

- Contas não padrão leem/gravam somente seu arquivo de lista de permissões com escopo.
- A conta padrão usa o arquivo de lista de permissões sem escopo no nível do canal.

Trate-os como sensíveis (eles controlam o acesso ao seu assistente).

<Note>
O armazenamento de lista de permissões de pareamento é para acesso por DM. A autorização de grupos é separada.
Aprovar um código de pareamento por DM não permite automaticamente que esse remetente execute comandos de grupo
ou controle o bot em grupos. A inicialização do primeiro proprietário é um estado de configuração separado
em `commands.ownerAllowFrom`, e a entrega de chats em grupo ainda segue as listas de permissões de grupo
do canal (por exemplo, `groupAllowFrom`, `groups` ou substituições por grupo
ou por tópico, dependendo do canal).
</Note>

## 2) Pareamento de dispositivo Node (nós iOS/Android/macOS/headless)

Nodes se conectam ao Gateway como **dispositivos** com `role: node`. O Gateway
cria uma solicitação de pareamento de dispositivo que deve ser aprovada.

### Parear pela Control UI (recomendado)

Use uma sessão da Control UI já conectada com acesso `operator.admin`:

1. Abra a Control UI e selecione **Nodes**.
2. Em **Dispositivos**, clique em **Parear dispositivo móvel**.
3. No seu telefone, abra o app OpenClaw → **Configurações** → **Gateway**.
4. Escaneie o código QR ou cole o código de configuração e conecte.

Os apps oficiais do OpenClaw para iOS e Android são aprovados automaticamente quando seus
metadados de código de configuração correspondem. Se **Dispositivos** mostrar uma solicitação pendente (por
exemplo, para um cliente não oficial ou metadados incompatíveis), revise a função e
os escopos antes de aprová-la.

O botão é desabilitado quando a sessão atual da Control UI não tem
acesso de administrador. Nesse caso, use o fluxo de aprovação da CLI abaixo no host do Gateway.

### Parear via Telegram

Se você usa o Plugin `device-pair`, pode fazer o pareamento inicial de dispositivo inteiramente pelo Telegram:

1. No Telegram, envie uma mensagem ao seu bot: `/pair`
2. O bot responde com duas mensagens: uma mensagem de instrução e uma mensagem separada de **código de configuração** (fácil de copiar/colar no Telegram).
3. No seu telefone, abra o app OpenClaw para iOS → Configurações → Gateway.
4. Escaneie o código QR ou cole o código de configuração e conecte.
5. O app móvel oficial conecta automaticamente. Se `/pair pending` mostrar uma
   solicitação, revise sua função e seus escopos antes de aprová-la.

O código de configuração é uma carga JSON codificada em base64 que contém:

- `url`: a URL WebSocket do Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken`: um token bootstrap de curta duração para um único dispositivo usado no handshake inicial de pareamento

Esse token bootstrap carrega o perfil bootstrap de pareamento integrado:

- o perfil de configuração integrado permite apenas a linha de base nova de QR/código de configuração:
  `node` mais uma transferência `operator` delimitada
- o token `node` transferido permanece `scopes: []`
- o token `operator` transferido é limitado a `operator.approvals`,
  `operator.read`, `operator.talk.secrets` e `operator.write`
- `operator.admin` não é concedido pelo bootstrap de QR/código de configuração; ele exige um
  pareamento de operador aprovado separado ou fluxo de token
- rotações/revogações posteriores de token permanecem delimitadas tanto pelo contrato de função aprovado
  do dispositivo quanto pelos escopos de operador da sessão chamadora

Trate o código de configuração como uma senha enquanto ele estiver válido.

Para Tailscale, pareamento móvel público ou outro pareamento remoto, use Tailscale Serve/Funnel
ou outra URL `wss://` do Gateway. Códigos de configuração em texto claro `ws://` são aceitos somente
para local loopback, endereços de LAN privada, hosts Bonjour `.local` e o host do emulador
Android. Endereços CGNAT da tailnet, nomes `.ts.net` e hosts públicos ainda
falham fechados antes da emissão do QR/código de configuração.

### Aprovar um dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando uma aprovação explícita é negada porque a sessão de dispositivo pareado aprovadora
foi aberta com escopo somente de pareamento, a CLI tenta novamente a mesma solicitação com
`operator.admin`. Isso permite que um dispositivo pareado existente com capacidade de administrador recupere um novo
pareamento de Control UI/navegador sem editar `devices/paired.json` manualmente. O
Gateway ainda valida a conexão tentada novamente; tokens que não conseguem autenticar
com `operator.admin` permanecem bloqueados.

Se o mesmo dispositivo tentar novamente com detalhes de autenticação diferentes (por exemplo, função/escopos/chave pública
diferentes), a solicitação pendente anterior é substituída e um novo
`requestId` é criado.

<Note>
Um dispositivo já pareado não recebe acesso mais amplo silenciosamente. Se ele se reconectar pedindo mais escopos ou uma função mais ampla, o OpenClaw mantém a aprovação existente como está e cria uma nova solicitação pendente de upgrade. Use `openclaw devices list` para comparar o acesso atualmente aprovado com o acesso recém-solicitado antes de aprovar.
</Note>

### Aprovação automática opcional de Node por CIDR confiável

O pareamento de dispositivos permanece manual por padrão. Para redes de Node rigidamente controladas,
você pode optar pela aprovação automática inicial de Node com CIDRs explícitos ou IPs exatos:

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

Isso se aplica somente a novas solicitações de pareamento `role: node` sem
escopos solicitados. Clientes operador, navegador, Control UI e WebChat ainda exigem aprovação
manual. Mudanças de função, escopo, metadados e chave pública ainda exigem aprovação
manual.

### Armazenamento de estado de pareamento de Node

Armazenado em `~/.openclaw/devices/`:

- `pending.json` (curta duração; solicitações pendentes expiram)
- `paired.json` (dispositivos pareados + tokens)

### Observações

- A API legada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) é um
  armazenamento de pareamento separado, de propriedade do gateway. Nodes WS ainda exigem pareamento de dispositivo.
- O registro de pareamento é a fonte durável da verdade para funções aprovadas. Tokens de dispositivo
  ativos permanecem delimitados a esse conjunto de funções aprovado; uma entrada de token avulsa
  fora das funções aprovadas não cria novo acesso.

## Documentos relacionados

- Modelo de segurança + injeção de prompt: [Segurança](/pt-BR/gateway/security)
- Atualização segura (executar doctor): [Atualização](/pt-BR/install/updating)
- Configurações de canais:
  - Telegram: [Telegram](/pt-BR/channels/telegram)
  - WhatsApp: [WhatsApp](/pt-BR/channels/whatsapp)
  - Signal: [Signal](/pt-BR/channels/signal)
  - iMessage: [iMessage](/pt-BR/channels/imessage)
  - Discord: [Discord](/pt-BR/channels/discord)
  - Slack: [Slack](/pt-BR/channels/slack)
