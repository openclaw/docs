---
read_when:
    - Configurando o controle de acesso a mensagens diretas
    - Pareando um novo Node iOS/Android
    - Analisando a postura de segurança do OpenClaw
summary: 'Visão geral do pareamento: aprove quem pode enviar mensagens diretas para você e quais nós podem participar'
title: Pareamento
x-i18n:
    generated_at: "2026-07-12T14:55:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 32fcb7c9031afc1e18c9288c201b80aeee7ce8b44eb345492101949ec7c91358
    source_path: channels/pairing.md
    workflow: 16
---

"Emparelhamento" é a etapa explícita de aprovação de acesso do OpenClaw.
Ele é usado em dois lugares:

1. **Emparelhamento de MD** (quem tem permissão para falar com o bot)
2. **Emparelhamento de Node** (quais dispositivos/nós têm permissão para ingressar na rede do Gateway)

Contexto de segurança: [Segurança](/pt-BR/gateway/security)

## 1) Emparelhamento de MD (acesso a conversas recebidas)

Quando um canal está configurado com a política de MD `pairing`, remetentes desconhecidos recebem um código curto, e suas mensagens **não são processadas** até que você aprove.

As políticas padrão de MD estão documentadas em: [Segurança](/pt-BR/gateway/security)

`dmPolicy: "open"` só é público quando a lista efetiva de permissões de MD inclui `"*"`.
A configuração e a validação exigem esse curinga para configurações públicas abertas. Se o
estado existente contiver `open` com entradas específicas em `allowFrom`, o runtime continuará
admitindo somente esses remetentes, e as aprovações no armazenamento de emparelhamento não ampliarão o acesso `open`.

Códigos de emparelhamento:

- 8 caracteres, em maiúsculas, sem caracteres ambíguos (`0O1I`).
- **Expiram após 1 hora**. O bot só envia a mensagem de emparelhamento quando uma nova solicitação é criada (aproximadamente uma vez por hora por remetente).
- As solicitações pendentes de emparelhamento de MD são limitadas a **3 por conta de canal**; solicitações adicionais são ignoradas até que uma expire ou seja aprovada.

### Aprovar um remetente

```bash
openclaw pairing list telegram
openclaw pairing approve telegram <CODE>
```

Adicione `--notify` ao comando de aprovação para avisar o solicitante no mesmo canal. Canais com várias contas aceitam `--account <id>`.

Se nenhum proprietário de comandos tiver sido configurado ainda, aprovar um código de emparelhamento de MD também inicializa
`commands.ownerAllowFrom` com o remetente aprovado, como `telegram:123456789`.
Isso fornece às configurações iniciais um proprietário explícito para comandos privilegiados e solicitações de aprovação
de execução. Depois que um proprietário passa a existir, aprovações de emparelhamento posteriores concedem apenas acesso
a MD; elas não adicionam mais proprietários.

Canais compatíveis (qualquer plugin de canal instalado que declare emparelhamento; plugins externos como `openclaw-weixin` podem adicionar outros): `discord`, `feishu`, `googlechat`, `imessage`, `irc`, `line`, `matrix`, `mattermost`, `msteams`, `nextcloud-talk`, `nostr`, `signal`, `slack`, `sms`, `synology-chat`, `telegram`, `twitch`, `whatsapp`, `zalo`, `zalouser`.

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

Armazenado em `~/.openclaw/credentials/`:

- Solicitações pendentes: `<channel>-pairing.json`
- Armazenamento da lista de permissões aprovada: `<channel>-<accountId>-allowFrom.json` (as aprovações da
  conta padrão usam `<channel>-default-allowFrom.json`)

Comportamento do escopo de contas:

- Contas não padrão leem/gravam somente o arquivo de lista de permissões de seu próprio escopo.
- A conta padrão também continua respeitando um arquivo legado sem escopo `<channel>-allowFrom.json`
  de instalações mais antigas; as entradas dos dois arquivos são mescladas durante a leitura.

Trate esses arquivos como confidenciais (eles controlam o acesso ao seu assistente).

<Note>
O armazenamento da lista de permissões de emparelhamento serve para o acesso a MD. A autorização de grupos é separada.
Aprovar um código de emparelhamento de MD não permite automaticamente que esse remetente execute
comandos de grupo ou controle o bot em grupos. A inicialização do primeiro proprietário é um estado de configuração
separado em `commands.ownerAllowFrom`, e a entrega de conversas em grupo continua seguindo as
listas de permissões de grupo do canal (por exemplo, `groupAllowFrom`, `groups` ou substituições por grupo
ou por tópico, dependendo do canal).
</Note>

## 2) Emparelhamento de dispositivos Node (Nodes iOS/Android/macOS/headless)

Os Nodes se conectam ao Gateway como **dispositivos** com `role: node`. O Gateway
cria uma solicitação de emparelhamento de dispositivo que precisa ser aprovada.

### Emparelhar pela interface de controle (recomendado)

Use uma sessão já conectada da interface de controle com acesso `operator.admin`:

1. Abra a interface de controle e selecione **Nodes**.
2. Na página **Devices**, clique em **Pair mobile device**.
3. No telefone, abra o aplicativo OpenClaw → **Settings** → **Gateway**.
4. Escaneie o código QR ou cole o código de configuração e conecte-se.

Os aplicativos oficiais do OpenClaw para iOS e Android são aprovados automaticamente quando seus
metadados do código de configuração correspondem. Se **Pending approval** exibir uma solicitação (por
exemplo, para um cliente não oficial ou metadados incompatíveis), revise sua função e seus
escopos antes de aprová-la.

O botão fica desativado quando a sessão atual da interface de controle não tem
acesso de administrador. Nesse caso, use o fluxo de aprovação pela CLI abaixo no host do Gateway.

### Emparelhar pelo Telegram

Se você usa o plugin `device-pair`, pode realizar o primeiro emparelhamento de dispositivo inteiramente pelo Telegram:

1. No Telegram, envie uma mensagem ao seu bot: `/pair`
2. O bot responde com duas mensagens: uma mensagem de instruções e uma mensagem separada com o **código de configuração** (fácil de copiar/colar no Telegram).
3. No telefone, abra o aplicativo OpenClaw para iOS → Settings → Gateway.
4. Escaneie o código QR (`/pair qr`) ou cole o código de configuração e conecte-se.
5. O aplicativo móvel oficial se conecta automaticamente. Se `/pair pending` exibir uma
   solicitação, revise sua função e seus escopos antes de aprová-la.

O código de configuração é uma carga JSON codificada em base64 que contém:

- `url`: a URL WebSocket do Gateway (`ws://...` ou `wss://...`)
- `urls`: quando disponíveis, as rotas LAN/Tailnet ordenadas que o aplicativo móvel pode tentar
- `bootstrapToken`: um token de inicialização de uso único para o handshake inicial de emparelhamento; o Gateway o expira após 10 minutos

Execute `/pair cleanup` para invalidar códigos de configuração não utilizados após a conclusão do emparelhamento.

Esse token de inicialização carrega o perfil integrado de inicialização do emparelhamento:

- o perfil de configuração integrado permite apenas a linha de base do novo QR/código de configuração:
  `node` mais uma transferência limitada de `operator`
- o token `node` transferido permanece com `scopes: []`
- o token `operator` transferido é limitado a `operator.approvals`,
  `operator.read`, `operator.talk.secrets` e `operator.write`
- `operator.admin` não é concedido pela inicialização via QR/código de configuração; ele exige um
  fluxo separado de emparelhamento ou token de operador aprovado
- a rotação/revogação posterior de tokens permanece limitada tanto pelo contrato de função aprovado
  do dispositivo quanto pelos escopos de operador da sessão chamadora

Trate o código de configuração como uma senha enquanto ele estiver válido.

Para emparelhamento móvel via Tailscale, público ou outro acesso remoto, use Tailscale Serve/Funnel
ou outra URL `wss://` do Gateway. Códigos de configuração `ws://` sem criptografia são aceitos apenas
para loopback, endereços LAN privados, hosts Bonjour `.local` e o host do emulador
Android. Endereços CGNAT da Tailnet, nomes `.ts.net` e hosts públicos continuam
falhando de forma segura antes da emissão do QR/código de configuração.

Para URLs de configuração com `gateway.bind=lan`, o OpenClaw detecta raízes HTTPS persistentes do Tailscale Serve
que encaminham para a porta de loopback do Gateway ativo e as anuncia
junto com a rota LAN. O comando de configuração adiciona esse fallback apenas
para `lan`; `custom` e `tailnet` mantêm suas rotas explicitamente anunciadas. O
aplicativo para iOS testa as rotas anunciadas na ordem e salva o primeiro
endpoint acessível.

### Aprovar um dispositivo Node

```bash
openclaw devices list
openclaw devices approve <requestId>
openclaw devices reject <requestId>
```

Quando uma aprovação explícita é negada porque a sessão do dispositivo emparelhado que está aprovando
foi aberta somente com o escopo de emparelhamento, a CLI tenta novamente a mesma solicitação com
`operator.admin`. Isso permite que um dispositivo emparelhado existente com capacidade de administrador recupere um novo
emparelhamento da interface de controle/navegador sem editar manualmente o armazenamento de emparelhamento. O
Gateway ainda valida a nova tentativa de conexão; tokens que não conseguem se autenticar
com `operator.admin` permanecem bloqueados.

Se o mesmo dispositivo tentar novamente com dados de autenticação diferentes (por exemplo, outra
função, outros escopos ou outra chave pública), a solicitação pendente anterior será substituída, e um novo
`requestId` será criado.

<Note>
Um dispositivo já emparelhado não recebe acesso mais amplo silenciosamente. Se ele se reconectar solicitando mais escopos ou uma função mais ampla, o OpenClaw mantém a aprovação existente inalterada e cria uma nova solicitação pendente de ampliação de acesso. Use `openclaw devices list` para comparar o acesso atualmente aprovado com o novo acesso solicitado antes de aprovar.
</Note>

### Aprovação automática opcional de Nodes por CIDR confiável

O emparelhamento de dispositivos permanece manual por padrão. Para redes de Nodes rigidamente controladas,
você pode habilitar a aprovação automática do primeiro emparelhamento de Node com CIDRs explícitos ou IPs exatos:

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

Isso se aplica somente a novas solicitações de emparelhamento com `role: node` e sem
escopos solicitados. Clientes de operador, navegador, interface de controle e WebChat ainda exigem aprovação
manual. Alterações de função, escopo, metadados e chave pública ainda exigem aprovação
manual.

### Armazenamento do estado de emparelhamento de Nodes

Armazenado no banco de dados de estado SQLite compartilhado em `~/.openclaw/state/openclaw.sqlite`:

- solicitações pendentes de emparelhamento de dispositivos (de curta duração; expiram após 5 minutos)
- dispositivos emparelhados + tokens

Gateways mais antigos mantinham esse estado em `~/.openclaw/devices/*.json`; esses arquivos são
importados para o SQLite na inicialização do Gateway e arquivados com o sufixo `.migrated`.

### Observações

- A API `node.pair.*` (CLI: `openclaw nodes pending|approve|reject|remove|rename`) gerencia
  as aprovações de recursos de Nodes armazenadas nos mesmos registros de dispositivos emparelhados. Nodes WS
  ainda exigem emparelhamento de dispositivo; consulte [Emparelhamento de Nodes](/pt-BR/gateway/pairing).
- O registro de emparelhamento é a fonte durável da verdade para funções aprovadas. Tokens de
  dispositivos ativos permanecem limitados a esse conjunto de funções aprovado; uma entrada de token isolada
  fora das funções aprovadas não cria novo acesso.

## Documentos relacionados

- Modelo de segurança + injeção de prompt: [Segurança](/pt-BR/gateway/security)
- Atualização segura (execute o doctor): [Atualização](/pt-BR/install/updating)
- Configurações de canais:
  - Telegram: [Telegram](/pt-BR/channels/telegram)
  - WhatsApp: [WhatsApp](/pt-BR/channels/whatsapp)
  - Signal: [Signal](/pt-BR/channels/signal)
  - iMessage: [iMessage](/pt-BR/channels/imessage)
  - Discord: [Discord](/pt-BR/channels/discord)
  - Slack: [Slack](/pt-BR/channels/slack)
