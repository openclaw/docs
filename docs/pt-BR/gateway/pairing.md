---
read_when:
    - Implementação de aprovações de emparelhamento de Node sem a interface do macOS
    - Adição de fluxos da CLI para aprovar nós remotos
    - Estendendo o protocolo do Gateway com gerenciamento de Node
summary: 'Aprovações de recursos de Node: como os Nodes obtêm acesso a comandos após o pareamento do dispositivo'
title: Pareamento de Node
x-i18n:
    generated_at: "2026-07-11T23:58:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 753b01681fa9be17df853b63210f54374d054a6dde37746a3b5fda69073af71d
    source_path: gateway/pairing.md
    workflow: 16
---

O pareamento de Node tem duas camadas, ambas armazenadas no registro do dispositivo pareado no banco de dados de estado SQLite do Gateway:

- **Pareamento de dispositivo** (função `node`) controla o handshake de `connect`. Consulte
  [Aprovação automática de dispositivo por CIDR confiável](#trusted-cidr-device-auto-approval)
  abaixo e [Pareamento de canal](/pt-BR/channels/pairing).
- **Aprovação de recursos do Node** (`node.pair.*`) controla quais
  recursos/comandos declarados um Node conectado pode expor. O Gateway é a
  fonte da verdade; as interfaces (aplicativo para macOS, Control UI) são frontends que aprovam ou
  rejeitam solicitações pendentes.

O antigo armazenamento independente de pareamento de Node (`nodes/paired.json` com um token
por Node, removido do caminho de conexão em janeiro de 2026) não existe mais: os gateways incorporam
quaisquer linhas restantes aos registros de dispositivos uma vez durante a inicialização e arquivam os
arquivos legados com o sufixo `.migrated`. O suporte à ponte TCP legada foi
removido.

## Como funciona a aprovação de recursos

1. Um Node se conecta ao WS do Gateway (o pareamento de dispositivo controla esta etapa).
2. O Gateway compara a superfície declarada de recursos/comandos com a
   aprovada; superfícies novas ou ampliadas armazenam uma **solicitação pendente** no
   registro do dispositivo e emitem `node.pair.requested`.
3. Você aprova ou rejeita a solicitação (CLI ou interface).
4. Até a aprovação, os comandos do Node permanecem filtrados; a aprovação expõe a superfície
   declarada, sujeita à política normal de comandos.

As solicitações pendentes expiram automaticamente **5 minutos após a última
tentativa do Node** — um Node que está se reconectando ativamente mantém sua única solicitação pendente ativa,
em vez de gerar uma nova solicitação (e um novo aviso de aprovação) a cada tentativa.

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
  invalida/desconecta as sessões desse dispositivo com função de Node. Um dispositivo de **funções mistas**
  (por exemplo, um que também tenha `operator`) mantém sua linha e perde apenas
  a função `node`; a linha de um dispositivo que tenha somente a função de Node é excluída. Autorização:
  `operator.pairing` pode remover linhas de Nodes que não sejam operadores; um chamador com token de dispositivo
  que revogue sua **própria** função de Node em um dispositivo de funções mistas também precisa de
  `operator.admin`.
- `node.rename` - renomeia o nome de exibição voltado ao operador de um Node pareado.

Removidos na versão 2026.7: `node.pair.request` e `node.pair.verify`. As solicitações
pendentes são criadas pelo próprio Gateway durante as conexões dos Nodes, e o
token independente por Node ao qual davam suporte não existe mais; a autenticação do Node usa o
token de pareamento do dispositivo.

Observações:

- Reconexões com uma superfície inalterada reutilizam a solicitação pendente; solicitações
  repetidas atualizam os metadados armazenados do Node e o instantâneo mais recente dos
  comandos declarados na lista de permissões para visibilidade do operador.
- Os níveis de escopo do operador e as verificações realizadas no momento da aprovação estão resumidos em
  [Escopos do operador](/pt-BR/gateway/operator-scopes).
- `node.pair.approve` usa os comandos declarados da solicitação pendente para exigir
  escopos de aprovação adicionais:
  - solicitação sem comandos: `operator.pairing`
  - solicitação de comando que não seja de execução: `operator.pairing` + `operator.write`
  - solicitação de `system.run` / `system.run.prepare` / `system.which`:
    `operator.pairing` + `operator.admin`

<Warning>
A aprovação do pareamento de Node registra a superfície confiável de recursos. Ela **não** fixa a superfície ativa de comandos do Node individualmente.

- Os comandos ativos do Node vêm do que ele declara ao se conectar, filtrados pela
  política global de comandos de Node do Gateway (`gateway.nodes.allowCommands` e
  `denyCommands`).
- A política de permissão e confirmação de `system.run` por Node reside no Node, em
  `exec.approvals.node.*`, e não no registro de pareamento.

</Warning>

## Controle de comandos do Node (2026.3.31+)

<Warning>
**Alteração incompatível:** a partir da versão `2026.3.31`, os comandos do Node permanecem desativados até que o pareamento do Node seja aprovado. O pareamento de dispositivo, por si só, não é mais suficiente para expor os comandos declarados do Node.
</Warning>

Quando um Node se conecta pela primeira vez, o pareamento é solicitado automaticamente.
Até que essa solicitação seja aprovada, todos os comandos pendentes desse Node são
filtrados e não são executados. Após a aprovação do pareamento, os comandos declarados
do Node ficam disponíveis, sujeitos à política normal de comandos.

Isso significa:

- Nodes que anteriormente dependiam apenas do pareamento de dispositivo para expor comandos agora
  também precisam concluir o pareamento de Node.
- Comandos enfileirados antes da aprovação do pareamento são descartados, não adiados.

## Limites de confiança de eventos do Node (2026.3.31+)

<Warning>
**Alteração incompatível:** execuções originadas pelo Node agora permanecem em uma superfície confiável reduzida.
</Warning>

Resumos originados pelo Node e eventos de sessão relacionados ficam restritos à
superfície confiável pretendida. Fluxos acionados por notificações ou pelo Node que
anteriormente dependiam de acesso mais amplo a ferramentas do host ou da sessão podem precisar de ajustes.
Esse reforço impede que eventos do Node escalem para acesso a ferramentas no nível do host
além do permitido pelo limite de confiança do Node.

As atualizações persistentes de presença do Node seguem o mesmo limite de identidade: o evento
`node.presence.alive` é aceito apenas de sessões autenticadas de dispositivos Node
e atualiza os metadados de pareamento somente quando a identidade do dispositivo/Node
já está pareada. Um valor autodeclarado de `client.id` não é suficiente para gravar
o estado da última atividade.

## Aprovação automática de dispositivo verificada por SSH (padrão)

O primeiro pareamento de dispositivo com `role: node` proveniente de um endereço privado/CGNAT é
aprovado automaticamente quando o Gateway consegue **comprovar a propriedade da máquina via SSH**: ele
se conecta de volta ao host em pareamento (`BatchMode`, `StrictHostKeyChecking=yes`),
executa `openclaw node identity --json` nele e aprova somente quando o ID do dispositivo
remoto e a chave pública correspondem exatamente à solicitação pendente. A correspondência da chave é
o que torna isso seguro: a mera acessibilidade nunca resulta em aprovação, portanto outros locatários sob o mesmo NAT,
outros usuários em um host compartilhado e falsificações na LAN seguem para o aviso
normal.

Ativado por padrão. Requisitos para que seja acionado:

- O usuário do processo do Gateway (ou `sshVerify.user`) consegue acessar o host do Node via SSH
  de forma não interativa (chaves/agente; o SSH do Tailscale também funciona), e a chave do host já é
  confiável.
- `openclaw` é resolvido no `PATH` remoto para `sh -lc` não interativo.
- O IP de conexão é um endereço privado, ULA, link-local ou CGNAT direto
  (sem proxy e sem loopback), ou corresponde a `sshVerify.cidrs` quando definido.
- O mesmo requisito mínimo de elegibilidade da aprovação por CIDR confiável: somente pareamento novo de Node
  sem escopos; upgrades, navegadores, Control UI e WebChat sempre solicitam aprovação.

Enquanto uma sondagem está em execução, o cliente do Node é instruído a continuar tentando
(`wait_then_retry`) em vez de aguardar aprovação manual; se a sondagem
falhar, a próxima tentativa retorna ao fluxo normal de solicitação. Alvos com falha
entram em um breve período de espera (5 minutos após uma incompatibilidade de chave).

Dispositivos aprovados registram `approvedVia: "ssh-verified"` e sua primeira superfície declarada
de recursos é aprovada na mesma etapa — a correspondência da chave já comprova
que o Node é executado sob a conta do operador em uma máquina de sua propriedade, o que representa a
mesma afirmação de uma aprovação manual de recursos. Ampliações posteriores da superfície ainda
exigem aprovação.

Reforce a segurança ou desative:

```json5
{
  gateway: {
    nodes: {
      pairing: {
        // Disable entirely:
        sshVerify: false,
        // ...or scope/tune the probe:
        // sshVerify: { user: "me", identity: "~/.ssh/probe", timeoutMs: 7000, cidrs: ["10.0.0.0/8"] },
      },
    },
  },
}
```

## Aprovação automática (aplicativo para macOS)

O aplicativo para macOS pode tentar uma **aprovação silenciosa** de solicitações de recursos
do Node quando:

- a solicitação está marcada como `silent` (o Gateway marca a primeira superfície de recursos
  como silenciosa quando o pareamento de dispositivo foi aprovado de forma não interativa), e
- o aplicativo consegue verificar uma conexão SSH com o host do Gateway usando o mesmo
  usuário.

Se a aprovação silenciosa falhar, ele retorna ao aviso normal de Approve/Reject.

## Aprovação automática de dispositivo por CIDR confiável

O pareamento de dispositivo via WS para `role: node` permanece manual por padrão. Em redes privadas de Nodes
nas quais o Gateway já confia no caminho de rede, os operadores podem ativar
o recurso com CIDRs explícitos ou IPs exatos:

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
- Não existe um modo abrangente de aprovação automática para LAN ou redes privadas; a aprovação automática
  verificada por SSH (acima) exige uma correspondência criptográfica da chave do dispositivo, nunca
  apenas a localização na rede.
- Somente uma nova solicitação de pareamento de dispositivo com `role: node` e sem escopos solicitados é
  elegível.
- Clientes operadores, navegadores, Control UI e WebChat permanecem manuais.
- Ampliações de função, escopo, metadados e chave pública permanecem manuais.
- Caminhos de cabeçalhos de proxy confiável via loopback no mesmo host não são elegíveis, pois esse
  caminho pode ser falsificado por chamadores locais.

## Limpeza de pareamentos silenciosos substituídos

Aprovações não interativas registram sua procedência na linha do dispositivo pareado:
aprovações por política local no mesmo host como `silent`, aprovações de Node por CIDR confiável como
`trusted-cidr` e aprovações de Node verificadas por SSH como `ssh-verified`. Clientes cujo diretório de estado é efêmero (diretórios pessoais temporários,
contêineres, sandboxes por execução) geram um novo par de chaves do dispositivo a cada execução, e cada
execução refaz o pareamento silenciosamente como um dispositivo totalmente novo — sem limpeza, a lista de pareados
cresce em uma linha obsoleta a cada execução.

Quando o Gateway aprova silenciosamente o pareamento de um dispositivo **local**, ele desativa
registros antigos aprovados como `silent` que pertencem ao mesmo cluster de clientes
(com `clientId`, `clientMode` e nome de exibição correspondentes) e não estão
conectados no momento. Clientes locais são executados no próprio host do Gateway, portanto a chave do cluster
não pode corresponder a outra máquina. As linhas desativadas perdem seus tokens imediatamente;
qualquer entrada legada correspondente de pareamento de Node é removida, e um evento de remoção
`node.pair.resolved` é transmitido.

Limites:

- Somente registros cuja aprovação mais recente ocorreu localmente no mesmo host (`silent`) são
  elegíveis, tanto como acionador quanto como alvo. Pareamentos por CIDR confiável e verificados por SSH
  atravessam hosts nos quais os metadados de exibição não representam a identidade de uma máquina, portanto nunca são
  removidos automaticamente — use a limpeza da Control UI ou
  `openclaw nodes remove` para esses casos.
- Pareamentos aprovados pelo proprietário e por QR/código de configuração (inicialização) nunca são removidos
  automaticamente. Registros aprovados antes da existência da procedência permanecem protegidos,
  mesmo após uma nova aprovação silenciosa posterior do mesmo ID de dispositivo.
- Dispositivos conectados no momento são ignorados, portanto sessões locais simultâneas com
  diretórios de estado separados mantêm seus tokens enquanto estiverem ativas. Registros aprovados
  no último minuto também são ignorados, para que handshakes simultâneos de pareamento
  não desativem uns aos outros antes que suas conexões sejam registradas.
- Os clientes afetados são locais por definição, portanto refazem o pareamento silenciosamente na
  próxima conexão.

## Aprovação automática de atualização de metadados

Quando um dispositivo já pareado se reconecta apenas com alterações não confidenciais nos metadados
(por exemplo, nome de exibição ou indicações da plataforma do cliente), o OpenClaw trata
isso como uma `metadata-upgrade`. A aprovação automática silenciosa é restrita: aplica-se somente
a reconexões locais confiáveis que não sejam de navegador e que já tenham comprovado a posse de
credenciais locais ou compartilhadas, incluindo reconexões de aplicativos nativos no mesmo host após
alterações nos metadados da versão do sistema operacional. Clientes de navegador/Control UI e clientes remotos
ainda usam o fluxo explícito de nova aprovação. Ampliações de escopo (de leitura para
gravação/administração) e alterações de chave pública **não** são elegíveis para
aprovação automática de `metadata-upgrade`; elas permanecem como solicitações explícitas de nova aprovação.

## Auxiliares de pareamento por QR

`/pair qr` renderiza a carga útil de pareamento como mídia estruturada para que clientes móveis e de
navegador possam escaneá-la diretamente.

Excluir um dispositivo também remove todas as solicitações de pareamento pendentes obsoletas desse
ID de dispositivo, para que `nodes pending` não exiba linhas órfãs após uma revogação.

## Localidade e cabeçalhos encaminhados

O pareamento do Gateway trata uma conexão como local loopback somente quando tanto o soquete bruto
quanto qualquer evidência de proxy upstream estão de acordo. Se uma solicitação chegar por local loopback, mas
contiver evidências dos cabeçalhos `Forwarded`, qualquer `X-Forwarded-*` ou `X-Real-IP`, essas
evidências de cabeçalhos encaminhados invalidam a alegação de localidade de local loopback, e o
fluxo de pareamento exige aprovação explícita em vez de tratar silenciosamente a
solicitação como uma conexão no mesmo host. Consulte
[Autenticação de proxy confiável](/pt-BR/gateway/trusted-proxy-auth) para ver a regra equivalente na
autenticação do operador.

## Armazenamento (local, privado)

O estado de pareamento reside nos registros dos dispositivos pareados no banco de dados de estado SQLite
compartilhado, no diretório de estado do Gateway (padrão `~/.openclaw`):

- `~/.openclaw/state/openclaw.sqlite` (dispositivos pareados com autenticação de dispositivo,
  superfícies de Node aprovadas, solicitações de superfície pendentes, solicitações pendentes de pareamento de
  dispositivos e tokens de inicialização)

Se você substituir `OPENCLAW_STATE_DIR`, o banco de dados será movido junto com ele. Gateways
atualizados de versões com armazenamentos JSON os importam na inicialização e deixam
os arquivos `devices/*.json.migrated` e `nodes/*.json.migrated`.

Observações de segurança:

- Tokens de dispositivo são segredos; trate o banco de dados de estado como confidencial.
- A rotação de um token de dispositivo usa `openclaw devices rotate` /
  `device.token.rotate`.

## Comportamento do transporte

- O transporte é **sem estado**; ele não armazena associações.
- Se o Gateway estiver offline ou o pareamento estiver desabilitado, os Nodes não poderão ser pareados.
- No modo remoto, o pareamento ocorre no armazenamento do Gateway remoto.

## Relacionados

- [Pareamento de canais](/pt-BR/channels/pairing)
- [CLI de Nodes](/pt-BR/cli/nodes)
- [CLI de dispositivos](/pt-BR/cli/devices)
