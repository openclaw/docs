---
read_when:
    - Projetar ou implementar o provisionamento de workers na nuvem, o modo worker ou a transferência de sessão
    - Alteração de environments.*, do protocolo do worker, da ingestão de transcrições ou das RPCs do proxy de inferência
    - Analisando a postura de segurança da execução remota de agentes
summary: Execute sessões de agentes em máquinas efêmeras acessíveis por SSH, com inferência intermediada pelo Gateway e streaming em tempo real na barra lateral.
title: Plano de workers na nuvem
x-i18n:
    generated_at: "2026-07-12T15:23:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Status

Proposta, revisão 3. Não implementada. Direção acordada em 2026-07; a revisão 2 incorporou as conclusões da revisão adversarial (protocolo dedicado para workers, máquinas de estado de posicionamento/ambiente, sincronização de entrada ciente de Git, transferência unidirecional na v1, terminologia de segurança para saída controlada). A revisão 3 define o modelo de propriedade da sincronização (o worker cria commits, o Gateway os adota e publica), adiciona um modo de sincronização simples sem Git, corrige a execução do worker para acesso total dentro da máquina, move a política de internet para o momento do provisionamento e restaura o despacho do agente para o marco 3.

## Problema

As sessões de agentes do OpenClaw executam seu loop, suas ferramentas e sua inferência dentro do processo do Gateway em uma única máquina. A capacidade computacional é limitada por essa máquina, tarefas longas a ocupam e trabalhos paralelos disputam seus recursos. Produtos hospedados (agentes na nuvem do Cursor, Claude Code na web, Codex cloud) resolvem isso com sandboxes efêmeros na nuvem por tarefa, mas exigem infraestrutura e confiança no fornecedor.

Operadores que já possuem máquinas ociosas (ou podem alugá-las por um preço baixo) não têm como dizer: execute esta sessão naquela máquina, mostre-a na minha barra lateral como qualquer outra sessão e descarte a máquina depois.

## Objetivos

- Executar uma sessão completa de agente (loop + ferramentas) em uma máquina remota efêmera ("worker de nuvem"), enquanto a sessão aparece e transmite dados na interface de controle exatamente como uma sessão local.
- Nenhuma credencial permanente no worker (sem autenticação de provedor, sem tokens de forge) e nenhuma saída direta de rede; a máquina precisa apenas de um sshd acessível.
- Provisionar, sincronizar, executar, coletar, destruir — tudo totalmente automatizado e com provedores conectáveis (primeiro provedor: CLIs de concessão no estilo Crabbox).
- Despachar um trabalho em execução do Gateway para um worker no limite entre turnos sem perder a transcrição, a identidade da sessão ou, quando os bytes da solicitação permanecerem equivalentes, a afinidade com o cache do provedor; trazer os resultados de volta com segurança.
- Tanto humanos (interface) quanto agentes (ferramenta) podem despachar trabalhos para um worker de nuvem.
- Oferecer suporte a sessões que durem vários dias; o tempo de vida é definido por política, não por um limite codificado.

## Fora do escopo (v1)

- Nenhum harness externo de programação (Claude Code, Codex CLI) nos workers. As sessões de worker executam apenas o runner incorporado do OpenClaw. O suporte a harnesses é opcional na v2 porque eles realizam a própria inferência com as próprias credenciais.
- Nenhuma distribuição em leque de melhor entre N / tentativas paralelas.
- Nenhuma dependência de VPN/tailnet. O transporte usa somente SSH.
- Nenhum novo runtime de sandbox. A máquina do worker é o limite de isolamento; o sandbox do sistema operacional dentro da máquina poderá ser adicionado posteriormente.
- Nenhuma migração simétrica em tempo real na v1: o despacho é local → worker; worker → local exige uma sessão parada e a reconciliação concluída do espaço de trabalho. A transferência bidirecional em tempo real será construída posteriormente sobre o mesmo mecanismo de barreiras.
- Nenhum estado paralelo em JSON no Gateway; os estados de ambiente, posicionamento, cursor e concessão ficam no SQLite.

## Trabalhos anteriores (o que copiamos, o que invertemos)

- Agentes na nuvem do Cursor: o loop do agente é executado na nuvem deles; a VM é um destino de execução de ferramentas; o armazenamento de conversas é somente para acréscimos e transmitido para todos os clientes; inicialização rápida com snapshot após a instalação; workers auto-hospedados são processos de worker somente com conexões de saída. Copiamos os modelos de "a fonte de verdade da conversa permanece no orquestrador" e de transmissão; invertemos o posicionamento do loop (consulte a decisão abaixo).
- Codex cloud: runtime em duas fases — fase de configuração com rede, seguida por uma fase offline do agente com os segredos removidos; cache do estado do contêiner para continuações rápidas. Copiamos a divisão em fases como nossa postura de saída e a ideia de cache para imagens aquecidas na v2.
- Claude Code na web: VM por sessão; proxy Git que isola credenciais (tokens reais nunca entram no sandbox, e o push é restrito ao branch da sessão); snapshot do sistema de arquivos após a configuração; transferência por teleport = branch enviado por push + histórico reproduzido. Copiamos o isolamento de credenciais e a estrutura da transferência, mas a sincronização de saída usa rsync a partir do Gateway para permitir árvores de trabalho com alterações e evitar que qualquer token de forge fique próximo da máquina.
- Agente de programação do Copilot: saída negada por padrão com lista de permissões para registros de pacotes. Nosso padrão em estado estável é mais forte (nenhuma saída direta) porque a inferência e a pesquisa na web chegam pelo túnel SSH — mas consulte Segurança para entender por que isso é "saída controlada", não "saída zero".

## Decisão de arquitetura: loop no worker, inferência pelo Gateway

Três posicionamentos foram considerados:

1. O loop permanece no Gateway, e o worker executa as ferramentas (modelo do Cursor). É o domínio de falhas mais seguro (transcrição, inferência, aprovações e recuperação após reinicialização permanecem locais) e o primeiro marco preferido por um revisor. Rejeitado como arquitetura do produto: as ferramentas sem execução do OpenClaw são operações de sistema de arquivos dentro do processo, portanto cada leitura/edição/pesquisa de arquivo se torna uma ida e volta pela rede ou exige uma grande refatoração da superfície de ferramentas em RPCs abrangentes de espaço de trabalho; o comportamento do runtime realiza muitas trocas e fica limitado pela latência. Reutilizamos seu princípio onde ele já está implementado (transferência de execução para Nodes), mas não construímos a camada de ferramentas remotas.
2. O loop e a inferência ficam no worker. É o domínio de falhas mais simples, mas as credenciais do modelo (incluindo perfis OAuth) precisam ser enviadas para máquinas descartáveis, o Gateway perde o controle de políticas/roteamento/auditoria e a migração altera a identidade que chama o provedor, invalidando os caches do provedor.
3. Loop + ferramentas no worker, chamadas ao modelo intermediadas pelo Gateway. Opção escolhida. Uma ida e volta por turno do modelo, em vez de uma por chamada de ferramenta; as ferramentas são executadas próximas ao código; o Gateway continua sendo o único proprietário dos perfis de autenticação, do roteamento de provedores e das políticas; o worker não armazena segredos.

O custo da opção 3 é uma dependência síncrona do Gateway durante cada turno do modelo, portanto suas regras de durabilidade fazem parte da decisão, não são uma consideração posterior:

- A perda do Gateway durante um turno causa falha na chamada ativa ao provedor. O turno é marcado como falho e repetido como um novo turno após a reconexão; não há reprodução transparente de um fluxo do provedor em andamento (risco de cobrança dupla/chamada dupla de ferramenta).
- Toda operação entre worker↔Gateway carrega uma identidade durável (consulte Protocolo do worker), para que reconexões retomem a operação ou obtenham resultados terminais em cache, em vez de deixá-la pendente.
- O Gateway é um componente com capacidade gerenciada: limites de workers simultâneos, controle de fluxo e descarte de carga fazem parte do escopo da v1 (consulte Capacidade).

Como o Gateway armazena a transcrição e origina todo o tráfego para provedores, a sessão é independente da localização: mover o loop entre o Gateway e o worker não altera nada do lado do provedor nem no caminho dos dados da interface. Isso torna o despacho e o retorno baratos.

## Componentes

### 1. Máquina de estado do ambiente + contrato do provedor

`environments.*` no protocolo do Gateway atualmente é uma projeção somente de status. O núcleo durável é um registro de ambiente e uma máquina de estado pertencentes ao SQLite, projetados antes dos formatos de RPC:

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- O provisionamento é seguro em caso de falha: a linha de intenção é persistida antes da chamada ao provedor, com um ID de operação determinístico, para que uma reinicialização do Gateway possa adotar uma concessão em andamento em vez de provisionar duas vezes ou abandonar uma máquina paga.
- A reconciliação após reinicialização e um varredor de órfãos (`inspect` do provedor em comparação com os registros locais) são requisitos da v1, não medidas adicionais de robustez.

Contrato do provedor (implementado por Plugin; sem nomes de provedores nem políticas no núcleo):

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → host/porta/usuário SSH/material de chave
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // adoção/integridade/varredura de órfãos
  renew?(leaseId: string): Promise<void>; // sessões de longa duração em comparação com TTLs do provedor
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotente, retorna somente após comprovação do encerramento
};
```

RPCs: `environments.create`, `environments.destroy`, `environments.list/status` estendidos (provedor, ID da concessão, estado, idade, tempo ocioso, sessões anexadas). Primeiros provedores: um wrapper de CLI de concessão no formato Crabbox (caminho do produto) e um provedor de host SSH estático marcado como exclusivo para desenvolvimento — um worker em um host compartilhado pode ler dados não relacionados desse host, portanto hosts estáticos servem para o desenvolvimento do recurso, não como postura padrão.

### 2. Inicialização do worker: instalar o OpenClaw na máquina

Nenhum artefato específico para o worker e nenhuma dependência da disponibilidade do npm:

- Instalação canônica para todos os modos: um pacote de worker produzido pelo Gateway e identificado pelo hash do conteúdo (a própria saída de build do Gateway empacotada como tarball), enviado por SSH e instalado na máquina. Isso abrange builds de desenvolvimento e commits ainda não lançados por definição.
- `npm i -g openclaw@<exact gateway version>` é uma otimização quando o Gateway executa uma versão lançada; nunca `latest`.
- A inicialização é idempotente; uma concessão aquecida com um hash de pacote correspondente ignora a instalação. Máquinas sem preparação podem precisar de uma fase de cadeia de ferramentas com acesso à rede (runtime do Node) — parte da fase de configuração, encerrada posteriormente.
- O handshake verifica o hash do build do worker, o conjunto de recursos do protocolo e a compatibilidade do runtime. As verificações existentes de versão/protocolo do Gateway são insuficientes para isso (Nodes em túneis SSH são isentos da rejeição por versão exata), portanto a admissão do worker realiza sua própria verificação exata do build.

O modo worker (`openclaw worker`) é um ponto de entrada, não uma bifurcação: gerenciamento da conexão mais o runner de agente incorporado, com persistência de sessão e chamadas ao modelo apoiadas por RPCs do Gateway. Ele não deve iniciar superfícies do Gateway: sem canais, sem inicialização automática de Plugins além do conjunto de ferramentas da sessão, diretório de estado descartável e sem perfis de autenticação locais.

### 3. Transporte: tudo por SSH

O Gateway controla a conectividade; o worker não exige nada além de sshd:

- O Gateway abre uma conexão SSH com o worker (credenciais da concessão do provedor, chave do host fixada a partir da saída do provisionamento — sem `StrictHostKeyChecking=no`) e estabelece um túnel reverso que encaminha um socket local do worker para o endpoint WS do Gateway.
- O tráfego de controle/modelo e a transferência do espaço de trabalho usam conexões SSH separadas com o mesmo material de confiança fixado, para que o rsync não cause bloqueio no início da fila dos fluxos de tokens.
- O ciclo de vida do túnel (keepalive, reconexão com recuo) pertence ao runtime do ambiente no Gateway. Uma interrupção breve do túnel é invisível no nível da sessão: o estado durável do protocolo (abaixo) permite que o worker se reconecte e retome a operação.

### 4. Protocolo do worker (dedicado; não é o protocolo de Node)

A revisão adversarial das interfaces atuais de Node descartou a reutilização direta: invocações pendentes de Nodes são Promises locais do processo que desaparecem com a conexão, chaves de idempotência de Nodes são analisadas, mas não deduplicadas e — de forma decisiva — um Node conectado pode emitir eventos comuns de Node (incluindo solicitações de execução de agentes), portanto "tipo de Node + limite de capacidade" não é um limite de segurança de entrada. Por isso, workers recebem uma função `worker` autenticada, com uma lista fechada e versionada de RPCs/eventos permitidos; conexões de workers não podem alcançar nenhum manipulador de eventos legado de Node.

Identidade e credenciais: o provisionamento cria uma credencial de worker de curta duração vinculada ao ID do ambiente, à chave do worker, ao hash do pacote, à única sessão permitida, ao conjunto permitido de RPCs e a um prazo de validade. O pareamento verificado por SSH ainda se aplica (provisionamos a máquina e mantemos a chave), mas a autorização vem da credencial criada, não da superfície de Node declarada.

Semântica de operações duráveis (formato baseado no runtime ACP existente e em seu ledger de eventos — identificadores estáveis, serialização por sessão, reprodução durável de `(session, seq)`):

- Toda operação tem o escopo `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)`.
- Épocas de propriedade isolam workers obsoletos: um worker substituto avança a época; resultados tardios da época antiga são rejeitados de forma determinística.
- Entrega pelo menos uma vez com cursores de ACK persistidos e resultados terminais em cache no SQLite; a deduplicação é determinística. Nenhuma garantia de execução exatamente uma vez.
- Quadros explícitos para cancelamento, encerramento, retomada e resultados terminais; controle de fluxo baseado em créditos/janelas nos fluxos.
- A negociação de recursos do protocolo é independente da versão geral do protocolo de Node.

### 5. RPCs de backend da sessão

Dois contratos distintos — a base de código atual separa as mutações duráveis da transcrição (de propriedade do gerenciador de sessões, árvore JSONL com estado de pai/folha) dos eventos em tempo real locais ao processo (deltas de streaming, ciclo de vida de ferramentas, aprovações), e o protocolo do worker deve preservar essa separação:

- Confirmações duráveis da transcrição: o worker envia lotes de anexação semântica com `runEpoch` + comparação e troca da folha-base; o gerenciador de sessões do Gateway gera ids de entrada e ids de pai. O worker nunca pode fornecer linhas de transcrição confiáveis, ids de entrada, ids de pai ou ids de sessões externas.
- Eventos em tempo real reproduzíveis: uma união tipada de eventos com números de sequência do worker, ACKs do Gateway, retenção limitada e bloqueio de eventos atrasados, alimentando a distribuição existente de eventos do agente para que a visualização do chat, as linhas de ferramentas e a lógica de não lidos/status se comportem de forma idêntica às sessões locais.

Proxy de inferência: reutilize o vocabulário de eventos do cliente de streaming do proxy de runtime existente (`src/agents/runtime/proxy.ts`), mas mova o limite de confiança. O worker envia apenas a identidade da sessão/execução, uma referência de modelo aprovada, contexto e opções de geração restritas; o Gateway resolve provedor, endpoint, autenticação, cabeçalhos, roteamento e política de custos com base em seu próprio catálogo. Um objeto de modelo fornecido pelo worker (por exemplo, `baseUrl` controlada por um invasor) é rejeitado. Aplicam-se limites de tamanho de solicitação, cancelamento, auditoria e reprodução do resultado final. Ferramentas residentes no Gateway (websearch) são executadas no Gateway e retornam os resultados pelo mesmo canal.

### 6. Sincronização do workspace

A âncora de sincronização é um workspace local ao Gateway com propriedade exclusiva de alocação: para workspaces git, uma worktree gerenciada dedicada (os metadados existentes da worktree gerenciada — branch, base, propriedade do snapshot — são a base); para workspaces sem git, um diretório de destino pertencente ao Gateway. Nunca o checkout ativo do usuário. A propriedade exclusiva enquanto a sessão está alocada remotamente é o que torna a sincronização de entrada livre de conflitos por construção.

Divisão de responsabilidades — commit versus publicação:

- O agente no worker cria commits normalmente em sua cópia (`git commit` é uma operação local, sem credenciais; a identidade do autor é projetada com base na configuração do Gateway). Esses commits são objetos inertes até que o Gateway os adote.
- O Gateway faz tudo o que exige confiança: verifica se os commits recebidos se baseiam na base registrada, avança a worktree local por fast-forward, executa push, cria PRs e, opcionalmente, assina ou reassina — tudo com credenciais locais do Gateway. O worker nunca possui credenciais git ou da plataforma de hospedagem e nunca acessa um remoto.

Dois modos de sincronização, selecionados conforme o workspace seja ou não um repositório git:

- Modo git. Saída: sincronize a worktree com rsync (incluindo arquivos não confirmados e arquivos não rastreados elegíveis; inclusão/exclusão no estilo crabbox, respeitando `.worktreeinclude`) usando a identidade SSH do túnel, registrada como um manifesto-base imutável (hashes de conteúdo + commit-base). Entrada: novos commits retornam como um bundle git ou uma referência temporária baseada na base registrada; artefatos não rastreados retornam por meio de um manifesto explícito com verificações de tamanho/tipo/contenção de links simbólicos. A adoção verifica a ancestralidade da base e interrompe em caso de divergência — nada sobrescreve silenciosamente nenhum dos lados. Exclusões, renomeações, submódulos e escapes por links simbólicos são tratados pelas regras do manifesto, não por heurísticas do rsync.
- Modo simples (sem git — por exemplo, ao criar um projeto do zero na máquina). A saída usa o mesmo rsync + manifesto-base. A entrada é um espelhamento baseado em diferenças de manifesto de volta para o diretório de destino pertencente ao Gateway, com propagação de exclusões. É seguro pelo mesmo motivo que o modo git: a propriedade exclusiva significa que não há edições locais simultâneas com as quais entrar em conflito; o manifesto-base ainda detecta desvios locais inesperados e interrompe em vez de sobrescrever.

A criação de checkpoints protege sessões com duração de vários dias contra a perda da concessão: checkpoints periódicos de entrada (commits no branch da sessão no modo git, snapshots de manifesto no modo simples); a cadência é definida pela política do perfil (padrão baseado em turnos).

### 7. Máquina de estados de alocação, sessões e interface

A alocação de runtime é uma máquina de estados mantida no SQLite e vinculada à sessão, não um par de campos de linha soltos:

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Ela persiste o id do ambiente, a geração da transição, a época do proprietário ativo, o manifesto-base do workspace, o hash do bundle do worker e os últimos cursores de ACK. A admissão de turnos reivindica atomicamente a alocação antes que qualquer um dos loops inicie um turno, portanto uma mensagem local admitida com base em um snapshot desatualizado nunca pode disputar com um turno do worker — exatamente um loop é proprietário da sessão a qualquer momento.

Interface:

- Uma sessão de worker é uma linha de sessão comum acrescida de metadados de alocação. Ela reside no armazenamento normal, é listada por `sessions.list` e transmitida pelas assinaturas existentes — a barra lateral e o chat não precisam de um novo caminho de dados, apenas de apresentação: um selo de worker e o status da alocação/ambiente (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- Experiência de criação: a barra de destino da sessão (reformulação da barra lateral de sessões) recebe um destino de worker na nuvem ao lado do Gateway e do Node. Exige um perfil de provedor configurado; o recurso permanece invisível até ser configurado.
- Despacho do agente: uma ferramenta de sessão permite que um agente entregue trabalho a um worker na nuvem da mesma forma que uma pessoa faz (subsessão apoiada por worker, no estilo de um subagente). É disponibilizada no mesmo marco que o despacho humano, controlada pela mesma configuração opcional de provedor. A recursão é limitada estruturalmente (sessões de worker não podem despachar outros workers na v1); o controle de gastos é feito por contabilização/auditoria por ambiente, não por mecanismos de cota.

## Despacho e transferência

A v1 é deliberadamente assimétrica:

- Local → worker (despacho): atravesse a barreira de migração abaixo, provisione ou reutilize um worker, sincronize, altere a alocação; o próximo turno será executado remotamente.
- Worker → local (retorno): interrompa a sessão (drene o worker pela mesma barreira), conclua a reconciliação de entrada e altere a alocação para local. Não é uma migração em tempo real.
- A transferência simétrica em tempo real (mover uma sessão que está trabalhando ativamente nas duas direções sem interrompê-la) reutiliza a mesma barreira e o mesmo mecanismo de reconciliação e será disponibilizada após testes de injeção de falhas comprovarem a barreira.

Barreira de migração (apenas o “limite do turno” é insuficiente — aprovações, processos em segundo plano e mesclagens de transcrição após liberação de bloqueio podem atravessá-lo):

1. Interromper a admissão de novos turnos (reivindicação da alocação).
2. Cancelar ou drenar execuções ativas.
3. Revogar aprovações de execução pendentes e concessões de execução.
4. Drenar gravações paralelas da transcrição e ACKs de eventos em tempo real.
5. Encerrar processos filhos do worker.
6. Bloquear o proprietário anterior avançando a época do proprietário.
7. Reconciliar o workspace (entrada, com reconhecimento de conflitos).
8. Ativar o novo proprietário.

Afinidade de cache: como as solicitações ao provedor se originam no Gateway em ambas as alocações, a afinidade de cache é preservada quando a solicitação serializada ao provedor permanece equivalente — mesma ordem de ferramentas, instruções de sistema, wrappers do provedor e metadados de cache (que permanecem no Gateway). Essa é uma propriedade testável, não uma suposição: testes de equivalência byte a byte entre alocações local/worker para cada transporte de provedor compatível fazem parte do marco que introduz o loop do worker.

## Modelo de segurança

Em termos precisos: o worker não tem saída direta para a rede nem credenciais permanentes do provedor ou da plataforma de hospedagem. Não se trata de “saída zero” — a inferência e as ferramentas executadas pelo Gateway são canais de saída controlados (um worker afetado por injeção de prompt ainda pode inserir bytes do workspace no contexto do modelo ou em consultas de websearch). Portanto:

- Contabilização da saída controlada: auditoria por ambiente e contabilização visível ao operador no proxy de inferência e nas ferramentas do Gateway. Existem limites de taxa/bytes como controle de fluxo do protocolo (capacidade), não como mecanismos de cota de gastos.
- A entrada do worker no Gateway é a lista de permissões fechada do protocolo do worker; gravações na transcrição são restritas estruturalmente (ids gerados pelo Gateway, uma única sessão vinculada).
- A execução do worker tem permissão total dentro da máquina. A máquina é descartável e não contém credenciais, portanto a aprovação por comando adiciona atrito sem proteger nada; o limite protegido é a reconciliação de entrada e a auditoria. A execução nunca percorre o caminho de aprovação do Node no Gateway.
- A política de internet é uma decisão do provedor no momento do provisionamento: o perfil do ambiente decide durante a criação da máquina (firewall/grupo de segurança/rede sem saída), opcionalmente com uma fase de configuração com acesso à rede que o provedor encerra antes da fase do agente. O núcleo não implementa uma alternância de rede em runtime.
- Higiene da máquina no momento do provisionamento: endpoint de metadados da nuvem bloqueado ou com ausência verificada, nenhum perfil de instância, nenhum agente SSH herdado, nenhum socket do Docker, ambiente/home limpos. As chaves de host SSH são fixadas com base na saída do provisionamento.
- Aprovações e políticas para tudo que ocorre no Gateway (push, PR, chamadas ao provedor) continuam sendo executadas no Gateway.

Raio de impacto de uma sessão de worker comprometida: a cópia sincronizada do workspace mais aquilo que os canais de proxy auditados permitem — sem credenciais, sem rede direta, sem acesso à superfície do Gateway além da lista de permissões.

## Capacidade

O Gateway retransmite cada prompt e fluxo de tokens para N workers, portanto a v1 define um modelo de capacidade em vez de descobri-lo em produção: limites de workers simultâneos por Gateway, janelas de crédito por fluxo (a fila atual do fluxo de eventos é ilimitada e o limite do buffer do socket do Node encerra à força consumidores lentos — ambos são inadequados sem modificações), armazenamento em disco limitado para picos e redução de carga com estados visíveis de contrapressão na interface. A transferência do workspace permanece em seu próprio canal SSH.

## Ciclo de vida

- A interrupção automática por inatividade e o TTL são políticas do perfil do provedor, não constantes fixas. Os padrões são generosos, com manutenção explícita da atividade; trabalhos com duração de vários dias são tratados como fundamentais (o provedor possui `renew` para backends baseados em concessão); uma sessão com um turno em andamento ou atividade recente nunca é recuperada.
- Em caso de morte ou recuperação do worker: a alocação muda para `reclaimed`, a linha da sessão permanece e a próxima mensagem provisiona um novo worker e sincroniza novamente a partir do último checkpoint. A conversa nunca é perdida (armazenamento no Gateway); alterações no workspace posteriores ao último checkpoint são perdidas, e a interface informa isso.
- Reutilização de concessões aquecidas desde o primeiro dia (para provedores compatíveis); um snapshot da imagem após o bootstrap é o caminho de inicialização rápida da v2.

## Superfície de configuração

Mínima e opcional: um bloco de perfil do provedor (id do provedor, credenciais/referência da CLI, regras de sincronização, política de duração, orçamentos, fase de configuração opcional) mais a seleção de alocação por sessão. Nenhuma nova variável de ambiente. Instalações não configuradas não exibem nada.

## Marcos

A implementação é incorporada como PRs pequenos e mescláveis de forma independente; cada marco abaixo é uma série de PRs, não uma única alteração.

1. Fundamentos: máquina de estados do ambiente + contrato do provedor + provedor no formato do crabbox (SSH estático como ambiente de desenvolvimento), bootstrap do bundle do worker + handshake de admissão, túnel SSH + fixação de chave de host, snapshot da worktree gerenciada + sincronização de saída (modos git + simples). Varredura de órfãos + adoção após reinicialização.
2. Protocolo do worker + loop do worker: função autenticada do worker, operações duráveis/épocas/cursores de ACK, contratos de confirmação da transcrição + eventos em tempo real, proxy de inferência com modelos resolvidos pelo Gateway, controle de fluxo. Um provedor, despacho humano apenas de novas sessões, sem transferência. Testes de injeção de falhas (partição do túnel, reinicialização do Gateway, morte do worker) condicionam a conclusão.
3. Despacho + retorno + despacho do agente: barreira de migração, máquina de estados de alocação conectada à barra de destino da interface, reconciliação de entrada + checkpoints, auditoria por ambiente, limites de capacidade, ferramenta de despacho do agente (sessões de worker não podem usar recursão). Testes de equivalência byte a byte do cache de prompts.
4. Transferência simétrica em tempo real, após a comprovação por injeção de falhas do marco 3.

Posteriormente: ambientes de teste ACP nos workers como opção de hidratação de credenciais por ambiente; inicialização rápida por snapshot/imagem aquecida; distribuição em leque (N concessões, mesmo prompt); isolamento do sistema operacional dentro da máquina; captura mais completa de artefatos por meio do esquema de artefatos.

## Questões em aberto

- Disponibilidade de plugins/Skills nos workers: as Skills incluídas no repositório são sincronizadas gratuitamente com o workspace; Skills/plugins de agentes configurados no Gateway exigem uma decisão explícita de sincronização ou exclusão (de qualquer forma, o manifesto da ferramenta/do plugin faz parte do handshake de admissão).
- Cadência padrão de checkpoints: baseada em turnos versus baseada em tempo para sessões com muitas interações.
- Como os perfis de ambiente interagem com o roteamento multiagente (perfis padrão por agente versus seleção apenas por sessão).
