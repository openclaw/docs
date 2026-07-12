---
read_when:
    - Você quer que as sessões do Codex Desktop ou da CLI apareçam no OpenClaw
    - Você precisa criar uma ramificação a partir de uma sessão local armazenada ou ociosa do Codex, ou arquivá-la
    - Você está expondo sessões do Codex e o histórico de transcrições de nodes pareados
sidebarTitle: Codex supervision
summary: Navegue por sessões nativas não arquivadas do Codex e transcrições paginadas nos nodes do OpenClaw
title: Supervisionar sessões do Codex
x-i18n:
    generated_at: "2026-07-12T15:26:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: e9378214df3f400b793b4a2c7bd91fb607a73910d4046f69d26debe308869df6
    source_path: plugins/codex-supervision.md
    workflow: 16
---

A supervisão do Codex é um recurso opcional do Plugin oficial `codex`. Ela
exibe sessões de origem não arquivadas do Codex Desktop e da CLI no computador
do Gateway e em computadores pareados que aceitaram participar, na barra lateral normal de sessões e no painel de Chat.

A versão inicial mantém deliberadamente a propriedade restrita:

- Uma sessão local armazenada ou ociosa pode criar um Chat do OpenClaw bloqueado
  para o modelo com base no histórico persistido e limitado de mensagens do usuário e do assistente. A primeira mensagem inicia uma
  bifurcação de snapshot nativa e, em seguida, inicia a thread completa do ambiente Codex exatamente
  com o modelo e o provedor selecionados pelo Codex App Server para essa bifurcação. Os turnos
  posteriores restauram o par persistido da thread nativa canônica, enquanto a
  vinculação supervisionada impede que o OpenClaw substitua o runtime,
  o modelo ou o fallback. Um controle nativo separado do Codex ainda pode alterar esse
  par persistido. Uma ramificação já criada abre seu Chat existente.
- Uma sessão armazenada descoberta a partir de outro processo do Codex tem atividade
  em tempo real desconhecida. Ela pode ser bifurcada ou arquivada somente depois que o operador
  confirmar que nenhum outro cliente Codex a está usando.
- Uma origem ativa permanece visível, mas não pode criar uma ramificação nem ser arquivada até
  que seu turno atual termine. Se ela já tiver um Chat supervisionado, **Abrir Chat**
  continuará disponível.
- Uma sessão em um Node pareado expõe sua transcrição persistida por meio de leituras limitadas
  e paginadas por cursor do App Server. A continuação remota
  requer uma futura ponte de streaming do Node; o arquivamento remoto também requer
  uma concessão de propriedade do executor ou um mecanismo de isolamento equivalente.
- Sessões arquivadas não são listadas. Uma sessão local armazenada ou ociosa pode ser
  arquivada somente depois que o operador confirmar que nenhum outro cliente Codex a está usando.

## Antes de começar

- Instale o Plugin oficial `@openclaw/codex` no Gateway. O aplicativo OpenClaw para
  macOS pode instalá-lo quando você ativa os recursos do Codex; instalações pela CLI podem
  executar `openclaw plugins install @openclaw/codex`.
- Instale e entre no Codex Desktop ou na CLI do Codex em cada computador cujas
  sessões você deseja listar.
- Pareie computadores remotos como Nodes do OpenClaw. Cada computador deve aceitar localmente;
  ativar a supervisão apenas no Gateway não autoriza outro Node.
- Use um Gateway controlado pelo proprietário. Títulos de sessões, diretórios de trabalho e ramificações
  Git podem revelar informações confidenciais do projeto.

## Ativar a supervisão

O `openclaw onboard` guiado e a configuração de primeira execução no macOS tentam instalar e
ativar a supervisão do Codex após detectar uma instalação nativa do Codex e
ativar com sucesso o backend de inferência selecionado. O Codex não precisa ser
o backend principal. A supervisão fica disponível quando essa ativação oportunista
do Plugin é bem-sucedida. A disponibilidade do App Server é verificada quando
a supervisão se conecta pela primeira vez. Uma desativação explícita do Plugin Codex ou um bloqueio por política
impede a ativação oportunista, e uma configuração explícita existente
`supervision.enabled: false` desativa as ferramentas de supervisão voltadas para agentes; o
catálogo do operador permanece registrado sempre que o Plugin Codex está ativo.
Instalações existentes podem ativar manualmente o mesmo recurso:

Ative o plugin `codex` e seu recurso de supervisão em `openclaw.json`:

```json5
{
  plugins: {
    entries: {
      codex: {
        enabled: true,
        config: {
          supervision: {
            enabled: true,
          },
        },
      },
    },
  },
}
```

Se `plugins.allow` estiver presente, inclua `codex`. Reinicie o Gateway após
alterar a ativação do plugin.

Sem configurações explícitas de conexão em `appServer`, a supervisão usa uma
conexão de supervisão stdio gerenciada separada com o diretório inicial nativo
do usuário do Codex. O harness comum do Codex permanece, por padrão, restrito
ao agente. Isso torna as sessões nativas visíveis em ambos os aplicativos sem
fazer com que as interações comuns do OpenClaw compartilhem o estado nativo do
Codex. Defina `appServer.homeScope: "user"` explicitamente se o harness também
dever compartilhar esse estado. A supervisão respeita configurações explícitas
de conexão em `appServer` em vez de substituí-las pelo padrão local do diretório
inicial do usuário.

Um Chat adotado do grupo **Codex** na barra lateral não é uma sessão comum do
harness. Sua vinculação privada de supervisão usa a conexão de supervisão para
leituras do código-fonte, criação do branch canônico, injeção de histórico e
todas as interações posteriores. Com a conexão local padrão, isso preserva o
diretório inicial nativo do usuário do Codex, a autenticação e a configuração
do provedor sem alterar o padrão das outras sessões.

Na conexão de supervisão local padrão, o armazenamento é compartilhado com
clientes nativos do Codex. O OpenClaw não presume que outro cliente compartilhe
o mesmo processo ativo do App Server, e a propriedade do status nativo é local
ao processo. Portanto, ele trata uma thread que seu App Server de supervisão
relata como `notLoaded` como **Armazenada / atividade desconhecida**, e não como
ociosa.

Aplique a mesma ativação opcional em cada host de nó sem interface gráfica cujas
sessões devam aparecer. O aplicativo nativo do OpenClaw para macOS lê a mesma
configuração local ao anunciar seu catálogo do Codex ao Gateway emparelhado.
Esse catálogo do Mac nativo emparelhado aceita somente o padrão ou
`appServer.transport: "stdio"` explícito, com `appServer.homeScope: "user"` não
definido ou explícito. `command`, `args` e `clearEnv` são respeitados nesse
processo stdio. Se a configuração do Mac selecionar `"unix"`, `"websocket"` ou
`homeScope: "agent"`, o aplicativo não anunciará o recurso nem o comando do
catálogo, e uma invocação direta obsoleta falhará em vez de expor o diretório
inicial do usuário do Codex ou iniciar outro App Server stdio local.

Um comando de nó recém-anunciado altera a superfície de comandos aprovados do
nó. Aprove a atualização no host do Gateway:

```bash
openclaw nodes pending
openclaw nodes approve <requestId>
```

As sessões não arquivadas do Codex também aparecem na barra lateral principal da interface de controle, agrupadas
por host. Selecione uma para ler sua transcrição persistida. O visualizador usa a API
`thread/turns/list` mais recente do Codex com `itemsView: "full"` e carrega no máximo 20 turnos
por solicitação; **Carregar itens mais antigos da transcrição** segue o cursor opaco do App Server da página mais recente.
As páginas carregadas são renderizadas em ordem cronológica. O visualizador nunca carrega um histórico
`thread/read` ilimitado. Uma página acima do limite de segurança de transporte de 20 MiB
falha de forma segura em vez de colocar em risco a conexão com o Node ou o Gateway.

Abra o grupo **Codex** na barra lateral normal de sessões. Ele lista as mesmas sessões
agrupadas por host. **Carregar mais sessões** acrescenta a próxima página de cada host que
tenha linhas mais antigas, e essas linhas acrescentadas permanecem durante a atualização periódica da barra lateral.
Cada página de pesquisa retornada examina um número limitado de páginas nativas por host, em vez
de enviar a consulta ao App Server, porque a pesquisa nativa também pode encontrar correspondências
nas prévias das transcrições.

A disponibilidade do host e o status da thread são separados. **Offline** ou **Unavailable**
descreve uma atualização do host; um host indisponível não retorna novas linhas de sessão e
não altera o status nativo de uma thread para `offline`. As linhas de sessão usam status do Codex,
como `idle`, `active`, `notLoaded` ou erro. Uma falha em um host não
oculta os resultados de hosts íntegros.

## Usar a CLI do operador

A CLI do terminal expõe o mesmo catálogo não arquivado e as ações locais do Gateway
para criar ramificações e arquivar:

```bash
openclaw codex sessions [--search <text>] [--host <id>] [--limit <count>] [--cursor <cursor>] [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex continue <thread-id> [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
openclaw codex archive <thread-id> --confirm-no-other-runner [--json] [--url <url>] [--token <token>] [--timeout <ms>] [--expect-final]
```

Opções de `openclaw codex sessions`:

- `--search <text>` pesquisa títulos de sessões sem diferenciar maiúsculas de minúsculas.
- `--host <id>` limita a resposta a um único host estável do catálogo, como
  `gateway:local` ou `node:<node-id>`.
- `--limit <count>` define de 1 a 100 linhas por host; o padrão é 50.
- `--cursor <cursor>` continua uma página de um host e, portanto, exige `--host`.
- `--json` imprime a resposta estruturada do Gateway.

Todos os três comandos herdam `--url`, `--token` e `--timeout <ms>` do cliente
do Gateway. A listagem de sessões usa, por padrão, 75.000 ms para permitir a
conclusão de catálogos de Nodes pareados ainda não inicializados; os tempos padrão para continuar
e arquivar são de 30.000 ms. Eles também expõem a opção compartilhada
`--expect-final`, que não altera essas RPCs de supervisão unárias.
Cada comando exige o escopo `operator.write` do Gateway.
A saída padrão de `-h, --help` está disponível em cada subcomando.
Não há opção archived nem include-archived. `sessions` pode listar hosts
pareados, mas `continue` e `archive` sempre têm `gateway:local` como destino; as
linhas pareadas servem apenas para listagem. O arquivamento sempre exige `--confirm-no-other-runner`.

Esses comandos de shell são distintos dos comandos de runtime `/codex` usados no chat.
`/codex threads [filter]` lista as threads do App Server disponíveis para a conexão da
conversa atual. `/codex sessions --host <node>` lista arquivos de sessão retomáveis da
CLI do Codex em um Node, não o catálogo da frota de supervisão. `/codex
resume` e `/codex bind` vinculam a conversa atual em vez de criar uma
ramificação supervisionada segura, e um Chat supervisionado com modelo bloqueado rejeita
essas mutações de vinculação. Não há comando de runtime `/codex continue` nem `/codex archive`.

## Criar uma ramificação a partir de uma sessão local

Escolha **Continuar como ramificação** em uma linha armazenada ou ociosa no computador do Gateway.
O OpenClaw cria uma entrada normal de Chat, replica o histórico limitado do usuário e do assistente
até o último turno terminal persistido da origem (concluído, interrompido ou
com falha), registra uma ramificação pendente do harness e abre o Chat. O seletor
genérico de modelo fica bloqueado, mas nenhum modelo ou provedor específico foi selecionado ainda. A
origem não é retomada, e a thread canônica do harness ainda não é iniciada.
Repetir a ação abre o Chat existente em vez de criar outra
ramificação.

A réplica mantém a parte final visível mais recente que se enquadra nos três limites: no máximo 200
mensagens do usuário ou do assistente, 512 KiB de texto UTF-8 no total e 64 KiB por
mensagem. Mensagens grandes demais são truncadas com um marcador, e mensagens mais antigas são
omitidas quando um limite é atingido. Uma entrada de imagem ou imagem local se torna o espaço reservado literal
`[Image attachment]`; os dados da imagem e os caminhos locais não são copiados.

Envie a primeira mensagem normal de Chat para iniciar o trabalho. O harness do Codex instala os
manipuladores reais de aprovação, solicitação, eventos e entrega. Ele usa uma ramificação
nativa temporária na conexão de supervisão para fixar o snapshot da origem sem
fornecer uma substituição de modelo ou provedor. O Codex App Server seleciona ambos em sua
configuração nativa atual e retorna a seleção real. Nessa mesma
conexão, o OpenClaw inicia a thread canônica completa do harness com origem `appServer`
sob seu cwd e sua política de runtime, usando exatamente o par retornado, injeta o
histórico visível limitado e arquiva a ramificação temporária. A thread canônica
tem toda a superfície de ferramentas do harness do OpenClaw. Esta é uma ramificação do histórico visível, não
um clone completo da execução nativa: o raciocínio da origem, as chamadas de ferramentas e os resultados das ferramentas são
omitidos. Este turno e todos os posteriores permanecem na conexão supervisionada do Codex,
em vez de usar outro runtime de modelo do OpenClaw ou o harness comum do diretório inicial do agente.

A seleção retornada não comprova o modelo histórico da origem. Se a
configuração nativa atual for diferente do modelo registrado no último turno da origem,
o Codex emitirá seu aviso normal de diferença de modelo. O OpenClaw usa o
par retornado para iniciar a thread canônica. O Codex persiste o modelo e o provedor
nativos dessa thread canônica, e retomadas posteriores os preservam porque
o OpenClaw omite substituições de modelo e provedor. Se a thread canônica for alterada
por meio de um controle nativo separado do Codex, o OpenClaw aceitará a seleção
persistida pelo Codex. O OpenClaw nunca substitui isso por seu modelo externo nem por sua cadeia de fallback.

O Chat supervisionado com modelo bloqueado não pode ser excluído, trocar de modelo, usar `/new`
ou `/reset`, invocar a ação de redefinição de sessão do Gateway nem usar a ação genérica
**Bifurcar sessão**. As operações de alteração `/codex model <model>`, `/codex
bind`, `/codex resume` (incluindo uma sessão de Node com `--bind here`) e
`/codex detach` ou `/codex unbind` também são rejeitadas porque substituiriam
ou removeriam a vinculação nativa bloqueada. A consulta `/codex model` e `/codex fast`,
`/codex permissions` e `/codex threads` continuam disponíveis. Inicie outra
sessão comum quando quiser um modelo diferente ou uma conversa nova.

Mantenha a supervisão habilitada para este Chat. Se a supervisão for desabilitada ou se sua
vinculação de conexão armazenada ficar indisponível ou inconsistente, o turno falhará
de forma fechada, em vez de passar para uma sessão comum no diretório inicial do agente.

Desabilitar ou desinstalar o plugin `codex` não libera essa propriedade nem
torna o Chat elegível para outro modelo. O Chat bloqueado permanece preservado, mas
indisponível; reinstale ou reabilite o mesmo plugin e reinicie o Gateway para
retomá-lo. Esse comportamento deliberado de falha fechada impede que a limpeza de retenção ou uma
indisponibilidade temporária do plugin deixe silenciosamente a vinculação nativa órfã.

A ferramenta de agente `codex_threads` segue o mesmo limite. Ela não pode anexar uma
bifurcação diferente nem arquivar a conversa nativa vinculada ao Chat. A listagem e a leitura
somente de metadados continuam disponíveis. Leituras brutas de transcrições exigem `allowRawTranscripts`.
Quando o acesso bruto está desabilitado, `codex_threads` também rejeita a pesquisa na lista porque
a pesquisa nativa inclui prévias de transcrições; a interface de controle e a CLI do operador
ainda fornecem pesquisa limitada somente por título. Renomear, desarquivar, criar uma bifurcação
desanexada e arquivar uma conversa não relacionada e sem proprietário exigem
`allowWriteControls`. Nenhuma das opções ignora a vinculação bloqueada.

O OpenClaw não assina nem responde a solicitações de aprovação enquanto apenas lista
a conversa de origem ou exibe o Chat pendente. Iniciar uma conversa canônica distinta
do harness no primeiro turno permite que outro processo do Codex continue sendo proprietário da
origem sem criar gravadores de execução concorrentes.

A origem original da CLI ou do VS Code permanece visível para clientes nativos e para o
catálogo do OpenClaw. A ramificação canônica é armazenada como uma conversa nativa do Codex, mas
seu tipo de origem é `appServer`; o Codex Desktop ou outro cliente nativo pode filtrar
esse tipo de origem, portanto não há garantia de que a própria ramificação apareça em todas as
visualizações nativas do histórico.

Uma linha ativa relatada pelo App Server do OpenClaw não pode iniciar uma nova ramificação. Aguarde
o término do turno atual e atualize o catálogo. O Codex App Server
serializa alterações em um único processo, mas não fornece um executor exclusivo
entre processos nem uma concessão de propriedade de aprovação.

Para uma linha **Armazenada / atividade desconhecida**, o espelho do Chat e a fixação do snapshot
do primeiro turno usam o estado do Codex até o último turno terminal persistido. A conversa
de origem não é retomada, interrompida nem arquivada. Se outro processo tiver um
turno em andamento, o trabalho em execução mais recente poderá não estar presente na ramificação.

## Arquivar uma sessão local

Escolha **Arquivar** em uma linha armazenada ou ociosa local do Gateway e confirme que nenhum
outro cliente do Codex ou executor do OpenClaw está usando essa conversa ou seus descendentes
gerados. O OpenClaw relê o status local do processo, prossegue apenas para
`idle` ou `notLoaded`, chama a operação nativa de arquivamento do Codex e remove a
sessão da lista de itens não arquivados. O Codex nativo também tenta arquivar os
descendentes gerados pela conversa.

O arquivamento fica indisponível quando a nova leitura informa que a sessão está ativa ou em
estado de erro, quando ela pertence a um Node emparelhado ou enquanto um Chat supervisionado
recém-criado ainda tem uma ramificação pendente dessa origem. Envie a primeira mensagem do Chat
para materializar sua ramificação canônica antes de arquivar a origem.
O arquivamento também é bloqueado quando o OpenClaw sabe que uma vinculação ativa é proprietária da
conversa de destino exata ou de qualquer descendente gerado não arquivado. O OpenClaw percorre a
consulta experimental de descendentes do Codex em todas as páginas; uma resposta inválida,
falha de solicitação, cursor ou conversa repetidos ou esgotamento do limite de segurança rejeitam
o arquivamento.

As solicitações de leitura, enumeração de descendentes e arquivamento não constituem uma única operação
condicional, portanto um turno ainda pode começar entre elas. O status do App Server também
não é compartilhado entre processos independentes. Portanto, a confirmação é o
limite de segurança para clientes desconhecidos e para essa condição de corrida: encerre ou verifique
de outra forma todos os outros clientes antes de confirmar. Restaure uma conversa arquivada com o Codex
Desktop, a CLI do Codex ou um fluxo nativo de gerenciamento de conversas autorizado pelo proprietário;
ela reaparecerá após ser desarquivada.

```bash
codex unarchive <thread-id>
```

## Entender os limites de Nodes emparelhados

Nodes emparelhados expõem os comandos versionados somente para leitura
`codex.appServer.threads.list.v1` e
`codex.appServer.thread.turns.list.v1`. O Gateway recebe metadados normalizados
e páginas limitadas de transcrições explicitamente solicitadas, nunca endpoints brutos do App Server.
O transporte atual de invocação do Node funciona apenas por solicitação/resposta, portanto não pode
transportar o ciclo de vida de longa duração de eventos, aprovações e streaming exigido pelo
harness do Codex.

Por esse motivo, as linhas remotas permanecem visíveis, mas não oferecem **Continuar** nem
**Arquivar**, mesmo quando a conversa remota está ociosa. Use o Codex nesse computador
até que exista uma ponte de executor de streaming no Node para continuação e um limite seguro
de propriedade do executor para arquivamento.

## Metadados e permissões

As linhas do catálogo podem incluir:

- identificadores de conversa e sessão
- título e diretório de trabalho
- status atual e sinalizadores de espera ativa
- carimbos de data e hora de criação, atualização e atividade
- origem, provedor do modelo, versão da CLI do Codex e ramificação do Git

A projeção do catálogo exclui prévias de transcrições, turnos, caminhos de execução,
o caminho do diretório inicial do Codex, remotos do Git, SHAs de commits e erros brutos do App Server. O acesso
ao catálogo e as leituras de transcrições pela interface de controle exigem o escopo `operator.write` do Gateway
porque a agregação da frota usa o caminho padrão `node.invoke`, embora
ambos os comandos do Node sejam somente para leitura.

`supervision.allowRawTranscripts` e `supervision.allowWriteControls` controlam
as ferramentas autônomas do agente e as ferramentas MCP independentes. Ambas têm `false` como padrão. Com
a supervisão habilitada, `codex_threads` remove prévias de transcrições e turnos dos
resultados de listagem e leitura somente de metadados, a menos que transcrições brutas sejam permitidas; uma
leitura que inclua turnos falha de forma fechada. Toda bifurcação, renomeação, operação de arquivamento e
desarquivamento exige controles de gravação. Essas opções não limitam a visualização autenticada
de transcrições na interface de controle nem ignoram verificações de vinculação, host, status ou confirmação.

### Ferramentas de compatibilidade

O plugin oficial `codex` mantém os cinco nomes de ferramentas do Supervisor já lançados para
agentes existentes e clientes MCP independentes:

- `codex_endpoint_probe`
- `codex_sessions_list`
- `codex_session_read`
- `codex_session_send`
- `codex_session_interrupt`

Por padrão, `codex_sessions_list` inclui apenas itens carregados; não existe o parâmetro `loaded_only`.
Defina `include_stored: true` para também ler linhas armazenadas não arquivadas do
banco de dados de estado do Codex. O limite opcional `max_stored_sessions` tem 200 como padrão
e aceita de 1 a 1,000 linhas por endpoint. Ele não limita linhas carregadas.
Sem permissão para transcrições brutas, os resultados da lista omitem nomes derivados de transcrições,
prévias e erros detalhados de endpoints.
`codex_session_read` exige `allowRawTranscripts`; `include_turns: true`
também solicita turnos ao Codex.

`codex_session_send` e `codex_session_interrupt` exigem
`allowWriteControls`. O envio aceita `mode: "auto" | "start" | "steer"`, mas
`"start"` é sempre recusado, e tanto `"auto"` quanto `"steer"` só podem orientar um
turno ativo legível. Uma conversa ociosa é recusada com orientação para usar **Sessões do Codex**,
em que o harness completo instala manipuladores de aprovação e ferramentas antes da
continuação. Da mesma forma, a interrupção exige um turno ativo legível. Essas ferramentas
não retomam nem iniciam uma conversa de origem ociosa.

`openclaw doctor --fix` move uma entrada aposentada `codex-supervisor`, seus campos de endpoint
e permissão e as referências de política de permissão/negação de plugins para o plugin oficial
`codex` sem sobrescrever configurações canônicas explícitas. O adaptador MCP independente
de compatibilidade continua carregando as mesmas cinco ferramentas desse
plugin; variáveis de ambiente de política legadas se aplicam apenas dentro desse adaptador
confiável.

Para todos os campos de configuração da supervisão, consulte
[Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference#supervision).

## Solução de problemas

**Nenhuma sessão aparece:** verifique se `@openclaw/codex` está instalado, se o
plugin e `supervision.enabled` estão definidos como true, se a lista de permissões atual de plugins permite
`codex` e se as sessões não estão arquivadas. Reinicie o Gateway ou o Node após
alterar a ativação.

**Continuar está desabilitado:** uma linha não mapeada está ativa, pertence a um Node emparelhado,
seu host está offline ou outra ação está pendente. Linhas armazenadas e ociosas locais
do Gateway oferecem **Continuar como ramificação** em vez de assumir de forma insegura a conversa exata. Uma linha
que já tem um Chat supervisionado oferece **Abrir Chat**.

**Arquivar está desabilitado:** o arquivamento está disponível para linhas armazenadas/com atividade desconhecida e
linhas ociosas locais do Gateway após a confirmação de que não há outro executor. Linhas ativas, com erro,
offline, de Node emparelhado, com ramificação pendente e com proprietário conhecido da vinculação exata permanecem
somente para leitura quanto ao arquivamento.

**Uma sessão arquivada desapareceu:** isso é esperado. A página de supervisão não tem
uma visualização de itens arquivados. Execute `codex unarchive <thread-id>` ou use o Codex Desktop para
exibi-la novamente.

**A configuração antiga `codex-supervisor` permanece:** execute `openclaw doctor --fix`. O Doctor
move a entrada do plugin aposentado e as referências relacionadas de política de plugins para
`plugins.entries.codex.config.supervision` sem sobrescrever configurações explícitas do Codex.

## Relacionados

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference)
- [Runtime do harness do Codex](/pt-BR/plugins/codex-harness-runtime)
- [Arquitetura de supervisão do Codex](/pt-BR/specs/codex-supervision)
- [Nodes](/pt-BR/nodes)
- [Segurança do Gateway](/pt-BR/gateway/security)
