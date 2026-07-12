---
read_when:
    - Projetando o comportamento de descoberta, continuação ou arquivamento de sessões do Codex
    - Alteração da interface nativa do catálogo de sessões ou dos RPCs do Gateway
    - Estendendo a supervisão do Codex entre nodes pareados
summary: Arquitetura e limite do produto para supervisionar sessões nativas do Codex pelo OpenClaw.
title: Supervisão do Codex
x-i18n:
    generated_at: "2026-07-12T15:38:45Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 78528afd31c18fc84e0adb6479a688da7df6d0a5c04e539d253c84d3a17a5f53
    source_path: specs/codex-supervision.md
    workflow: 16
---

# Supervisão do Codex

## Objetivo

A supervisão do Codex permite que um operador do OpenClaw descubra sessões nativas do Codex e,
quando for seguro, crie uma ramificação local pela interface normal do Chat do OpenClaw.
O Codex App Server continua sendo o proprietário da thread e do loop do modelo. O OpenClaw fornece o
catálogo da frota, a interface autenticada do operador, a vinculação de sessões e a entrega pelo canal.

O recurso pertence ao plugin oficial `codex`. Não há um plugin
Supervisor separado nem uma segunda implementação do protocolo Codex.

## Limite do produto

O catálogo é registrado sempre que o plugin Codex está ativo. Habilite as ferramentas de
supervisão voltadas ao agente com:

```text
plugins.entries.codex.config.supervision.enabled = true
```

O produto inicial ativo é intencionalmente menor que o plano de longo prazo para a
frota:

- Liste apenas threads não arquivadas do Codex.
- Agrupe linhas locais e de nós pareados com participação habilitada por uma identidade estável do host.
- Crie uma ramificação normal do Chat, com modelo bloqueado, a partir de uma thread armazenada ou ociosa
  local ao Gateway, inicie sua thread completa do harness do Codex no primeiro turno ou abra o Chat
  criado para uma ramificação anterior.
- Arquive uma thread armazenada ou ociosa local ao Gateway somente após uma confirmação explícita
  de que não há outro executor.
- Exiba fontes locais ativas sem controles de nova ramificação ou arquivamento, mas ainda
  permita abrir um Chat supervisionado existente.
- Exiba as linhas mais recentes por host na barra lateral principal, mantenha o catálogo completo na
  página de sessões e forneça leituras limitadas e paginadas por cursor das transcrições de
  linhas locais e de nós pareados.
- Isole por host as falhas do catálogo.

O catálogo é a coleção de itens não arquivados. Uma linha nele ainda pode ter um
status de turno ocioso, ativo, `notLoaded` ou com erro.

A supervisão voltada ao agente continua sendo opcional. A integração guiada tenta instalá-la e habilitá-la
depois que a detecção da instalação nativa do Codex é bem-sucedida e o backend de inferência
selecionado passa na verificação em tempo real, independentemente de qual backend principal o usuário
selecionar. A supervisão só é ativada quando essa configuração oportunista do plugin
é bem-sucedida. Um plugin explicitamente desabilitado, um bloqueio de política ou
`supervision.enabled: false` continua tendo autoridade sobre as ferramentas de supervisão, mas
não desabilita o catálogo de sessões do operador.

## Propriedade

O plugin `codex` é responsável por todo o comportamento do Codex App Server:

- descoberta do endpoint e ciclo de vida da conexão
- inicialização do protocolo e verificações de versão
- listagem, leitura, retomada e arquivamento de threads, além do tratamento de eventos
- pontes de aprovação e entrada do usuário
- vinculações de threads nativas às sessões do OpenClaw
- imposição do modelo e do harness exclusivos do Codex após a continuação

A Control UI e o Gateway consomem esse serviço pertencente ao plugin. Eles não leem
diretamente os arquivos de rollout do Codex nem implementam outro cliente do App Server.

A topologia local padrão é:

```text
Codex Desktop -> App Server stdio privado -> diretório pessoal do usuário do Codex
                                             ^
plugin Codex do OpenClaw -> conexão do App Server de supervisão
  (o padrão é stdio gerenciado no diretório pessoal do usuário; configurações appServer explícitas são respeitadas)
  -> catálogo passivo de fontes e leitura
  -> fixação de snapshot -> ramificação canônica da fonte appServer
  -> injeção do histórico visível e todos os turnos posteriores do Chat supervisionado

Sessões comuns do Codex no OpenClaw -> stdio gerenciado no diretório pessoal do agente por padrão
  -> threads comuns do harness completo -> Chat do OpenClaw e entrega pelo canal
```

Habilitar a supervisão não altera o harness comum do Codex: ele continua tendo
escopo de agente por padrão. A conexão de supervisão separada usa por padrão
stdio gerenciado no diretório pessoal do usuário, portanto seu catálogo e suas operações de snapshot veem threads nativas
armazenadas. Configurações explícitas de conexão de `appServer` são respeitadas. Quando
`homeScope` não está definido, a conexão de supervisão o resolve como `"user"` para stdio
ou Unix e como `"agent"` para WebSocket. Defina `appServer.homeScope: "user"`
explicitamente somente quando o harness comum também precisar compartilhar o diretório pessoal nativo do Codex.
Um Chat adotado do grupo do Codex na barra lateral é a exceção: sua vinculação privada de
supervisão mantém as leituras da fonte, a criação da ramificação canônica e os turnos
posteriores na conexão de supervisão. O status em tempo real e a propriedade permanecem
locais ao processo; uma thread desconhecida pelo processo de supervisão do OpenClaw é `notLoaded`,
mesmo quando o Codex Desktop a está executando ativamente.

O Codex tem um daemon local canônico experimental com um contrato separado de
bootstrap gerenciado pelo instalador. Este recurso não deve inicializar, reivindicar
nem presumir implicitamente esse daemon.

## Fluxo do catálogo

O método genérico do Gateway `sessions.catalog.list` encaminha para o provedor de
catálogo `codex`, que sempre solicita `archived: false` e os tipos de origem
interativos `cli` e `vscode`. Ele combina:

1. Resultados de `thread/list` locais do Gateway provenientes do App Server de
   supervisão, que, por padrão, usa stdio gerenciado no diretório inicial do usuário.
2. Resultados de `codex.appServer.threads.list.v1` de cada Node conectado e habilitado.

A seleção da transcrição usa `thread/turns/list` com `itemsView: "full"` localmente ou
o comando versionado `codex.appServer.thread.turns.list.v1` no Node selecionado.
Cada resposta contém no máximo 20 turnos persistidos, além de cursores opacos
para frente e para trás. A interface de controle solicita páginas da mais recente para
a mais antiga, renderiza cada página em ordem cronológica e insere as páginas mais
antigas no início. Ela nunca recorre a um `thread/read` sem limite. O OpenClaw também
rejeita qualquer página de itens serializada acima de 20 MiB antes que ela possa
atravessar o transporte do Node ou do Gateway.

A implementação nativa do Node pareado no macOS aceita apenas
`appServer.transport: "stdio"` não definido/padrão ou explícito, com escopo de
supervisão não definido/padrão ou `appServer.homeScope: "user"` explícito. Ela
repassa `command`, `args` e `clearEnv` normalizado configurados ao processo filho.
Com `"unix"`, `"websocket"` ou `homeScope: "agent"` explícito, ela não anuncia nem
a funcionalidade de catálogo nem o comando; a invocação direta também falha de
forma segura. Ela nunca deve expor o diretório inicial do Codex do usuário para
uma configuração com escopo de agente nem substituir um endpoint explícito por
stdio local.

A projeção do catálogo normaliza identificadores, título, cwd, status, sinalizadores
de espera ativa, carimbos de data e hora, origem, provedor de modelo, versão do
Codex e branch do Git. Ela não retorna prévias de transcrição, turnos, caminhos de
rollout, caminhos do diretório inicial do Codex, remotos do Git, SHAs de commits,
endpoints brutos nem erros brutos do App Server. As respostas de transcrição
contêm apenas a página de itens do App Server solicitada explicitamente e seus
cursores opacos.

As falhas de host permanecem locais ao resultado de cada host. Um Node offline ou um
App Server local indisponível não remove da página os hosts íntegros. A conectividade é uma
propriedade do host, não um status da thread: um resultado de host com falha não contém
linhas de sessão atualizadas nem projeta `offline` nas threads nativas.

A descoberta do catálogo é passiva. Listar ou ler metadados não deve chamar
`thread/resume`, inscrever o cliente OpenClaw em solicitações de threads em tempo real nem
responder a uma aprovação.

A busca considera apenas o título e não diferencia maiúsculas de minúsculas. Para cada página de catálogo retornada, o
Gateway e o Mac emparelhado examinam um número limitado de páginas nativas sem passar
a consulta ao App Server, pois a busca nativa também pode encontrar correspondências em prévias de
transcrições. O cursor nativo retornado permite que os chamadores continuem a busca.

## Limite da CLI do operador

O plugin registra três comandos de shell com suporte do Gateway:

```text
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [gateway-options]
openclaw codex continue <thread-id> [--json] [gateway-options]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [gateway-options]
```

`[gateway-options]` corresponde a `--url <url>`, `--token <token>`, `--timeout <ms>` e
à opção herdada `--expect-final`. A listagem de sessões usa 75.000 ms por padrão;
continue e archive usam 30.000 ms por padrão;
`--expect-final` não tem efeito adicional para essas RPCs unárias. A busca de sessões
considera apenas o título e não diferencia maiúsculas de minúsculas; cada resposta percorre uma cadeia
limitada de páginas nativas, e `--cursor` continua nos resultados mais antigos. O limite padrão é 50 por host
e aceita valores de 1 a 100, e um cursor exige um destino `--host`
estável. Nenhum comando aceita
uma opção de arquivadas/incluir arquivadas. Somente `sessions` pode direcionar hosts pareados;
`continue` e `archive` sempre enviam `hostId: "gateway:local"`, e archive
exige a opção explícita de confirmação.

O namespace do shell não é o namespace de runtime `/codex` no chat. Em
particular, `/codex sessions --host <node>` lista os arquivos de sessão da CLI do Codex em um
Node, `/codex threads` lista as threads do App Server para a conexão da conversa
atual, e `/codex resume` ou `/codex bind` altera a vinculação dessa conversa.
Esses comandos não substituem `sessions.catalog.continue`, e não há
nenhum comando de runtime `/codex continue` ou `/codex archive`.

## Continuação local

Para uma linha armazenada ou ociosa local do Gateway, a interface chama
`sessions.catalog.continue` com `catalogId: "codex"`, além dos ids do host e da thread.
O plugin:

1. Reutiliza o Chat supervisionado existente quando a origem já possui um.
2. Caso contrário, projeta um histórico limitado do usuário e do assistente até o
   último turno terminal persistido da origem (concluído, interrompido ou com falha) em um novo
   Chat do OpenClaw e registra uma ramificação pendente do harness.
3. Armazena a política pendente de bloqueio de modelo exclusiva do Codex, e não uma seleção concreta de modelo ou
   provedor, além do escopo privado da conexão de supervisão, e
   retorna a `sessionKey` do OpenClaw.

A projeção do histórico seleciona a parte final mais recente das mensagens visíveis
do usuário e do assistente, com limites rígidos de 200 mensagens, 512 KiB de texto
UTF-8 no total e 64 KiB por mensagem. Ela substitui entradas de imagem e imagem local
por `[Image attachment]`, nunca copia dados ou caminhos de imagens e omite raciocínio,
chamadas de ferramentas e resultados de ferramentas.

A interface navega para o Chat normal com essa chave de sessão. Ainda não existe uma
thread canônica do harness. No primeiro turno normal do Chat, o harness instala os
manipuladores reais de aprovação, elicitação, eventos e entrega do Codex e, em seguida:

1. Usa a conexão de supervisão para chamar `thread/fork` nativamente, sem uma substituição de modelo
   ou provedor, e fixa o snapshot persistido da origem. O estado atual do
   `ConfigManager` do Codex seleciona o modelo e o provedor, e a resposta da bifurcação
   informa o par efetivo. Se o modelo for diferente do último modelo registrado
   na origem, o Codex emitirá seu aviso normal de diferença de modelo.
2. Nessa mesma conexão, inicia a thread canônica completa do harness do Codex com
   `threadSource: "appServer"`, o cwd, a política, a configuração e o ambiente do OpenClaw, a
   superfície completa de ferramentas do harness do OpenClaw e exatamente o modelo e o provedor
   retornados pela bifurcação para esse início inicial.
3. Injeta o histórico visível e limitado do usuário e do assistente por meio dessa
   conexão, confirma a vinculação canônica sem descartar seu escopo de supervisão,
   executa o turno e arquiva a bifurcação temporária.

Antes do primeiro turno, o Chat é uma ramificação pendente bloqueada com um espelho
visível do histórico; depois disso, cada turno do modelo é executado pela thread canônica
do harness do Codex na conexão de supervisão. A ramificação não é um clone completo de
uma execução nativa: o raciocínio da origem, as chamadas de ferramentas e os resultados
das ferramentas são deliberadamente omitidos. Se a fixação do snapshot ou a criação da
thread canônica falhar, a ramificação pendente continuará permitindo novas tentativas.
Uma condição de corrida na vinculação, a supervisão desativada ou uma conexão de supervisão
indisponível ou incompatível causa uma falha fechada antes da execução do turno, em vez
de recorrer ao harness comum do diretório inicial do agente.

Isso garante uma seleção controlada pelo Codex, não a preservação do modelo
histórico da origem. O par retornado pela bifurcação é usado para iniciar a thread
canônica, e o Codex persiste o modelo e o provedor nativos dessa thread. Retomadas
posteriores omitem substituições de modelo e provedor do OpenClaw, portanto o Codex
restaura o par persistido. Se um controle nativo separado do Codex alterar a thread
canônica, o OpenClaw aceitará essa seleção nativa persistida. O modelo externo do
OpenClaw e a cadeia de fallback nunca o substituem.

Alterações de modelo, exclusão de sessão e operações de redefinição/nova sessão falham de modo fechado
no Chat supervisionado com modelo bloqueado. As mutações `/codex model <model>`, `/codex
bind`, `/codex resume` (incluindo o `--bind here` do Node) e `/codex detach` ou
`/codex unbind` também falham de modo fechado porque substituem ou removem a vinculação. A
consulta `/codex model` e `/codex fast`, `/codex permissions` e `/codex
threads` permanecem disponíveis. A ferramenta de agente `codex_threads` não pode anexar um novo
fork nem arquivar a thread nativa vinculada. A listagem e a leitura somente de metadados permanecem
disponíveis; os campos de transcrição exigem `supervision.allowRawTranscripts`, enquanto
renomear, desarquivar, criar um fork desvinculado e arquivar uma thread não relacionada exigem
`supervision.allowWriteControls`. Nenhuma das opções pode substituir a vinculação bloqueada.
Excluir ou redefinir a entrada do OpenClaw descartaria a vinculação
nativa e criaria ou permitiria uma thread genérica por trás de uma sessão com aparência de Codex.
Por isso, a manutenção de retenção preserva entradas com modelo bloqueado mesmo quando elas
excedem os limites comuns de idade, quantidade ou orçamento de disco. Desabilitar ou desinstalar o
plugin proprietário também preserva o bloqueio e o marcador de propriedade do plugin. O Chat permanece
indisponível e falha de modo fechado até que o mesmo plugin seja reabilitado; a limpeza nunca
o converte em uma sessão de modelo comum.

A origem nunca é retomada nem modificada por essa ação. O fork temporário fixa um
snapshot; ele não é a thread de continuação permanente. Iniciar uma thread distinta
do harness canônico no primeiro turno impede que o OpenClaw se torne uma
origem concorrente de gravação apenas porque o status local do processo não detectou um
turno pertencente ao Desktop. O espelho do histórico visível e o snapshot fixado podem omitir trabalhos
que ainda não foram concluídos em uma origem ativa. A origem original da CLI ou do VS Code
continua elegível para os catálogos nativo e do OpenClaw. A ramificação
canônica permanece uma thread nativa do Codex no armazenamento de supervisão, mas clientes nativos
podem filtrar seu tipo de origem `appServer`, portanto a visibilidade no Codex Desktop não é um
contrato.

## Comportamento de arquivamento

Para uma linha armazenada ou ociosa local do Gateway, `sessions.catalog.archive` com
`catalogId: "codex"` exige
`confirmNoOtherRunner: true` explícito, lê novamente o status local atual do processo,
prossegue apenas para `idle` ou `notLoaded`, chama `thread/archive` nativo
e retorna sucesso somente depois que o Codex aceita a operação. A linha então sai
do catálogo de itens não arquivados.

Um status ativo ou de erro na nova leitura rejeita o arquivamento. O mesmo ocorre com uma
ramificação supervisionada da origem que esteja inicializando ou pendente: o primeiro turno do Chat
deve materializar sua ramificação canônica antes que a origem possa ser arquivada. Um
proprietário conhecido de vinculação ativa do OpenClaw para o destino exato ou qualquer descendente
gerado não arquivado também rejeita o arquivamento. O OpenClaw pagina a relação experimental
`thread/list ancestorThreadId` do Codex e falha de modo fechado em caso de erros de solicitação ou
resposta, ciclos de cursor ou thread e esgotamento do limite de segurança. O arquivamento nativo pode
encerrar trabalhos carregados do pai e dos descendentes, portanto o arquivamento não é um atalho
para interrupção. As chamadas de leitura, enumeração de descendentes e arquivamento não são atômicas.
Um cliente independente ainda pode possuir ou iniciar trabalho em uma linha que pareça ociosa ou
`notLoaded` localmente. A confirmação de ausência de outro executor cobre clientes desconhecidos e
essa condição de corrida até que o Codex tenha arquivamento condicional ou uma concessão entre processos.
O arquivamento em Node pareado é proibido.

Não há visualização de itens arquivados no catálogo do Codex. Uma thread restaurada com
`thread/unarchive` em outra superfície do Codex autorizada pelo proprietário volta a ser elegível
para o catálogo de itens não arquivados.

## Segurança de threads ativas

O Codex serializa as mutações de uma thread entre clientes de um App Server, mas
não expõe uma concessão exclusiva de executor ou proprietário de aprovação entre processos.
App Servers stdio independentes podem acrescentar dados ao mesmo rollout, enquanto cada um vê
apenas seu próprio status em memória. As solicitações de aprovação também podem chegar a todos os assinantes
de um servidor, e a primeira resposta válida conclui a solicitação.

Portanto:

- clientes passivos do catálogo não assinam nem negam aprovações automaticamente
- linhas atualmente informadas como ativas não expõem uma nova ramificação nem **Archive**
- uma origem não mapeada torna-se uma ramificação do histórico visível cuja thread canônica
  do harness nunca retoma a origem
- `notLoaded` é exibido como atividade desconhecida e só pode ser arquivado após
  confirmação informada de ausência de outro executor
- o arquivamento local exige essa confirmação, além de uma nova leitura `idle` ou `notLoaded`,
  reconhecendo a condição de corrida do protocolo entre a leitura e o arquivamento

A interrupção e a transferência entre vários clientes são decisões futuras de produto. Elas não estão
implícitas na exibição de uma linha ativa.

## Limite do Node pareado

A invocação de Node atualmente funciona apenas como solicitação/resposta. Ela pode retornar com segurança
metadados limitados do catálogo e páginas de turnos da transcrição, mas não pode transportar o fluxo de eventos de longa duração, as solicitações de
aprovação, as chamadas de ferramentas, o cancelamento e os deltas do assistente necessários para uma execução
do harness do Codex.

Portanto, o contrato do Node oferece suporte a páginas de listagem e de turnos da transcrição. As linhas
remotas continuam legíveis, mas **Continue** e **Archive** ficam indisponíveis, independentemente do status de ociosidade. Uma
continuação remota real exige um executor no Node e uma ponte de streaming que
preserve as mesmas invariantes de aprovação e vinculação do harness local.

## Permissões

Cada computador fornece consentimento localmente. Habilitar o Gateway não autoriza outro
Node a ler seus metadados do Codex. O recurso do Node deve passar pelo pareamento normal
e pela aprovação da política de comandos.

A listagem da frota e a visualização de transcrições usam o escopo `operator.write` do Gateway
porque invocam Nodes pareados. A continuação e o arquivamento locais são
ações autenticadas do operador e continuam sujeitos às verificações de host e status.

O acesso autônomo de agentes e o acesso MCP independente são separados. Os contratos
fornecidos das ferramentas `codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send` e `codex_session_interrupt` continuam pertencendo
ao plugin `codex`. Com a supervisão habilitada, as leituras de transcrições brutas de `codex_threads`
e os campos de listagem derivados de transcrições também exigem
`supervision.allowRawTranscripts`; todo fork, renomeamento, arquivamento
ou desarquivamento de `codex_threads` exige `supervision.allowWriteControls`. Ambas as políticas ficam
desabilitadas por padrão.

## Compatibilidade

`openclaw doctor --fix` migra a configuração fornecida de `plugins.entries.codex-supervisor`,
incluindo endpoints e políticas de transcrição/gravação, além das referências de permissão/negação
do plugin, para
`plugins.entries.codex.config.supervision`. Valores canônicos explícitos no destino
prevalecem em conflitos. O código de runtime usa apenas o formato canônico do plugin
`codex` após a migração.

O plugin oficial mantém exatamente cinco ferramentas de compatibilidade do Supervisor:
`codex_endpoint_probe`, `codex_sessions_list`, `codex_session_read`,
`codex_session_send` e `codex_session_interrupt`. Por padrão, a lista de sessões inclui apenas
as carregadas; não há parâmetro `loaded_only`. `include_stored: true` adiciona
linhas não arquivadas do banco de dados de estado, limitadas por endpoint por `max_stored_sessions`
(padrão 200, intervalo aceito de 1 a 1,000); as linhas carregadas não são limitadas por essa
configuração. Os campos e as leituras derivados de transcrições continuam condicionados a
`allowRawTranscripts`; o envio e a interrupção continuam condicionados a `allowWriteControls`.

O envio de compatibilidade nunca inicia nem retoma uma thread ociosa. `mode: "start"` é
sempre recusado; `"auto"` e `"steer"` direcionam apenas um turno ativo legível.
Da mesma forma, a interrupção exige um turno ativo legível. A continuação ociosa é encaminhada
ao catálogo nativo do Codex para que o harness completo controle aprovações, ferramentas e a vinculação.
O adaptador MCP legado independente resolve essas mesmas ferramentas pelo plugin oficial
e é o único caminho que respeita as variáveis de ambiente legadas de política mantidas.

A interface do catálogo de julho, o método do Gateway, o recurso do Node e o registro na CLI
não haviam sido fornecidos com o antigo ID do plugin. Eles passam diretamente para a propriedade de `codex`
sem uma segunda fachada de runtime.

## Trabalho futuro

- executor de streaming no Node e ponte de eventos para continuação remota
- concessões explícitas de executor e proprietário de aprovação para transferência simultânea entre clientes
- arquivamento remoto após a existência de uma concessão de propriedade do executor ou isolamento equivalente
- interrupção e observação mais completa de sessões ativas
- transferência auditada entre Codex Desktop, CLI e OpenClaw

A navegação de itens arquivados não faz parte da barra lateral de supervisão planejada. As superfícies nativas do Codex
continuam sendo o caminho de recuperação para threads arquivadas.

## Testes de aceitação

- Habilitar a supervisão lista as sessões locais não arquivadas.
- Sessões arquivadas nunca aparecem na resposta do catálogo nem na interface.
- Hosts íntegros continuam visíveis quando outro host falha; um host indisponível
  não retorna linhas novas, em vez de inventar um status de sessão offline.
- Uma linha local armazenada ou ociosa cria um espelho de Chat com bloqueio de
  modelo/runtime exclusivo do Codex; o primeiro turno fixa um snapshot temporário e inicia a
  thread canônica do harness completo, e repetir **Continue** abre o Chat existente.
- O primeiro turno omite substituições de modelo/provedor no fork do snapshot e fixa
  o início canônico no par exato retornado pelo Codex, mesmo quando o Codex avisa
  que seu modelo atual difere do último modelo registrado da origem.
- Vinculações supervisionadas pendentes e confirmadas usam a conexão de supervisão para
  acesso à origem, criação da ramificação canônica e todos os turnos posteriores; sessões
  comuns do Codex continuam vinculadas ao agente.
- Retomadas posteriores omitem substituições de modelo/provedor do OpenClaw, preservam a
  seleção canônica persistida do Codex, aceitam alterações nativas separadas nessa thread
  e nunca substituem pelo modelo externo do OpenClaw nem pela cadeia de fallback.
- Desabilitar a supervisão ou perder o ciclo de vida da vinculação/conexão falha de modo fechado,
  em vez de mover o Chat para o harness comum do diretório inicial do agente.
- Um Chat supervisionado com modelo bloqueado não pode ser excluído enquanto protege a vinculação
  nativa.
- O Chat espelha no máximo 200 mensagens de usuário e assistente, 512 KiB no total e
  64 KiB por mensagem. Imagens tornam-se placeholders; raciocínio da origem, chamadas de ferramentas,
  resultados de ferramentas, payloads de imagens e caminhos locais não são clonados.
- O fluxo da ramificação nunca retoma a thread de origem.
- A origem original continua elegível para ambos os catálogos. A ramificação nativa
  canônica usa o tipo de origem `appServer` e não tem garantia de aparecer no
  Codex Desktop.
- Origens locais ativas não podem criar uma ramificação nem ser arquivadas; um Chat
  supervisionado existente ainda pode ser aberto.
- Linhas com atividade desconhecida podem criar ramificações sem confirmação; o arquivamento exige
  confirmação explícita de ausência de outro executor.
- Uma origem com uma ramificação supervisionada inicializando ou pendente não pode ser arquivada
  até que o primeiro turno do Chat materialize a ramificação canônica.
- Um proprietário conhecido de vinculação ativa para o destino exato ou qualquer descendente gerado
  não arquivado bloqueia o arquivamento; falhas na enumeração de descendentes falham de modo fechado, e
  a confirmação explícita continua responsável por clientes desconhecidos e pela condição de corrida
  entre o status e o arquivamento.
- O arquivamento local confirmado de uma linha armazenada ou ociosa remove a linha após o sucesso nativo.
- Linhas de Nodes pareados continuam visíveis sem **Continue** nem **Archive**.
- A listagem passiva nunca assina nem responde a aprovações de threads.
- A configuração legada do Supervisor é migrada para o formato canônico de configuração do Codex.
- Por padrão, a lista legada inclui apenas itens carregados, a enumeração de itens armazenados respeita
  seu limite por endpoint e o envio de compatibilidade nunca inicia nem retoma uma thread ociosa.
