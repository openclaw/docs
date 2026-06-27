---
read_when:
    - Configurando o controle de acesso a DMs
    - Pareando um novo nó iOS/Android
    - Analisando a postura de segurança do OpenClaw
summary: 'Visão geral do emparelhamento: aprove quem pode enviar DM para você + quais nós podem entrar'
title: Emparelhamento
x-i18n:
    generated_at: "2026-06-27T17:11:55Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 92870489b62aeec710f49ec92908f4b83c7d9ee2ce34174b42e283839748e549
    source_path: channels/pairing.md
    workflow: 16
---

"Pareamento" é a etapa explícita de aprovação de acesso do OpenClaw.
Ela é usada em dois lugares:

1. **Pareamento por DM** (quem tem permissão para falar com o bot)
2. **Pareamento de Node** (quais dispositivos/nós têm permissão para entrar na rede do Gateway)

Contexto de segurança: [Segurança](/pt-BR/gateway/security)

## 1) Pareamento por DM (acesso de chat de entrada)

Quando um canal é configurado com a política de DM `pairing`, remetentes desconhecidos recebem um código curto e a mensagem deles **não é processada** até você aprovar.

As políticas padrão de DM são documentadas em: [Segurança](/pt-BR/gateway/security)

`dmPolicy: "open"` é público somente quando a lista efetiva de permissões de DM inclui `"*"`.
A configuração e a validação exigem esse curinga para configurações públicas abertas. Se o estado existente
contiver `open` com entradas concretas de `allowFrom`, o runtime ainda admitirá
somente esses remetentes, e aprovações no armazenamento de pareamento não ampliam o acesso `open`.

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
`commands.ownerAllowFrom` com o remetente aprovado, como `telegram:123456789`.
Isso dá às configurações iniciais um proprietário explícito para comandos privilegiados e prompts de aprovação
de exec. Depois que um proprietário existe, aprovações de pareamento posteriores concedem apenas acesso por DM;
elas não adicionam mais proprietários.

Canais compatíveis: `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `openclaw-weixin`, `signal`, `slack`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupos de remetentes reutilizáveis

Use `accessGroups` no nível superior quando o mesmo conjunto de remetentes confiáveis deve se aplicar a
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

Os grupos de acesso são documentados em detalhes aqui: [Grupos de acesso](/pt-BR/channels/access-groups)

### Onde o estado fica

Armazenado em `~/.openclaw/credentials/`:

- Solicitações pendentes: `<channel>-pairing.json`
- Armazenamento da lista de permissões aprovada:
  - Conta padrão: `<channel>-allowFrom.json`
  - Conta não padrão: `<channel>-<accountId>-allowFrom.json`

Comportamento de escopo de conta:

- Contas não padrão leem/gravam apenas o arquivo de lista de permissões com escopo próprio.
- A conta padrão usa o arquivo de lista de permissões sem escopo, com escopo do canal.

Trate esses arquivos como sensíveis (eles controlam o acesso ao seu assistente).

<Note>
O armazenamento da lista de permissões de pareamento é para acesso por DM. A autorização de grupo é separada.
Aprovar um código de pareamento por DM não permite automaticamente que esse remetente execute comandos de grupo
ou controle o bot em grupos. A inicialização do primeiro proprietário é um estado de configuração separado
em `commands.ownerAllowFrom`, e a entrega de chat em grupo ainda segue as listas de permissões de grupo do
canal (por exemplo, `groupAllowFrom`, `groups` ou substituições por grupo
ou por tópico, dependendo do canal).
</Note>

## 2) Pareamento de dispositivos Node (nós iOS/Android/macOS/headless)

Nós se conectam ao Gateway como **dispositivos** com `role: node`. O Gateway
cria uma solicitação de pareamento de dispositivo que precisa ser aprovada.

### Parear via Telegram (recomendado para iOS)

Se você usa o Plugin `device-pair`, pode fazer o pareamento inicial de dispositivo inteiramente pelo Telegram:

1. No Telegram, envie uma mensagem ao seu bot: `/pair`
2. O bot responde com duas mensagens: uma mensagem de instruções e uma mensagem separada com o **código de configuração** (fácil de copiar/colar no Telegram).
3. No seu telefone, abra o app OpenClaw para iOS → Settings → Gateway.
4. Escaneie o código QR ou cole o código de configuração e conecte.
5. De volta ao Telegram: `/pair pending` (revise IDs de solicitação, função e escopos), então aprove.

O código de configuração é uma carga JSON codificada em base64 que contém:

- `url`: a URL WebSocket do Gateway (`ws://...` ou `wss://...`)
- `bootstrapToken`: um token de bootstrap de curta duração para um único dispositivo, usado no handshake de pareamento inicial

Esse token de bootstrap carrega o perfil de bootstrap de pareamento integrado:

- o perfil de configuração integrado permite apenas a linha de base nova de QR/código de configuração:
  `node` mais uma transferência limitada de `operator`
- o token `node` transferido permanece `scopes: []`
- o token `operator` transferido é limitado a `operator.approvals`,
  `operator.read` e `operator.write`
- `operator.admin` e `operator.pairing` não são concedidos pelo bootstrap
  de QR/código de configuração; eles exigem um fluxo separado de pareamento ou token de operador aprovado
- a rotação/revogação posterior de tokens continua limitada tanto pelo contrato de função aprovada do dispositivo
  quanto pelos escopos de operador da sessão chamadora

Trate o código de configuração como uma senha enquanto ele for válido.

Para Tailscale, pareamento móvel público ou remoto, use Tailscale Serve/Funnel
ou outra URL de Gateway `wss://`. Códigos de configuração em texto claro `ws://` são aceitos apenas
para loopback, endereços de LAN privada, hosts Bonjour `.local` e o host do emulador
Android. Endereços CGNAT de tailnet, nomes `.ts.net` e hosts públicos ainda
falham de modo fechado antes da emissão de QR/código de configuração.

### Aprovar um dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando uma aprovação explícita é negada porque a sessão do dispositivo pareado aprovador
foi aberta com escopo apenas de pareamento, a CLI tenta novamente a mesma solicitação com
`operator.admin`. Isso permite que um dispositivo pareado existente com capacidade de admin recupere um novo
pareamento da Control UI/navegador sem editar `devices/paired.json` manualmente. O
Gateway ainda valida a conexão tentada novamente; tokens que não conseguem autenticar
com `operator.admin` permanecem bloqueados.

Se o mesmo dispositivo tentar novamente com detalhes de autenticação diferentes (por exemplo, outra
função/escopos/chave pública), a solicitação pendente anterior é substituída e um novo
`requestId` é criado.

<Note>
Um dispositivo já pareado não recebe acesso mais amplo silenciosamente. Se ele reconectar pedindo mais escopos ou uma função mais ampla, o OpenClaw mantém a aprovação existente como está e cria uma nova solicitação pendente de upgrade. Use `openclaw devices list` para comparar o acesso atualmente aprovado com o novo acesso solicitado antes de aprovar.
</Note>

### Autoaprovação opcional de Node por CIDR confiável

O pareamento de dispositivos permanece manual por padrão. Para redes de nós rigidamente controladas,
você pode optar por autoaprovação inicial de nós com CIDRs explícitos ou IPs exatos:

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

Isso se aplica apenas a novas solicitações de pareamento com `role: node` sem
escopos solicitados. Clientes Operator, navegador, Control UI e WebChat ainda exigem aprovação
manual. Alterações de função, escopo, metadados e chave pública ainda exigem aprovação
manual.

### Armazenamento de estado de pareamento de Node

Armazenado em `~/.openclaw/devices/`:

- `pending.json` (curta duração; solicitações pendentes expiram)
- `paired.json` (dispositivos pareados + tokens)

### Observações

- A API legada `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) é um
  armazenamento de pareamento separado pertencente ao gateway. Nós WS ainda exigem pareamento de dispositivos.
- O registro de pareamento é a fonte durável da verdade para funções aprovadas. Tokens de dispositivos
  ativos permanecem limitados a esse conjunto de funções aprovadas; uma entrada avulsa de token
  fora das funções aprovadas não cria novo acesso.

## Documentos relacionados

- Modelo de segurança + injeção de prompt: [Segurança](/pt-BR/gateway/security)
- Atualização segura (execute doctor): [Atualização](/pt-BR/install/updating)
- Configurações de canais:
  - Telegram: [Telegram](/pt-BR/channels/telegram)
  - WhatsApp: [WhatsApp](/pt-BR/channels/whatsapp)
  - Signal: [Signal](/pt-BR/channels/signal)
  - iMessage: [iMessage](/pt-BR/channels/imessage)
  - Discord: [Discord](/pt-BR/channels/discord)
  - Slack: [Slack](/pt-BR/channels/slack)
