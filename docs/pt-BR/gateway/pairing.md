---
read_when:
    - Implementação de aprovações de emparelhamento de Node sem a interface do macOS
    - Adição de fluxos da CLI para aprovar Nodes remotos
    - Estendendo o protocolo do Gateway com gerenciamento de nodes
summary: 'Aprovações de recursos do Node: como os Nodes passam a expor comandos após o pareamento do dispositivo'
title: Emparelhamento de Node
x-i18n:
    generated_at: "2026-07-16T12:33:30Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9e4221d7ad6aa6a9cd8ae33f2d4330c2aa49783340fcf7a657c20d6a94c126d9
    source_path: gateway/pairing.md
    workflow: 16
---

O pareamento de Node tem duas camadas, ambas armazenadas no registro do dispositivo pareado no
banco de dados de estado SQLite do Gateway:

- **Pareamento de dispositivo** (função `node`) controla o handshake `connect`. Consulte
  [Aprovação automática de dispositivo por CIDR confiável](#trusted-cidr-device-auto-approval)
  abaixo e [Pareamento de canal](/pt-BR/channels/pairing).
- **Aprovação de capacidade do Node** (`node.pair.*`) controla quais
  capacidades/comandos declarados um Node conectado pode expor. O Gateway é a
  fonte da verdade; as interfaces (aplicativo macOS, interface de controle) são frontends que aprovam ou
  rejeitam solicitações pendentes.

O antigo armazenamento independente de pareamento de Node (`nodes/paired.json` com um token por Node,
removido do caminho de conexão em janeiro de 2026) não existe mais: os gateways incorporam
as linhas restantes aos registros de dispositivo uma vez durante a inicialização e arquivam os
arquivos legados com um sufixo `.migrated`. O suporte à ponte TCP legada foi
removido.

## Como funciona a aprovação de capacidade

1. Um Node se conecta ao WS do Gateway (o pareamento de dispositivo controla esta etapa).
2. O Gateway compara a superfície de capacidades/comandos declarada com a
   aprovada; superfícies novas ou ampliadas armazenam uma **solicitação pendente** no
   registro do dispositivo e emitem `node.pair.requested`.
3. A solicitação é aprovada ou rejeitada (pela CLI ou interface).
4. Até a aprovação, os comandos do Node permanecem filtrados; a aprovação expõe a superfície
   declarada, sujeita à política normal de comandos.

As solicitações pendentes expiram automaticamente **5 minutos após a última
nova tentativa do Node** — um Node que se reconecta ativamente mantém sua única solicitação pendente ativa,
em vez de gerar uma nova solicitação (e aviso de aprovação) por tentativa.

## Fluxo de trabalho da CLI (adequado para ambientes sem interface gráfica)

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
openclaw nodes reject <requestId>
openclaw nodes status
openclaw nodes remove --node <id|name|ip>
openclaw nodes rename --node <id|name|ip> --name "Living Room iPad"
```

`nodes status` mostra os Nodes pareados/conectados e suas capacidades.

## Superfície da API (protocolo do Gateway)

Eventos:

- `node.pair.requested` - emitido quando uma nova solicitação pendente é criada.
- `node.pair.resolved` - emitido quando uma solicitação é aprovada, rejeitada ou
  expira.

Métodos:

- `node.pair.list` - lista os Nodes pendentes e pareados (`operator.pairing`).
- `node.pair.approve` - aprova uma solicitação pendente.
- `node.pair.reject` - rejeita uma solicitação pendente.
- `node.pair.remove` - remove um Node pareado. Isso revoga a função `node` do dispositivo
  no armazenamento de dispositivos pareados, remove com ela a superfície aprovada do Node e
  invalida/desconecta as sessões desse dispositivo com função de Node. Um dispositivo de **funções mistas**
  (por exemplo, um que também tenha `operator`) mantém sua linha e apenas
  perde a função `node`; a linha de um dispositivo exclusivo de Node é excluída. Autorização:
  `operator.pairing` pode remover linhas de Nodes que não sejam operadores; um chamador com token de dispositivo
  que revogue sua **própria** função de Node em um dispositivo de funções mistas também precisa de
  `operator.admin`.
- `node.rename` - renomeia o nome de exibição de um Node pareado voltado ao operador.

Removidos na versão 2026.7: `node.pair.request` e `node.pair.verify`. As solicitações
pendentes são criadas pelo próprio Gateway durante as conexões dos Nodes, e o
token independente por Node ao qual atendiam não existe mais; a autenticação do Node usa o
token de pareamento do dispositivo.

Observações:

- Reconexões com uma superfície inalterada reutilizam a solicitação pendente; solicitações
  repetidas atualizam os metadados armazenados do Node e o instantâneo mais recente de comandos
  declarados incluídos na lista de permissões para a visibilidade do operador.
- Os níveis de escopo do operador e as verificações realizadas no momento da aprovação estão resumidos em
  [Escopos do operador](/pt-BR/gateway/operator-scopes).
- `node.pair.approve` usa os comandos declarados da solicitação pendente para impor
  escopos adicionais de aprovação:
  - solicitação sem comandos: `operator.pairing`
  - solicitação de comando comum: `operator.pairing` + `operator.write`
  - solicitação sensível à administração contendo `system.run`, `system.run.prepare`,
    `system.which`, `browser.proxy`, `fs.listDir` ou
    `system.execApprovals.get/set`: `operator.pairing` + `operator.admin`

<Warning>
A aprovação do pareamento do Node registra a superfície de capacidades confiável. Ela **não** fixa a superfície ativa de comandos do Node individualmente.

- Os comandos ativos do Node vêm do que ele declara durante a conexão, filtrados pela
  política global de comandos de Node do Gateway (`gateway.nodes.allowCommands` e
  `denyCommands`).
- A política `system.run` de permissão e consulta por Node reside no próprio Node em
  `exec.approvals.node.*`, não no registro de pareamento.

</Warning>

## Controle de comandos do Node (2026.3.31+)

<Warning>
**Alteração incompatível:** a partir de `2026.3.31`, os comandos de Node ficam desabilitados até que o pareamento do Node seja aprovado. Apenas o pareamento do dispositivo não é mais suficiente para expor os comandos declarados do Node.
</Warning>

Quando um Node se conecta pela primeira vez, o pareamento é solicitado automaticamente.
Até que essa solicitação seja aprovada, todos os comandos pendentes desse Node são
filtrados e não serão executados. Depois que o pareamento for aprovado, os comandos
declarados pelo Node ficarão disponíveis, sujeitos à política normal de comandos.

Isso significa:

- Os Nodes que antes dependiam apenas do pareamento de dispositivo para expor comandos agora
  também precisam concluir o pareamento do Node.
- Os comandos enfileirados antes da aprovação do pareamento são descartados, não adiados.

## Limites de confiança dos eventos do Node (2026.3.31+)

<Warning>
**Alteração incompatível:** as execuções originadas por Nodes agora permanecem em uma superfície confiável reduzida.
</Warning>

Os resumos originados por Nodes e os eventos de sessão relacionados são restritos à
superfície confiável pretendida. Fluxos orientados por notificações ou acionados por Nodes que
antes dependiam de um acesso mais amplo às ferramentas do host ou da sessão podem precisar de ajustes.
Esse reforço impede que eventos de Nodes escalem para o acesso a ferramentas no nível do host
além do permitido pelo limite de confiança do Node.

As atualizações duráveis de presença do Node seguem o mesmo limite de identidade: o evento
`node.presence.alive` é aceito somente de sessões autenticadas de dispositivos
Node e atualiza os metadados de pareamento somente quando a identidade do dispositivo/Node
já está pareada. Um valor `client.id` autodeclarado não é suficiente para gravar
o estado da última atividade.

## Aprovação automática de dispositivo verificada por SSH (padrão)

O pareamento inicial de dispositivo `role: node` proveniente de um endereço privado/CGNAT é
aprovado automaticamente quando o Gateway pode **comprovar a propriedade da máquina por SSH**: ele
se conecta de volta ao host do pareamento (`BatchMode`, `StrictHostKeyChecking=yes`),
executa `openclaw node identity --json` nele e aprova somente quando o
ID e a chave pública do dispositivo remoto correspondem exatamente à solicitação pendente. A correspondência da chave é
o que torna isso seguro: apenas a acessibilidade nunca resulta em aprovação, portanto coinquilinos de NAT,
outros usuários em um host compartilhado e falsificação na LAN seguem para o aviso
normal.

Habilitado por padrão. Requisitos para que seja acionado:

- O usuário do processo do Gateway (ou `sshVerify.user`) consegue acessar o host do Node por SSH
  sem interação (chaves/agente; o SSH do Tailscale também funciona), e a chave do host
  já é confiável.
- `openclaw` é resolvido no `PATH` remoto para `sh -lc` não interativo.
- O IP de conexão é um endereço privado, ULA, link-local ou CGNAT direto
  (sem proxy e sem loopback), ou corresponde a `sshVerify.cidrs` quando definido.
- Mesmo requisito mínimo de elegibilidade da aprovação por CIDR confiável: somente um novo pareamento
  de Node sem escopos; atualizações, navegadores, interface de controle e WebChat sempre exibem um aviso.

Enquanto uma sondagem estiver em execução, o cliente do Node será instruído a continuar tentando
(`wait_then_retry`), em vez de pausar para a aprovação manual; se a sondagem
falhar, a próxima tentativa retorna ao fluxo normal de aviso. Os destinos com falha
entram em um breve período de espera (5 minutos após uma incompatibilidade de chave).

Os dispositivos aprovados registram `approvedVia: "ssh-verified"`, e sua primeira superfície de
capacidades declarada é aprovada na mesma etapa — a correspondência da chave já comprova
que o Node é executado sob a conta do operador em uma máquina que ele possui, o que representa a
mesma afirmação de uma aprovação manual de capacidade. Ampliações posteriores da superfície ainda
exibem um aviso.

Reforce a segurança ou desabilite:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Desabilitar completamente:
        sshVerify: false,
        // ...ou definir o escopo/ajustar a sondagem:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Aprovação automática (aplicativo macOS)

O aplicativo macOS pode tentar uma **aprovação silenciosa** das solicitações de capacidade
do Node quando:

- a solicitação está marcada como `silent` (o Gateway marca a primeira superfície de
  capacidades como silenciosa quando o pareamento do dispositivo foi aprovado sem interação), e
- o aplicativo consegue verificar uma conexão SSH com o host do Gateway usando o mesmo
  usuário.

Se a aprovação silenciosa falhar, ela retorna ao aviso normal Approve/Reject.

## Aprovação automática de dispositivo por CIDR confiável

O pareamento de dispositivo por WS para `role: node` permanece manual por padrão. Para redes privadas de
Nodes em que o Gateway já confia no caminho da rede, os operadores podem habilitá-lo
com CIDRs explícitos ou IPs exatos:

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

- Desabilitado quando `gateway.nodes.pairing.autoApproveCidrs` não está definido.
- Não existe um modo de aprovação automática geral para LAN ou rede privada; a aprovação
  automática verificada por SSH (acima) exige uma correspondência criptográfica da chave do dispositivo, nunca
  apenas a localidade da rede.
- Somente uma nova solicitação de pareamento de dispositivo `role: node` sem escopos solicitados é
  elegível.
- Os clientes de operador, navegador, interface de controle e WebChat permanecem manuais.
- As atualizações de função, escopo, metadados e chave pública permanecem manuais.
- Os caminhos de cabeçalho de proxy confiável com loopback no mesmo host não são elegíveis, pois esse
  caminho pode ser falsificado por chamadores locais.

## Limpeza de substituições de pareamento silencioso

As aprovações não interativas registram sua procedência na linha do dispositivo pareado:
aprovações por política local no mesmo host como `silent`, aprovações de Node por CIDR confiável como
`trusted-cidr` e aprovações de Node verificadas por SSH como `ssh-verified`. Clientes cujo diretório de estado é efêmero (diretórios pessoais temporários,
contêineres, sandboxes por execução) geram um novo par de chaves de dispositivo a cada execução, e cada
execução é silenciosamente pareada novamente como um dispositivo totalmente novo — sem a limpeza, a lista de pareados
cresce em uma linha obsoleta por execução.

Quando o Gateway aprova silenciosamente o pareamento de um dispositivo **local**, ele desativa
registros antigos aprovados por `silent` que pertencem ao mesmo agrupamento de clientes
(com `clientId`, `clientMode` e nome de exibição correspondentes) e não estão
conectados no momento. Os clientes locais são executados no próprio host do Gateway, portanto a chave do agrupamento
não pode corresponder a uma máquina diferente. As linhas desativadas perdem seus tokens imediatamente;
qualquer entrada correspondente de pareamento de Node legado é removida, e um evento de remoção `node.pair.resolved`
é transmitido.

Limites:

- Somente os registros cuja aprovação mais recente foi local no mesmo host (`silent`) são
  elegíveis, tanto como acionador quanto como destino. Pareamentos verificados por CIDR confiável e SSH
  atravessam hosts nos quais os metadados de exibição não constituem uma identidade de máquina, portanto
  nunca são removidos automaticamente — use a limpeza da interface de controle ou
  `openclaw nodes remove` para esses casos.
- Pareamentos aprovados pelo proprietário e por QR/código de configuração (bootstrap) nunca são removidos
  automaticamente. Os registros aprovados antes da existência da proveniência permanecem protegidos,
  mesmo após uma posterior reaprovação silenciosa do mesmo ID de dispositivo.
- Os dispositivos conectados no momento são ignorados, portanto, sessões locais simultâneas com
  diretórios de estado separados mantêm seus tokens enquanto estiverem ativas. Os registros aprovados
  no último minuto também são ignorados, para que handshakes de pareamento simultâneos
  não desativem uns aos outros antes que suas conexões sejam registradas.
- Os clientes afetados são locais por definição, portanto, fazem um novo pareamento silenciosamente
  na próxima conexão.

## Aprovação automática de atualização de metadados

Quando um dispositivo já pareado se reconecta apenas com alterações em metadados não
sensíveis (por exemplo, nome de exibição ou indicações da plataforma do cliente), o OpenClaw trata
isso como uma `metadata-upgrade`. A aprovação automática silenciosa é restrita: aplica-se somente
a reconexões locais confiáveis que não sejam de navegador e que já tenham comprovado a posse de
credenciais locais ou compartilhadas, incluindo reconexões de aplicativos nativos no mesmo host após
alterações nos metadados da versão do sistema operacional. Clientes de navegador/interface de controle e clientes remotos
ainda usam o fluxo explícito de reaprovação. Elevações de escopo (de leitura para
gravação/administração) e alterações na chave pública **não** se qualificam para
aprovação automática de atualização de metadados; elas permanecem como solicitações explícitas de reaprovação.

## Auxiliares de pareamento por QR

`/pair qr` renderiza a carga útil de pareamento como mídia estruturada para que clientes móveis e de
navegador possam escaneá-la diretamente.

A exclusão de um dispositivo também remove quaisquer solicitações de pareamento pendentes e obsoletas desse
ID de dispositivo, para que `nodes pending` não exiba linhas órfãs após uma revogação.

## Localidade e cabeçalhos encaminhados

O pareamento do Gateway trata uma conexão como loopback somente quando tanto o socket bruto
quanto quaisquer evidências do proxy upstream estão de acordo. Se uma solicitação chegar pelo loopback, mas
contiver evidências dos cabeçalhos `Forwarded`, qualquer `X-Forwarded-*` ou `X-Real-IP`, essas
evidências de cabeçalhos encaminhados invalidam a alegação de localidade do loopback, e o
fluxo de pareamento exige aprovação explícita em vez de tratar silenciosamente a
solicitação como uma conexão no mesmo host. Consulte
[Autenticação por proxy confiável](/pt-BR/gateway/trusted-proxy-auth) para conhecer a regra equivalente na
autenticação do operador.

## Armazenamento (local, privado)

O estado do pareamento fica nos registros dos dispositivos pareados no banco de dados de estado
SQLite compartilhado, no diretório de estado do Gateway (padrão `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (dispositivos pareados com autenticação de dispositivo,
  superfícies de Node aprovadas, solicitações de superfície pendentes, solicitações pendentes de pareamento
  de dispositivos e tokens de bootstrap)

Se você substituir `OPENCLAW_STATE_DIR`, o banco de dados será movido junto com ele. Gateways
atualizados a partir de versões com armazenamentos JSON os importam na inicialização e deixam
os arquivos `devices/*.json.migrated` e `nodes/*.json.migrated` para trás.

Observações de segurança:

- Os tokens de dispositivos são segredos; trate o banco de dados de estado como confidencial.
- A rotação de um token de dispositivo usa `openclaw devices rotate` /
  `device.token.rotate`.

## Comportamento do transporte

- O transporte é **sem estado**; ele não armazena associações.
- Se o Gateway estiver offline ou o pareamento estiver desativado, os Nodes não poderão ser pareados.
- No modo remoto, o pareamento ocorre no armazenamento do Gateway remoto.

## Relacionados

- [Pareamento de canais](/pt-BR/channels/pairing)
- [CLI de Nodes](/pt-BR/cli/nodes)
- [CLI de dispositivos](/pt-BR/cli/devices)
