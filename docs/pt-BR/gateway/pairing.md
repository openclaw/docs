---
read_when:
    - Implementação de aprovações de pareamento de Node sem a interface do macOS
    - Adição de fluxos da CLI para aprovar nodes remotos
    - Estendendo o protocolo do Gateway com gerenciamento de Nodes
summary: 'Aprovações de recursos do Node: como os Nodes obtêm exposição de comandos após o pareamento do dispositivo'
title: Emparelhamento de Node
x-i18n:
    generated_at: "2026-07-12T15:17:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

O pareamento de Node tem duas camadas, ambas armazenadas no registro do dispositivo pareado no
banco de dados de estado SQLite do Gateway:

- **Pareamento de dispositivo** (função `node`) controla o handshake `connect`. Consulte
  [Aprovação automática de dispositivos por CIDR confiável](#trusted-cidr-device-auto-approval)
  abaixo e [Pareamento de canal](/pt-BR/channels/pairing).
- **Aprovação de recursos do Node** (`node.pair.*`) controla quais
  recursos/comandos declarados um Node conectado pode expor. O Gateway é a
  fonte da verdade; as interfaces (aplicativo para macOS, interface de controle) são frontends que aprovam ou
  rejeitam solicitações pendentes.

O antigo armazenamento independente de pareamento de Node (`nodes/paired.json` com um token por Node,
retirado do fluxo de conexão em janeiro de 2026) não existe mais: os gateways incorporam
quaisquer linhas restantes aos registros de dispositivos uma vez durante a inicialização e arquivam os
arquivos legados com o sufixo `.migrated`. O suporte à ponte TCP legada foi
removido.

## Como funciona a aprovação de recursos

1. Um Node se conecta ao WS do Gateway (o pareamento de dispositivo controla esta etapa).
2. O Gateway compara a superfície de recursos/comandos declarada com a
   aprovada; superfícies novas ou ampliadas armazenam uma **solicitação pendente** no
   registro do dispositivo e emitem `node.pair.requested`.
3. Você aprova ou rejeita a solicitação (CLI ou interface).
4. Até a aprovação, os comandos do Node permanecem filtrados; a aprovação expõe a superfície
   declarada, sujeita à política normal de comandos.

As solicitações pendentes expiram automaticamente **5 minutos após a última
tentativa do Node** — um Node que está se reconectando ativamente mantém sua única solicitação pendente ativa,
em vez de gerar uma nova solicitação (e um prompt de aprovação) a cada tentativa.

## Fluxo de trabalho da CLI (adequado para ambientes sem interface gráfica)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra os Nodes pareados/conectados e seus recursos.

## Superfície da API (protocolo do Gateway)

Eventos:

- `node.pair.requested` - emitido quando uma nova solicitação pendente é criada.
- `node.pair.resolved` - emitido quando uma solicitação é aprovada, rejeitada ou
  expira.

Métodos:

- `node.pair.list` - lista Nodes pendentes e pareados (`operator.pairing`).
- `node.pair.approve` - aprova uma solicitação pendente.
- `node.pair.reject` - rejeita uma solicitação pendente.
- `node.pair.remove` - remove um Node pareado. Isso revoga a função `node` do dispositivo
  no armazenamento de dispositivos pareados, remove junto a superfície aprovada do Node e
  invalida/desconecta as sessões com função de Node desse dispositivo. Um dispositivo com **múltiplas funções**
  (por exemplo, um que também tenha `operator`) mantém sua linha e perde apenas
  a função `node`; a linha de um dispositivo somente de Node é excluída. Autorização:
  `operator.pairing` pode remover linhas de Nodes que não sejam operadores; um chamador com token de dispositivo
  que revogue sua **própria** função de Node em um dispositivo com múltiplas funções também precisa de
  `operator.admin`.
- `node.rename` - renomeia o nome de exibição de um Node pareado voltado ao operador.

Removidos na versão 2026.7: `node.pair.request` e `node.pair.verify`. As solicitações
pendentes são criadas pelo próprio Gateway durante as conexões de Nodes, e o
token independente por Node ao qual eles davam suporte não existe mais; a autenticação do Node usa o
token de pareamento do dispositivo.

Observações:

- Reconexões com uma superfície inalterada reutilizam a solicitação pendente; solicitações
  repetidas atualizam os metadados armazenados do Node e o snapshot mais recente dos
  comandos declarados incluídos na lista de permissões para visibilidade do operador.
- Os níveis de escopo do operador e as verificações realizadas no momento da aprovação estão resumidos em
  [Escopos do operador](/pt-BR/gateway/operator-scopes).
- `node.pair.approve` usa os comandos declarados da solicitação pendente para aplicar
  escopos adicionais de aprovação:
  - solicitação sem comandos: `operator.pairing`
  - solicitação de comando não relacionado à execução: `operator.pairing` + `operator.write`
  - solicitação de `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
A aprovação do pareamento de Node registra a superfície de recursos confiável. Ela **não** fixa a superfície ativa de comandos do Node individualmente.

- Os comandos ativos do Node vêm do que ele declara ao se conectar, filtrados pela
  política global de comandos de Node do Gateway (`gateway.nodes.allowCommands` e
  `denyCommands`).
- A política por Node de permissão e consulta para `system.run` reside no Node em
  `exec.approvals.node.*`, e não no registro de pareamento.

</Warning>

## Controle de comandos do Node (2026.3.31+)

<Warning>
**Alteração incompatível:** a partir da versão `2026.3.31`, os comandos de Node ficam desativados até que o pareamento de Node seja aprovado. Somente o pareamento de dispositivo não é mais suficiente para expor os comandos declarados do Node.
</Warning>

Quando um Node se conecta pela primeira vez, o pareamento é solicitado automaticamente.
Até que essa solicitação seja aprovada, todos os comandos pendentes desse Node são
filtrados e não serão executados. Após a aprovação do pareamento, os comandos
declarados do Node ficam disponíveis, sujeitos à política normal de comandos.

Isso significa:

- Os Nodes que anteriormente dependiam apenas do pareamento de dispositivo para expor comandos agora também
  precisam concluir o pareamento de Node.
- Os comandos enfileirados antes da aprovação do pareamento são descartados, não adiados.

## Limites de confiança de eventos do Node (2026.3.31+)

<Warning>
**Alteração incompatível:** as execuções originadas por Nodes agora permanecem em uma superfície confiável reduzida.
</Warning>

Resumos originados do Node e eventos de sessão relacionados são restritos à
superfície confiável pretendida. Fluxos orientados por notificações ou acionados
pelo Node que anteriormente dependiam de um acesso mais amplo às ferramentas do
host ou da sessão talvez precisem de ajustes. Esse reforço impede que eventos do
Node escalem para acesso a ferramentas no nível do host além do que o limite de
confiança do Node permite.

As atualizações duráveis de presença do Node seguem o mesmo limite de identidade:
o evento `node.presence.alive` é aceito somente de sessões autenticadas de
dispositivos Node e atualiza os metadados de pareamento somente quando a
identidade do dispositivo/Node já está pareada. Um valor de `client.id`
autodeclarado não é suficiente para gravar o estado da última atividade.

## Aprovação automática de dispositivo verificada por SSH (padrão)

O primeiro pareamento de dispositivo com `role: node` a partir de um endereço
privado/CGNAT é aprovado automaticamente quando o Gateway consegue **comprovar
a propriedade da máquina por SSH**: ele se conecta de volta ao host do
pareamento (`BatchMode`, `StrictHostKeyChecking=yes`), executa
`openclaw node identity --json` nele e aprova somente quando o ID e a chave
pública do dispositivo remoto correspondem exatamente à solicitação pendente.
A correspondência da chave é o que torna isso seguro: apenas a acessibilidade
nunca resulta em aprovação; portanto, cotitulares de NAT, outros usuários em um
host compartilhado e falsificação na LAN são todos encaminhados para a
solicitação normal.

Ativado por padrão. Requisitos para que seja acionado:

- O usuário do processo do Gateway (ou `sshVerify.user`) consegue acessar o host
  do Node por SSH de forma não interativa (chaves/agente; o SSH do Tailscale
  também funciona), e a chave do host já é confiável.
- `openclaw` é resolvido no `PATH` remoto para `sh -lc` não interativo.
- O IP de conexão é um endereço privado, ULA, link-local ou CGNAT direto (sem
  proxy e sem loopback), ou corresponde a `sshVerify.cidrs` quando definido.
- Mesmo nível mínimo de elegibilidade da aprovação por CIDR confiável: somente
  pareamento novo de Node sem escopos; upgrades, navegadores, Control UI e
  WebChat sempre exigem confirmação.

Enquanto uma sondagem está em execução, o cliente Node é instruído a continuar
tentando (`wait_then_retry`) em vez de pausar para aprovação manual; se a
sondagem falhar, a próxima tentativa recorrerá ao fluxo normal de confirmação.
Alvos com falha entram em um breve período de espera (5 minutos após uma
incompatibilidade de chave).

Os dispositivos aprovados registram `approvedVia: "ssh-verified"` e sua primeira
superfície de recursos declarada é aprovada na mesma etapa — a correspondência
da chave já comprova que o Node é executado com a conta do operador em uma
máquina de sua propriedade, que é a mesma alegação feita por uma aprovação
manual de recursos. Upgrades posteriores da superfície ainda exigem
confirmação.

Reforce a segurança ou desative:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Desative completamente:
        sshVerify: false,
        // ...ou restrinja/ajuste a sondagem:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Aprovação automática (aplicativo para macOS)

O aplicativo para macOS pode tentar uma **aprovação silenciosa** de solicitações
de recursos do Node quando:

- a solicitação está marcada como `silent` (o Gateway marca a primeira
  superfície de recursos como silenciosa quando o pareamento do dispositivo
  foi aprovado de forma não interativa); e
- o aplicativo consegue verificar uma conexão SSH com o host do Gateway usando
  o mesmo usuário.

Se a aprovação silenciosa falhar, ele recorrerá à solicitação normal
Approve/Reject.

## Aprovação automática de dispositivo por CIDR confiável

O pareamento de dispositivo WS para `role: node` permanece manual por padrão.
Para redes privadas de Nodes nas quais o Gateway já confia no caminho de rede,
os operadores podem ativá-lo explicitamente com CIDRs ou IPs exatos:

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

Limite de segurança:

- Desativado quando `gateway.nodes.pairing.autoApproveCidrs` não está definido.
- Não existe um modo de aprovação automática geral para LAN ou rede privada; a
  aprovação automática verificada por SSH (acima) exige uma correspondência
  criptográfica da chave do dispositivo, nunca apenas a localidade da rede.
- Somente uma nova solicitação de pareamento de dispositivo com `role: node`,
  sem escopos solicitados, é elegível.
- Clientes de operador, navegador, Control UI e WebChat permanecem manuais.
- Upgrades de função, escopo, metadados e chave pública permanecem manuais.
- Caminhos de cabeçalho de proxy confiável em loopback no mesmo host não são
  elegíveis, pois esse caminho pode ser falsificado por chamadores locais.

## Limpeza de pareamentos silenciosos substituídos

Aprovações não interativas registram sua procedência na linha do dispositivo
pareado: aprovações de política local no mesmo host como `silent`, aprovações de
Node por CIDR confiável como `trusted-cidr` e aprovações de Node verificadas por
SSH como `ssh-verified`. Clientes cujo diretório de estado é efêmero (diretórios
home temporários, contêineres, sandboxes por execução) geram um novo par de
chaves de dispositivo a cada execução, e cada execução se pareia novamente de
forma silenciosa como um dispositivo totalmente novo — sem limpeza, a lista de
pareados cresce em uma linha obsoleta por execução.

Quando o Gateway aprova silenciosamente um pareamento de dispositivo **local**,
ele desativa registros mais antigos aprovados como `silent` que pertencem ao
mesmo cluster de clientes (com `clientId`, `clientMode` e nome de exibição
correspondentes) e não estão conectados no momento. Os clientes locais são
executados no próprio host do Gateway, portanto a chave do cluster não pode
corresponder a outra máquina. As linhas desativadas perdem seus tokens
imediatamente; qualquer entrada correspondente de pareamento legado de Node é
removida, e um evento de remoção `node.pair.resolved` é transmitido.

Limites:

- Somente registros cuja aprovação mais recente ocorreu localmente no mesmo host
  (`silent`) são elegíveis, tanto como acionador quanto como alvo. Pareamentos
  por CIDR confiável e verificados por SSH atravessam hosts nos quais os
  metadados de exibição não representam uma identidade de máquina, portanto
  nunca são removidos automaticamente — use a limpeza da Control UI ou
  `openclaw nodes remove` para esses casos.
- Pareamentos aprovados pelo proprietário e por QR/código de configuração
  (bootstrap) nunca são removidos automaticamente. Registros aprovados antes da
  existência das informações de procedência permanecem protegidos, mesmo após
  uma aprovação silenciosa posterior do mesmo ID de dispositivo.
- Dispositivos conectados no momento são ignorados, portanto sessões locais
  simultâneas com diretórios de estado separados mantêm seus tokens enquanto
  estiverem ativas. Registros aprovados no último minuto também são ignorados,
  para que handshakes de pareamento simultâneos não desativem uns aos outros
  antes que suas conexões sejam registradas.
- Os clientes afetados são locais por definição, portanto se pareiam novamente
  de forma silenciosa na próxima conexão.

## Aprovação automática de upgrade de metadados

Quando um dispositivo já pareado se reconecta apenas com alterações de
metadados não confidenciais (por exemplo, nome de exibição ou indicações da
plataforma do cliente), o OpenClaw trata isso como um `metadata-upgrade`. A
aprovação automática silenciosa é restrita: aplica-se somente a reconexões
locais confiáveis que não sejam de navegador e que já tenham comprovado a posse
de credenciais locais ou compartilhadas, incluindo reconexões de aplicativos
nativos no mesmo host após alterações nos metadados da versão do sistema
operacional. Clientes de navegador/Control UI e clientes remotos ainda usam o
fluxo explícito de nova aprovação. Upgrades de escopo (de leitura para
gravação/administração) e alterações de chave pública **não** são elegíveis para
aprovação automática de upgrade de metadados; eles permanecem como solicitações
explícitas de nova aprovação.

## Auxiliares de pareamento por QR

`/pair qr` renderiza a carga útil de pareamento como mídia estruturada para que clientes móveis e de
navegador possam digitalizá-la diretamente.

A exclusão de um dispositivo também remove quaisquer solicitações de pareamento pendentes obsoletas desse
ID de dispositivo, para que `nodes pending` não mostre linhas órfãs após uma revogação.

## Localidade e cabeçalhos encaminhados

O pareamento do Gateway trata uma conexão como loopback somente quando tanto o soquete bruto
quanto qualquer evidência de proxy upstream estão de acordo. Se uma solicitação chegar por loopback, mas
contiver evidências dos cabeçalhos `Forwarded`, qualquer `X-Forwarded-*` ou `X-Real-IP`, essas
evidências de cabeçalhos encaminhados invalidam a alegação de localidade de loopback, e o
fluxo de pareamento exige aprovação explícita em vez de tratar silenciosamente a
solicitação como uma conexão no mesmo host. Consulte
[Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth) para ver a regra equivalente na
autenticação do operador.

## Armazenamento (local, privado)

O estado de pareamento reside nos registros dos dispositivos pareados no banco de dados de estado SQLite
compartilhado, no diretório de estado do Gateway (padrão: `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (dispositivos pareados com autenticação de dispositivo,
  superfícies de Node aprovadas, solicitações de superfície pendentes, solicitações de pareamento de dispositivo
  pendentes e tokens de bootstrap)

Se você substituir `OPENCLAW_STATE_DIR`, o banco de dados será movido junto com ele. Gateways
atualizados de versões com armazenamentos JSON os importam na inicialização e mantêm
os arquivos `devices/*.json.migrated` e `nodes/*.json.migrated`.

Observações de segurança:

- Os tokens de dispositivo são segredos; trate o banco de dados de estado como confidencial.
- A rotação de um token de dispositivo usa `openclaw devices rotate` /
  `device.token.rotate`.

## Comportamento do transporte

- O transporte é **sem estado**; ele não armazena a associação.
- Se o Gateway estiver offline ou o pareamento estiver desativado, os Nodes não poderão ser pareados.
- No modo remoto, o pareamento ocorre no armazenamento do Gateway remoto.

## Relacionado

- [Pareamento de canais](/pt-BR/channels/pairing)
- [CLI de Nodes](/pt-BR/cli/nodes)
- [CLI de dispositivos](/pt-BR/cli/devices)
