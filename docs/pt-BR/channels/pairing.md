---
read_when:
    - Configurando o controle de acesso a mensagens diretas
    - Emparelhamento de um novo Node iOS/Android
    - Análise da postura de segurança do OpenClaw
summary: 'Visão geral do pareamento: aprove quem pode enviar mensagens diretas para você e quais nodes podem ingressar'
title: Pareamento
x-i18n:
    generated_at: "2026-07-16T12:13:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ef58100d222604ab2f0e073c268750eb0996b598dc37b3d4ca20a444d2c69f1e
    source_path: channels/pairing.md
    workflow: 16
---

"Pareamento" é a etapa explícita de aprovação de acesso do OpenClaw.
Ela é usada em dois lugares:

1. **Pareamento de MD** (quem tem permissão para conversar com o bot)
2. **Pareamento de Node** (quais dispositivos/nodes têm permissão para ingressar na rede do Gateway)

Contexto de segurança: [Segurança](/pt-BR/gateway/security)

## 1) Pareamento de MD (acesso a conversas recebidas)

Quando um canal é configurado com a política de MD `pairing`, remetentes desconhecidos recebem um código curto, e a mensagem deles **não é processada** até que seja aprovada.

As políticas padrão de MD estão documentadas em: [Segurança](/pt-BR/gateway/security)

`dmPolicy: "open"` só é público quando a lista de permissões efetiva de MD inclui `"*"`.
A configuração e a validação exigem esse curinga para configurações abertas ao público. Se o estado
existente contiver `open` com entradas concretas em `allowFrom`, o runtime ainda admitirá
somente esses remetentes, e as aprovações do armazenamento de pareamento não ampliarão o acesso de `open`.

Códigos de pareamento:

- 8 caracteres, em maiúsculas, sem caracteres ambíguos (`0O1I`).
- **Expiram após 1 hora**. O bot só envia a mensagem de pareamento quando uma nova solicitação é criada (aproximadamente uma vez por hora para cada remetente).
- As solicitações pendentes de pareamento de MD são limitadas a **3 por conta de canal**; solicitações adicionais são ignoradas até que uma expire ou seja aprovada.

### Aprovar um remetente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Adicione `--notify` ao comando de aprovação para notificar o solicitante no mesmo canal. Canais com várias contas aceitam `--account <id>`.

Se ainda não houver um proprietário de comandos configurado, aprovar um código de pareamento de MD também inicializará
`commands.ownerAllowFrom` com o remetente aprovado, como `telegram:123456789`.
Isso fornece às configurações iniciais um proprietário explícito para comandos privilegiados e solicitações
de aprovação de execução. Depois que existir um proprietário, aprovações de pareamento posteriores concederão apenas
acesso a MD; elas não adicionarão outros proprietários.

Canais compatíveis (qualquer Plugin de canal instalado que declare pareamento; plugins externos como `openclaw-weixin` podem adicionar outros): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

### Grupos reutilizáveis de remetentes

Use `accessGroups` no nível superior quando o mesmo conjunto de remetentes confiáveis precisar ser aplicado a
vários canais de mensagens ou às listas de permissões de MD e de grupos.

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

Os grupos de acesso estão documentados em detalhes aqui: [Grupos de acesso](/pt-BR/channels/access-groups)

### Onde o estado fica armazenado

Armazenado no banco de dados SQLite de estado compartilhado em
`~/.openclaw/state/openclaw.sqlite`:

- solicitações pendentes em `channel_pairing_requests`
- remetentes aprovados em `channel_pairing_allow_entries`

Comportamento do escopo por conta:

- cada solicitação e remetente aprovado é identificado por canal e conta
- o runtime lê apenas as linhas canônicas do SQLite; ele não mescla arquivos legados

Gateways mais antigos gravavam `<channel>-pairing.json` e
`<channel>-<accountId>-allowFrom.json` em `~/.openclaw/credentials/`.
A migração na inicialização e `openclaw doctor --fix` importam esses arquivos para o SQLite e
removem cada origem após uma importação bem-sucedida. Trate o banco de dados SQLite como
confidencial, pois essas linhas controlam o acesso ao seu assistente.

<Note>
O armazenamento da lista de permissões de pareamento destina-se ao acesso a MD. A autorização de grupos é separada.
Aprovar um código de pareamento de MD não permite automaticamente que esse remetente execute
comandos de grupo nem controle o bot em grupos. A inicialização do primeiro proprietário é um estado de configuração
separado em `commands.ownerAllowFrom`, e a entrega em conversas de grupo ainda segue as
listas de permissões de grupo do canal (por exemplo, `groupAllowFrom`, `groups` ou substituições por grupo
ou por tópico, dependendo do canal).
</Note>

## 2) Pareamento de dispositivo Node (nodes iOS/Android/macOS/headless)

Os nodes se conectam ao Gateway como **dispositivos** com `role: node`. O Gateway
cria uma solicitação de pareamento de dispositivo que precisa ser aprovada.

### Parear pela interface de controle (recomendado)

Use uma sessão já conectada da interface de controle com acesso a `operator.admin`:

1. Abra a interface de controle e acesse **Settings → Devices**.
2. Na página **Devices**, clique em **Pair mobile device**.
3. Mantenha **Full access (recommended)** ou selecione **Limited access** para omitir
   os controles administrativos do Gateway.
4. Clique em **Create setup code**.
5. No telefone, abra o aplicativo OpenClaw → **Settings** → **Gateway**.
6. Escaneie o código QR ou cole o código de configuração e conecte-se.

Os aplicativos oficiais do OpenClaw para iOS e Android são aprovados automaticamente quando seus
metadados do código de configuração correspondem. Se **Pending approval** exibir uma solicitação (por
exemplo, para um cliente não oficial ou metadados divergentes), revise a função e
os escopos antes de aprová-la.

O botão fica desativado quando a sessão atual da interface de controle não tem
acesso de administrador. Nesse caso, use o fluxo de aprovação pela CLI abaixo no host do Gateway.

### Parear pelo Telegram

Se você usa o Plugin `device-pair`, pode fazer o pareamento inicial do dispositivo inteiramente pelo Telegram:

1. No Telegram, envie uma mensagem ao bot: `/pair`
2. O bot responde com duas mensagens: uma mensagem de instruções e uma mensagem separada com o **código de configuração** (fácil de copiar e colar no Telegram).
3. No telefone, abra o aplicativo OpenClaw para iOS → Settings → Gateway.
4. Escaneie o código QR (`/pair qr`) ou cole o código de configuração e conecte-se.
5. O aplicativo móvel oficial se conecta automaticamente. Se `/pair pending` exibir uma
   solicitação, revise a função e os escopos antes de aprová-la.

O código de configuração é uma carga JSON codificada em base64 que contém:

- `url`: a URL WebSocket do Gateway (`ws://...` ou `wss://...`)
- `urls`: quando disponíveis, as rotas LAN/Tailnet ordenadas que o aplicativo móvel pode tentar
- `bootstrapToken`: um token de inicialização de uso único para o handshake inicial de pareamento; o Gateway o invalida após 10 minutos

Execute `/pair cleanup` para invalidar códigos de configuração não utilizados após o término do pareamento.

Esse token de inicialização carrega o perfil integrado de inicialização de pareamento:

- uma configuração segura de `wss://` (ou loopback no mesmo host) usa por padrão `node`, além de acesso
  nativo móvel completo a `operator`
- o token `node` transferido permanece `scopes: []`
- o token `operator` transferido por padrão inclui `operator.admin`,
  `operator.approvals`, `operator.read`, `operator.talk.secrets` e
  `operator.write`
- **Limited access** da interface de controle e `openclaw qr --limited` omitem
  `operator.admin`, mantendo os outros escopos de operador
- a configuração de `ws://` em texto simples na LAN usa automaticamente o mesmo perfil limitado;
  configure `wss://` ou o Tailscale Serve e gere um novo código para obter acesso completo
- a rotação/revogação posterior do token permanece limitada tanto pelo contrato de função aprovado
  do dispositivo quanto pelos escopos de operador da sessão que fez a chamada

Trate o código de configuração como uma senha enquanto ele for válido.

As páginas **Settings → Gateway** do iOS e Android mostram acesso **Full** ou **Limited**.
Para atualizar um telefone limitado, primeiro configure uma rota segura de `wss://` ou
do Tailscale Serve, depois gere um novo código de configuração de acesso completo, escaneie-o ou cole-o
nessa página de configurações e reconecte-se.

Para pareamento móvel pelo Tailscale, público ou outro acesso remoto, use o Tailscale Serve/Funnel
ou outra URL do Gateway com `wss://`. Códigos de configuração de `ws://` em texto simples são aceitos apenas
para loopback, endereços de LAN privada, hosts Bonjour `.local` e o host do
emulador Android. Rotas em texto simples que não sejam de loopback recebem acesso limitado. Endereços
CGNAT da Tailnet, nomes `.ts.net` e hosts públicos continuam bloqueados por padrão antes
da emissão do QR/código de configuração.

Para URLs de configuração `gateway.bind=lan`, o OpenClaw detecta raízes HTTPS persistentes do Tailscale Serve
que encaminham a porta de loopback do Gateway ativo e as anuncia
junto com a rota de LAN. O comando de configuração adiciona esse fallback apenas
para `lan`; `custom` e `tailnet` mantêm suas rotas explicitamente anunciadas. O
aplicativo para iOS testa as rotas anunciadas em ordem e salva o primeiro
endpoint acessível.

### Aprovar um dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando uma aprovação explícita é negada porque a sessão do dispositivo pareado
que está aprovando foi aberta apenas com o escopo de pareamento, a CLI tenta novamente a mesma solicitação com
`operator.admin`. Isso permite que um dispositivo pareado existente com capacidade administrativa recupere um novo
pareamento da interface de controle/navegador sem editar manualmente o armazenamento de pareamento. O
Gateway ainda valida a nova tentativa de conexão; tokens que não conseguem se autenticar
com `operator.admin` continuam bloqueados.

Se o mesmo dispositivo tentar novamente com detalhes de autenticação diferentes (por exemplo, outra
função, outros escopos ou outra chave pública), a solicitação pendente anterior será substituída e um novo
`requestId` será criado.

<Note>
Um dispositivo já pareado não obtém acesso mais amplo silenciosamente. Se ele se reconectar solicitando mais escopos ou uma função mais ampla, o OpenClaw manterá a aprovação existente sem alterações e criará uma nova solicitação pendente de atualização. Use `openclaw devices list` para comparar o acesso atualmente aprovado com o novo acesso solicitado antes de aprovar.
</Note>

### Aprovação automática opcional de nodes por CIDR confiável

O pareamento de dispositivos permanece manual por padrão. Para redes de nodes estritamente controladas,
é possível habilitar a aprovação automática do primeiro pareamento de node com CIDRs ou IPs exatos explícitos:

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

Isso se aplica apenas a novas solicitações de pareamento `role: node` sem
escopos solicitados. Clientes de operador, navegador, interface de controle e WebChat ainda exigem aprovação
manual. Alterações de função, escopo, metadados e chave pública ainda exigem aprovação
manual.

### Armazenamento do estado de pareamento de Node

Armazenado no banco de dados SQLite de estado compartilhado em `~/.openclaw/state/openclaw.sqlite`:

- solicitações pendentes de pareamento de dispositivos (de curta duração; expiram após 5 minutos)
- dispositivos pareados + tokens

Gateways mais antigos mantinham esse estado em `~/.openclaw/devices/*.json`; esses arquivos são
importados para o SQLite na inicialização do Gateway e arquivados com o sufixo `.migrated`.

### Observações

- A API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) gerencia
  as aprovações de recursos do Node armazenadas nos mesmos registros de dispositivos pareados. Nodes WS
  ainda exigem pareamento de dispositivo; consulte [Pareamento de Node](/pt-BR/gateway/pairing).
- O registro de pareamento é a fonte da verdade durável para as funções aprovadas. Tokens de
  dispositivos ativos permanecem limitados a esse conjunto de funções aprovado; uma entrada de token isolada
  fora das funções aprovadas não cria novo acesso.

## Documentação relacionada

- Modelo de segurança + injeção de prompt: [Segurança](/pt-BR/gateway/security)
- Atualização segura (execute o doctor): [Atualização](/pt-BR/install/updating)
- Configurações de canais:
  - Telegram: [Telegram](/pt-BR/channels/telegram)
  - WhatsApp: [WhatsApp](/pt-BR/channels/whatsapp)
  - Signal: [Signal](/pt-BR/channels/signal)
  - iMessage: [iMessage](/pt-BR/channels/imessage)
  - Discord: [Discord](/pt-BR/channels/discord)
  - Slack: [Slack](/pt-BR/channels/slack)
