---
read_when:
    - Projetando ou implementando o provisionamento de workers na nuvem, o modo worker ou a transferência de sessão
    - Alteração de environments.*, do protocolo do worker, da ingestão de transcrições ou das RPCs do proxy de inferência
    - Revisando a postura de segurança da execução remota de agentes
summary: Execute sessões de agentes em máquinas efêmeras acessíveis por SSH, com inferência intermediada pelo Gateway e transmissão em tempo real na barra lateral.
title: Plano de workers na nuvem
x-i18n:
    generated_at: "2026-07-12T00:04:51Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 134c3f6e486837607225d95d12a3153525b14237b362b9f9957313d9bc379dc4
    source_path: plan/cloud-workers.md
    workflow: 16
---

## Status

Proposta, revisão 3. Não implementada. Direção acordada em 2026-07; a revisão 2 incorporou as conclusões da análise adversarial (protocolo dedicado para workers, máquinas de estado de alocação/ambiente, sincronização de entrada com reconhecimento de Git, transferência unidirecional na v1, redação de segurança sobre saída controlada). A revisão 3 define o modelo de propriedade da sincronização (o worker cria os commits, o Gateway os adota e publica), adiciona um modo de sincronização simples sem Git, corrige a execução do worker para acesso completo dentro da máquina, transfere a política de internet para o momento do provisionamento e restaura o despacho de agentes para o marco 3.

## Problema

As sessões de agentes do OpenClaw executam seu loop, suas ferramentas e sua inferência dentro do processo do Gateway em uma única máquina. A capacidade computacional fica limitada por essa máquina, tarefas longas a ocupam e trabalhos paralelos disputam seus recursos. Produtos hospedados (agentes de nuvem do Cursor, Claude Code na web, Codex cloud) resolvem isso com sandboxes de nuvem efêmeros por tarefa, mas exigem infraestrutura e confiança no fornecedor.

Operadores que já possuem máquinas ociosas (ou podem alugá-las por um baixo custo) não têm como dizer: execute esta sessão naquela máquina, exiba-a na minha barra lateral como qualquer outra sessão e descarte a máquina depois.

## Objetivos

- Executar uma sessão completa de agente (loop + ferramentas) em uma máquina remota efêmera ("worker de nuvem"), enquanto a sessão aparece e transmite dados na interface de controle exatamente como uma sessão local.
- Nenhuma credencial permanente no worker (sem autenticação de provedor nem tokens de forge) e nenhuma saída direta de rede; a máquina precisa apenas de um sshd acessível.
- Provisionar, sincronizar, executar, coletar e destruir — de forma totalmente automatizada e compatível com provedores conectáveis (primeiro provedor: CLIs de locação no estilo do Crabbox).
- Despachar um trabalho em execução do Gateway para um worker no limite entre turnos sem perder a transcrição, a identidade da sessão nem, quando os bytes da solicitação permanecerem equivalentes, a afinidade com o cache do provedor; trazer os resultados de volta com segurança.
- Permitir que tanto humanos (pela interface) quanto agentes (por ferramenta) despachem trabalho para um worker de nuvem.
- Oferecer suporte a sessões com duração de vários dias; a duração é definida por política, não por um limite codificado.

## Fora do escopo (v1)

- Nenhum ambiente externo de programação (Claude Code, Codex CLI) nos workers. As sessões dos workers executam apenas o executor integrado do OpenClaw. O suporte a ambientes externos será opcional na v2, pois eles realizam a própria inferência com credenciais próprias.
- Nenhuma distribuição paralela de tentativas nem seleção da melhor entre N.
- Nenhuma dependência de VPN/tailnet. O transporte usa somente SSH.
- Nenhum novo runtime de sandbox. A máquina do worker é o limite de isolamento; o sandboxing do sistema operacional dentro da máquina poderá ser adicionado posteriormente.
- Nenhuma migração simétrica em tempo real na v1: o despacho ocorre do ambiente local → worker; o retorno do worker → ambiente local exige uma sessão interrompida e a reconciliação concluída do workspace. A transferência bidirecional em tempo real poderá ser implementada posteriormente sobre o mesmo mecanismo de barreiras.
- Nenhum estado auxiliar em JSON no Gateway; os estados de ambiente, alocação, cursor e concessão ficam no SQLite.

## Trabalhos anteriores (o que copiamos e o que invertemos)

- Agentes de nuvem do Cursor: o loop do agente é executado na nuvem deles; a VM é um destino para execução de ferramentas; um armazenamento de conversas somente para anexação é transmitido a todos os clientes; um snapshot após a instalação permite inicialização rápida; workers auto-hospedados são processos que realizam apenas conexões de saída. Copiamos o modelo em que "a fonte da verdade da conversa permanece no orquestrador" e o modelo de transmissão; invertemos a alocação do loop (consulte a decisão abaixo).
- Codex cloud: runtime em duas fases — fase de configuração com rede e, em seguida, fase do agente offline com os segredos removidos; cache do estado do contêiner para acompanhamentos rápidos. Copiamos a divisão em fases como nossa estratégia de saída de rede e a ideia de cache para imagens aquecidas na v2.
- Claude Code na web: VM por sessão; proxy Git que isola credenciais (tokens reais nunca entram no sandbox e o envio é restrito ao branch da sessão); snapshot do sistema de arquivos após a configuração; transferência por teletransporte = branch enviado + histórico reproduzido. Copiamos o isolamento de credenciais e o modelo de transferência, mas a sincronização de saída usa rsync a partir do Gateway, permitindo árvores de trabalho com alterações e garantindo que nenhum token de forge fique próximo da máquina.
- Agente de programação do Copilot: saída de rede bloqueada por padrão, com uma lista de permissões para registros de pacotes. Nosso padrão em estado estável é mais restritivo (nenhuma saída direta), pois a inferência e a pesquisa na web chegam pelo túnel SSH — mas consulte Segurança para entender por que isso é uma "saída controlada", e não uma "saída inexistente".

## Decisão de arquitetura: loop no worker, inferência pelo Gateway

Foram consideradas três alocações:

1. O loop permanece no Gateway e o worker executa as ferramentas (modelo do Cursor). É o domínio de falhas mais seguro (transcrição, inferência, aprovações e recuperação após reinicialização permanecem no ambiente local) e foi o primeiro marco preferido por um revisor. Rejeitado como arquitetura do produto: as ferramentas que não são de execução do OpenClaw realizam operações de sistema de arquivos no próprio processo, portanto cada leitura, edição ou busca com grep em arquivos se tornaria uma viagem de ida e volta pela rede ou exigiria uma grande refatoração da superfície de ferramentas em RPCs de workspace de granularidade ampla; o comportamento do runtime envolve muitas interações e fica limitado pela latência. Reutilizamos esse princípio onde ele já está implementado (delegação de execução para Nodes), mas não implementamos a camada de execução remota de ferramentas.
2. O loop e a inferência ficam no worker. É o domínio de falhas mais simples, mas as credenciais do modelo (incluindo perfis OAuth) precisam ser enviadas para máquinas descartáveis, o Gateway perde o controle de políticas, roteamento e auditoria, e a migração altera a identidade que chama o provedor, invalidando seus caches.
3. Loop + ferramentas no worker, com chamadas ao modelo intermediadas pelo Gateway. Opção escolhida. Uma viagem de ida e volta por turno do modelo, em vez de uma por chamada de ferramenta; as ferramentas são executadas próximas ao código; o Gateway permanece como único proprietário dos perfis de autenticação, do roteamento de provedores e das políticas; o worker não armazena segredos.

O custo da opção 3 é uma dependência síncrona do Gateway durante cada turno do modelo, portanto suas regras de durabilidade fazem parte da decisão, não são uma consideração posterior:

- A perda do Gateway durante um turno faz a chamada ativa ao provedor falhar. O turno é marcado como falho e repetido como um novo turno após a reconexão; não há reprodução transparente de uma transmissão do provedor em andamento, devido ao risco de cobrança e chamada de ferramenta duplicadas.
- Cada operação worker↔Gateway carrega uma identidade durável (consulte Protocolo do worker), para que reconexões retomem a operação ou obtenham resultados terminais armazenados em cache, em vez de deixá-la pendente.
- O Gateway é um componente com capacidade gerenciada: limites de workers simultâneos, controle de fluxo e descarte de carga fazem parte do escopo da v1 (consulte Capacidade).

Como o Gateway armazena a transcrição e origina todo o tráfego para o provedor, a sessão independe da localização: mover o loop entre o Gateway e o worker não altera nada no lado do provedor nem no caminho dos dados da interface. É isso que torna baratos o despacho e o retorno.

## Componentes

### 1. Máquina de estados do ambiente + contrato do provedor

`environments.*` no protocolo do Gateway atualmente é apenas uma projeção de status. O núcleo durável é um registro de ambiente e uma máquina de estados pertencentes ao SQLite, projetados antes dos formatos de RPC:

`requested → provisioning → bootstrapping → ready → (attached|idle) → draining → destroying → destroyed | failed | orphaned`

- O provisionamento é seguro contra falhas: a linha de intenção é persistida antes da chamada ao provedor, com um identificador de operação determinístico, para que uma reinicialização do Gateway possa adotar uma locação em andamento em vez de provisionar duas vezes ou abandonar uma máquina paga.
- A reconciliação após reinicialização e um processo de limpeza de órfãos (`inspect` do provedor em comparação com os registros locais) são requisitos da v1, não medidas adicionais de robustez.

Contrato do provedor (implementado por Plugin; sem nomes de provedores nem políticas no núcleo):

```ts
type WorkerProvider = {
  id: string;
  provision(profile: WorkerProfile, opId: string): Promise<WorkerLease>; // → ssh host/port/user/key material
  inspect(lease: { leaseId: string; profile: WorkerProfile }): Promise<LeaseStatus>; // adopt/health/orphan sweep
  renew?(leaseId: string): Promise<void>; // long-lived sessions vs provider TTLs
  destroy(lease: { leaseId: string; profile: WorkerProfile }): Promise<void>; // idempotent, returns only on proof of teardown
};
```

RPCs: `environments.create`, `environments.destroy`, `environments.list/status` estendidos (provedor, identificador da locação, estado, idade, tempo ocioso e sessões anexadas). Primeiros provedores: um wrapper de CLI de locação no formato do Crabbox (caminho do produto) e um provedor de host SSH estático marcado como exclusivo para desenvolvimento — um worker em um host compartilhado pode ler dados não relacionados desse host, portanto hosts estáticos servem para o desenvolvimento do recurso, e não como estratégia padrão.

### 2. Inicialização do worker: instalar o OpenClaw na máquina

Nenhum artefato específico para o worker e nenhuma dependência da disponibilidade do npm:

- Instalação canônica para todos os modos: um pacote do worker produzido pelo Gateway e identificado por hash de conteúdo (a saída de compilação do próprio Gateway empacotada como tarball), enviado por SSH e instalado na máquina. Por definição, isso abrange builds de desenvolvimento e commits ainda não lançados.
- `npm i -g openclaw@<exact gateway version>` é uma otimização quando o Gateway executa uma versão lançada; nunca `latest`.
- A inicialização é idempotente; uma locação aquecida com um hash de pacote correspondente ignora a instalação. Máquinas sem preparação podem precisar de uma fase de cadeia de ferramentas com acesso à rede (runtime do Node) — parte da fase de configuração, encerrada posteriormente.
- O handshake verifica o hash do build do worker, o conjunto de recursos do protocolo e a compatibilidade do runtime. As verificações existentes de versão/protocolo do Gateway são insuficientes para isso (Nodes conectados por túnel SSH são isentos da rejeição por versão exata), portanto a admissão do worker realiza sua própria verificação exata do build.

O modo worker (`openclaw worker`) é um ponto de entrada, não uma bifurcação: tratamento da conexão mais o executor integrado do agente, com persistência de sessão e chamadas ao modelo respaldadas por RPCs do Gateway. Ele não pode iniciar superfícies do Gateway: sem canais, sem inicialização automática de plugins além do conjunto de ferramentas da sessão, diretório de estado descartável e sem perfis de autenticação locais.

### 3. Transporte: tudo por SSH

O Gateway controla a conectividade; o worker não exige nada além de sshd:

- O Gateway abre uma conexão SSH com o worker (credenciais provenientes da locação do provedor e chave do host fixada a partir da saída de provisionamento — sem `StrictHostKeyChecking=no`) e estabelece um túnel reverso que encaminha um socket local do worker para o endpoint WS do Gateway.
- O tráfego de controle/modelo e a transferência do workspace usam conexões SSH separadas com o mesmo material de confiança fixado, para que o rsync não bloqueie as transmissões de tokens no início da fila.
- O ciclo de vida do túnel (keepalive e reconexão com recuo) pertence ao runtime do ambiente no Gateway. Uma breve interrupção do túnel é invisível no nível da sessão: o estado durável do protocolo (abaixo) permite que o worker se anexe novamente e retome a operação.

### 4. Protocolo do worker (dedicado; não é o protocolo de Node)

A análise adversarial das interfaces atuais de Node descartou a reutilização direta: invocações pendentes de Node são promessas locais do processo que deixam de existir com a conexão, as chaves de idempotência de Node são analisadas, mas não deduplicadas, e — de forma decisiva — um Node conectado pode emitir eventos comuns de Node (incluindo solicitações de execução de agente), portanto "tipo de Node + limite de capacidade" não constitui um limite de segurança de entrada. Assim, os workers recebem uma função `worker` autenticada com uma lista fechada e versionada de RPCs/eventos permitidos; conexões de workers não podem alcançar nenhum manipulador de eventos legado de Node.

Identidade e credenciais: o provisionamento emite uma credencial de curta duração para o worker, vinculada ao identificador do ambiente, à chave do worker, ao hash do pacote, à única sessão permitida, ao conjunto de RPCs permitido e a uma validade. O pareamento verificado por SSH ainda se aplica (provisionamos a máquina e mantemos a chave), mas a autorização vem da credencial emitida, não da superfície de Node declarada.

Semântica de operações duráveis (formato baseado no runtime ACP existente e em seu livro-razão de eventos — identificadores estáveis, serialização por sessão e reprodução durável de `(session, seq)`):

- Cada operação pertence ao escopo `(sessionId, lifecycleRevision, runId, ownerEpoch, streamKind, seq)`.
- Épocas de propriedade isolam workers obsoletos: um worker substituto avança a época; resultados tardios da época anterior são rejeitados de forma determinística.
- Entrega pelo menos uma vez, com cursores de ACK persistidos e resultados terminais armazenados em cache no SQLite; a deduplicação é determinística. Não há garantias de execução exatamente uma vez.
- Quadros explícitos para cancelamento, encerramento, retomada e resultados terminais; controle de fluxo baseado em créditos/janelas nas transmissões.
- A negociação de recursos do protocolo é independente da versão geral do protocolo de Node.

### 5. RPCs do backend de sessão

Dois contratos distintos — a base de código atual separa as mutações duráveis da transcrição (sob responsabilidade do gerenciador de sessões, árvore JSONL com estado de pai/folha) dos eventos ativos locais ao processo (deltas de streaming, ciclo de vida das ferramentas, aprovações), e o protocolo do worker deve preservar essa separação:

- Confirmações duráveis da transcrição: o worker envia lotes semânticos de anexação com `runEpoch` + comparação e troca da folha-base; o gerenciador de sessões do Gateway gera os ids das entradas e os ids dos pais. O worker jamais pode fornecer linhas confiáveis de transcrição, ids de entradas, ids de pais ou ids de sessões externas.
- Eventos ativos reproduzíveis: uma união tipada de eventos com números de sequência do worker, ACKs do Gateway, retenção limitada e bloqueio de eventos tardios, alimentando a distribuição existente de eventos do agente para que a visualização do chat, as linhas de ferramentas e a lógica de não lidos/status se comportem de forma idêntica às sessões locais.

Proxy de inferência: reutilize o vocabulário de eventos do cliente de streaming do proxy de runtime existente (`src/agents/runtime/proxy.ts`), mas desloque o limite de confiança. O worker envia apenas a identidade da sessão/execução, uma referência de modelo aprovada, o contexto e opções restritas de geração; o Gateway resolve provedor, endpoint, autenticação, cabeçalhos, roteamento e política de custos usando seu próprio catálogo. Um objeto de modelo fornecido pelo worker (por exemplo, `baseUrl` controlada por um invasor) é rejeitado. Aplicam-se limites de tamanho das solicitações, cancelamento, auditoria e reprodução do resultado terminal. Ferramentas residentes no Gateway (websearch) são executadas no Gateway e retornam os resultados pelo mesmo canal.

### 6. Sincronização do espaço de trabalho

A âncora de sincronização é um espaço de trabalho local ao Gateway com propriedade exclusiva de alocação: para espaços de trabalho git, uma worktree gerenciada dedicada (os metadados existentes da worktree gerenciada — branch, base, propriedade do snapshot — são a fundação); para espaços de trabalho sem git, um diretório de destino pertencente ao Gateway. Nunca o checkout ativo do usuário. A propriedade exclusiva enquanto a sessão está alocada remotamente é o que torna a sincronização de entrada livre de conflitos por construção.

Divisão de responsabilidades — commit versus publicação:

- O agente do lado do worker cria commits normalmente em sua cópia (`git commit` é uma operação local que não exige credenciais; a identidade do autor é projetada a partir da configuração do Gateway). Esses commits são objetos inertes até que o Gateway os adote.
- O Gateway faz tudo que exige confiança: verifica se os commits recebidos se baseiam na base registrada, avança a worktree local por fast-forward, faz push, cria PRs e, opcionalmente, assina ou reassina — tudo com credenciais locais ao Gateway. O worker nunca possui credenciais do git ou da plataforma de hospedagem e nunca acessa um remoto.

Dois modos de sincronização, selecionados conforme o espaço de trabalho seja ou não um repositório git:

- Modo git. Saída: sincronize a worktree com rsync (incluindo arquivos não confirmados e arquivos não rastreados elegíveis; inclusão/exclusão no estilo do crabbox, respeitando `.worktreeinclude`) usando a identidade SSH do túnel, registrada como um manifesto-base imutável (hashes de conteúdo + commit-base). Entrada: novos commits retornam como um bundle do git ou uma referência temporária baseada na base registrada; artefatos não rastreados retornam por meio de um manifesto explícito com verificações de tamanho, tipo e contenção de links simbólicos. A adoção verifica a ancestralidade da base e para em caso de divergência — nada sobrescreve silenciosamente nenhum dos lados. Exclusões, renomeações, submódulos e escapes por links simbólicos são tratados pelas regras do manifesto, não por heurísticas do rsync.
- Modo simples (sem git — por exemplo, ao criar um projeto do zero na máquina). A saída usa o mesmo rsync + manifesto-base. A entrada é um espelhamento com diferenças de manifesto de volta para o diretório de destino pertencente ao Gateway, com propagação de exclusões. É seguro pelo mesmo motivo que o modo git: a propriedade exclusiva significa que não existem edições locais simultâneas com as quais entrar em conflito; o manifesto-base ainda detecta desvios locais inesperados e para em vez de sobrescrever.

A criação de pontos de verificação protege sessões que duram vários dias contra a perda da concessão: pontos de verificação periódicos de entrada (commits na branch da sessão no modo git, snapshots de manifesto no modo simples); a cadência é uma política do perfil (por turno, por padrão).

### 7. Máquina de estados de alocação, sessões e interface

A alocação do runtime é uma máquina de estados pertencente ao SQLite e vinculada à sessão, não um par de campos soltos de uma linha:

`local → requested → provisioning → syncing → starting → active(worker) → draining → reconciling → local | reclaimed | failed`

Ela persiste o id do ambiente, a geração da transição, a época do proprietário ativo, o manifesto-base do espaço de trabalho, o hash do bundle do worker e os últimos cursores de ACK. A admissão de turnos reivindica atomicamente a alocação antes que qualquer um dos loops inicie um turno, portanto uma mensagem local admitida com base em um snapshot obsoleto jamais pode disputar com um turno do worker — exatamente um loop é proprietário da sessão a qualquer momento.

Interface:

- Uma sessão de worker é uma linha de sessão comum com metadados de alocação. Ela reside no armazenamento normal, é listada por `sessions.list` e transmitida pelas assinaturas existentes — a barra lateral e o chat não precisam de um novo caminho de dados, apenas de apresentação: um emblema de worker e o status da alocação/ambiente (`provisioning / syncing / running / idle / reconciling / reclaimed`).
- Experiência de criação: a barra de destino da sessão (reformulação da barra lateral de sessões) recebe um destino de worker na nuvem ao lado do Gateway e do Node. Exige um perfil de provedor configurado; o recurso permanece invisível até ser configurado.
- Delegação pelo agente: uma ferramenta da sessão permite que um agente encaminhe trabalho a um worker na nuvem da mesma forma que uma pessoa faz (subsessão apoiada por worker, no estilo de subagente). É lançada no mesmo marco que a delegação humana, condicionada à mesma configuração opcional de provedor. A recursão é limitada estruturalmente (sessões de worker não podem delegar a outros workers na v1); o controle de gastos é feito por contabilização/auditoria por ambiente, não por mecanismos de cota.

## Delegação e transferência

A v1 é deliberadamente assimétrica:

- Local → worker (delegação): ultrapasse a barreira de migração abaixo, provisione ou reutilize um worker, sincronize, altere a alocação; o próximo turno será executado remotamente.
- Worker → local (retorno): pare a sessão (esvazie o worker conforme a mesma barreira), conclua a reconciliação de entrada e altere a alocação para local. Não é uma migração ativa.
- Transferência ativa simétrica (mover uma sessão que está trabalhando ativamente nos dois sentidos sem interrompê-la) reutiliza a mesma barreira e o mesmo mecanismo de reconciliação e será lançada depois que testes de injeção de falhas comprovarem a barreira.

Barreira de migração (apenas o “limite do turno” é insuficiente — aprovações, processos em segundo plano e mesclagens de transcrição após a liberação do bloqueio podem atravessá-lo):

1. Interrompa a admissão de novos turnos (reivindicação da alocação).
2. Cancele ou esvazie as execuções ativas.
3. Revogue aprovações de execução e concessões de execução pendentes.
4. Esvazie as gravações paralelas da transcrição e os ACKs de eventos ativos.
5. Encerre os processos filhos do worker.
6. Isole o proprietário anterior avançando a época do proprietário.
7. Reconcilie o espaço de trabalho (entrada, com tratamento de conflitos).
8. Ative o novo proprietário.

Afinidade de cache: como as solicitações ao provedor se originam no Gateway em ambas as alocações, a afinidade de cache é preservada quando a solicitação serializada ao provedor permanece equivalente — mesma ordem de ferramentas, instruções do sistema, wrappers do provedor e metadados de cache (que permanecem no Gateway). Essa é uma propriedade testável, não uma suposição: testes de equivalência byte a byte entre alocações local/worker para cada transporte de provedor compatível fazem parte do marco que introduz o loop do worker.

## Modelo de segurança

Em termos precisos: o worker não tem saída direta para a rede nem credenciais permanentes de provedor/plataforma de hospedagem. Isso não significa “saída zero” — a inferência e as ferramentas executadas pelo Gateway são canais de saída controlados (um worker afetado por injeção de prompt ainda pode incluir bytes do espaço de trabalho no contexto do modelo ou em consultas de websearch). Portanto:

- Contabilização da saída controlada: auditoria por ambiente e contabilização visível ao operador no proxy de inferência e nas ferramentas do Gateway. Limites de taxa/bytes existem como controle de fluxo do protocolo (capacidade), não como mecanismos de cota de gastos.
- A entrada do worker no Gateway é a lista fechada de permissões do protocolo do worker; as gravações na transcrição são restringidas estruturalmente (ids gerados pelo Gateway, uma única sessão vinculada).
- A execução pelo worker tem permissão total dentro da máquina. A máquina é descartável e não contém credenciais, portanto a aprovação por comando adiciona atrito sem proteger nada; o limite protegido é a reconciliação de entrada e a auditoria. A execução nunca percorre o caminho de aprovação do Node no Gateway.
- A política de internet é uma decisão do provedor no momento do provisionamento: o perfil do ambiente decide na criação da máquina (firewall/grupo de segurança/rede sem saída), opcionalmente com uma fase de configuração com rede que o provedor encerra antes da fase do agente. O núcleo não implementa um controle de rede no runtime.
- Higiene da máquina no momento do provisionamento: endpoint de metadados da nuvem bloqueado ou comprovadamente ausente, nenhum perfil de instância, nenhum agente SSH herdado, nenhum socket do Docker, ambiente/home limpos. As chaves de host SSH são fixadas a partir da saída do provisionamento.
- As aprovações e políticas de tudo que ocorre no lado do Gateway (push, PR, chamadas ao provedor) continuam sendo executadas no Gateway.

Raio de impacto de uma sessão de worker comprometida: a cópia sincronizada do espaço de trabalho mais o que os canais de proxy auditados permitirem — sem credenciais, sem rede direta e sem acesso a superfícies do Gateway além da lista de permissões.

## Capacidade

O Gateway retransmite cada prompt e fluxo de tokens para N workers, portanto a v1 define um modelo de capacidade em vez de descobri-lo em produção: limites de workers simultâneos por Gateway, janelas de crédito por fluxo (a fila atual do fluxo de eventos é ilimitada, e o limite do buffer do socket do Node encerra à força consumidores lentos — ambos são inadequados sem modificação), armazenamento temporário limitado em disco para picos e redução de carga com estados visíveis de contrapressão na interface. A transferência do espaço de trabalho permanece em seu próprio canal SSH.

## Ciclo de vida

- A interrupção automática por inatividade e o TTL são políticas do perfil do provedor, não constantes fixas. Os padrões são generosos, com manutenção explícita da atividade; trabalhos que duram vários dias são tratados como casos de primeira classe (o provedor oferece `renew` para backends baseados em concessão); uma sessão com um turno em andamento ou atividade recente jamais é recuperada.
- Em caso de morte ou recuperação do worker: a alocação passa para `reclaimed`, a linha da sessão permanece, e a próxima mensagem provisiona um novo worker e sincroniza novamente a partir do último ponto de verificação. A conversa nunca é perdida (armazenamento no lado do Gateway); as alterações no espaço de trabalho desde o último ponto de verificação são perdidas, e a interface informa isso.
- Reutilização de concessões aquecidas desde o primeiro dia (para provedores que oferecem suporte); o snapshot da imagem após a inicialização é o caminho de inicialização rápida da v2.

## Superfície de configuração

Mínima e opcional: um bloco de perfil do provedor (id do provedor, referência às credenciais/CLI, regras de sincronização, política de duração, orçamentos e fase de configuração opcional), além da seleção de alocação por sessão. Nenhuma nova variável de ambiente. Instalações não configuradas não exibem nada.

## Marcos

A implementação é entregue como PRs pequenos que podem ser mesclados de forma independente; cada marco abaixo é uma série de PRs, não uma única alteração.

1. Fundações: máquina de estados do ambiente + contrato do provedor + provedor no formato do crabbox (SSH estático como ambiente de desenvolvimento), inicialização do bundle do worker + handshake de admissão, túnel SSH + fixação da chave do host, snapshot da worktree gerenciada + sincronização de saída (modos git + simples). Varredura de órfãos + adoção após reinicialização.
2. Protocolo do worker + loop do worker: função autenticada do worker, operações duráveis/épocas/cursores de ACK, contratos de confirmação da transcrição + eventos ativos, proxy de inferência com modelos resolvidos pelo Gateway, controle de fluxo. Um provedor, apenas delegação humana de novas sessões, sem transferência. Testes de injeção de falhas (partição do túnel, reinicialização do Gateway, morte do worker) condicionam a conclusão.
3. Delegação + retorno + delegação pelo agente: barreira de migração, máquina de estados de alocação conectada à barra de destino da interface, reconciliação de entrada + pontos de verificação, auditoria por ambiente, limites de capacidade, ferramenta de delegação pelo agente (sessões de worker não podem recorrer). Testes de equivalência byte a byte do cache de prompts.
4. Transferência ativa simétrica, após a comprovação por injeção de falhas do marco 3.

Posteriormente: ambientes de teste ACP nos workers como opção de hidratação de credenciais por ambiente; inicialização rápida por snapshot/imagem aquecida; distribuição em leque (N concessões, mesmo prompt); sandboxing do sistema operacional dentro da máquina; captura mais completa de artefatos por meio do esquema de artefatos.

## Questões em aberto

- Disponibilidade de plugins/Skills nos workers: as Skills incluídas no repositório são sincronizadas gratuitamente com o workspace; Skills/plugins de agente configurados no Gateway exigem uma decisão explícita de sincronização ou exclusão (o manifesto de ferramenta/plugin faz parte do handshake de admissão em ambos os casos).
- Cadência padrão de checkpoints: baseada em turnos ou em tempo para sessões com muitas mensagens.
- Como os perfis de ambiente interagem com o roteamento multiagente (perfis padrão por agente ou apenas seleção por sessão).
