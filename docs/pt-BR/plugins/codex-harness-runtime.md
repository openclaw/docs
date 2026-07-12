---
read_when:
    - Você precisa do contrato de suporte ao runtime do harness do Codex
    - Você está depurando ferramentas nativas do Codex, hooks, Compaction ou o envio de feedback
    - Você está alterando o comportamento do plugin em turnos do OpenClaw e do harness do Codex
summary: Limites de runtime, hooks, ferramentas, permissões e diagnósticos para o harness do Codex
title: Runtime do harness do Codex
x-i18n:
    generated_at: "2026-07-12T00:05:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: facd39e4fe86e43f5f08be49211cac6b27781f910f9a5d56ad4a687868259f13
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Contrato de runtime para turnos do harness do Codex. Para configuração e roteamento, consulte
[harness do Codex](/pt-BR/plugins/codex-harness). Para os campos de configuração, consulte
[referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

## Visão geral

O Codex controla o loop nativo do modelo, a retomada nativa de threads, a
continuação nativa de ferramentas e a Compaction nativa. O OpenClaw controla o
roteamento de canais, os arquivos de sessão, a entrega de mensagens visíveis,
as ferramentas dinâmicas do OpenClaw, as aprovações, a entrega de mídia e um
espelho da transcrição em torno desse limite.

O roteamento de prompts segue o runtime selecionado, não apenas a string do
provedor. Um turno nativo do Codex recebe as instruções de desenvolvedor do
app-server do Codex; uma rota explícita de compatibilidade do OpenClaw mantém o
prompt de sistema normal do OpenClaw, mesmo quando usa autenticação ou
transporte da OpenAI no estilo do Codex.

O OpenClaw inicia e retoma threads nativas do Codex com a personalidade
integrada do Codex desativada (`personality: "none"`), para que os arquivos de
personalidade do espaço de trabalho e a identidade do agente do OpenClaw
continuem sendo a referência principal. Fora isso, o Codex nativo mantém as
instruções básicas/do modelo controladas pelo Codex e o carregamento da
documentação do projeto. Execuções leves do OpenClaw (por exemplo, cron) ainda
suprimem o carregamento da documentação do projeto.

As instruções de desenvolvedor do OpenClaw abrangem aspectos do runtime do
OpenClaw: entrega pelo canal de origem, ferramentas dinâmicas do OpenClaw,
delegação ACP, contexto do adaptador e os arquivos de perfil ativos do espaço
de trabalho do agente. Catálogos de Skills e referências a `MEMORY.md`
roteadas por ferramentas são projetados como instruções de desenvolvedor de
colaboração com escopo limitado ao turno. Quando as ferramentas de memória
estão indisponíveis, o conteúdo ativo de `BOOTSTRAP.md` e o `MEMORY.md`
completo são usados como alternativa no contexto de entrada em texto simples
do turno.

A maioria das ferramentas dinâmicas do OpenClaw usa o namespace pesquisável
`openclaw`. As ferramentas marcadas com `catalogMode: "direct-only"` usam
`openclaw_direct`, que o Codex mantém diretamente visível para o modelo como
`DirectModelOnly`, em vez de expô-lo à execução aninhada no Modo de Código.

## Vínculos de threads e alterações de modelo

Quando uma sessão do OpenClaw é anexada a uma thread existente do Codex, o
turno seguinte reenvia ao app-server o modelo selecionado no momento, a
política de aprovação, o sandbox, o revisor de aprovações e a camada de
serviço. A troca de `openai/gpt-5.5` para `openai/gpt-5.2` mantém o vínculo da
thread, mas solicita que o Codex continue com o modelo recém-selecionado.

Vínculos supervisionados são a exceção. O seletor de modelos do OpenClaw
permanece bloqueado, e as retomadas omitem substituições de modelo e provedor
para que o Codex restaure o modelo e o provedor persistidos da thread
canônica. Um controle nativo separado do Codex pode alterar esse par
persistido, e o snapshot inicial pode produzir o aviso normal do Codex sobre
diferença de modelo; o modelo externo do OpenClaw e a cadeia de alternativas
nunca substituem nenhum dos dois.

## Supervisão e continuação segura

A supervisão do Codex é um recurso opcional do mesmo Plugin `codex`. Ela
descobre threads nativas por meio de uma conexão separada e projeta no catálogo
do Gateway somente sessões não arquivadas. Sem configurações de conexão
`appServer` explícitas, essa conexão usa stdio gerenciado no diretório pessoal
do usuário, enquanto o harness comum permanece no escopo do agente. A listagem
e as leituras de metadados são passivas: elas não retomam uma thread, não
inscrevem o OpenClaw em seus eventos em tempo real nem respondem às suas
aprovações.

Para uma sessão armazenada ou ociosa no computador do Gateway, **Continuar
como ramificação** cria um Chat normal, com o modelo bloqueado, e espelha um
histórico limitado de mensagens do usuário e do assistente até o último turno
terminal persistido da origem. O primeiro turno normal do Chat instala os
manipuladores de aprovação reais e usa uma bifurcação nativa temporária para
fixar o snapshot sem substituir o modelo ou o provedor. O Codex App Server usa
sua configuração nativa atual e retorna o par selecionado; ele emite o aviso
normal caso esse modelo seja diferente do último modelo registrado na origem.
Na mesma conexão de supervisão, o OpenClaw inicia a thread canônica do harness
do Codex cuja origem é `appServer`, usando seu diretório de trabalho e sua
política de runtime exatamente com o modelo e o provedor retornados para essa
inicialização, injeta o histórico visível limitado e arquiva a bifurcação
temporária. A origem nunca é retomada. A thread canônica tem toda a superfície
de ferramentas do harness do OpenClaw; o raciocínio, as chamadas de ferramentas
e os resultados de ferramentas da origem não são clonados nela. O escopo da
conexão privada persiste nos estados de vínculo pendente e confirmado, de modo
que todos os turnos posteriores permaneçam nessa conexão com a autenticação
nativa e a configuração do provedor. Supervisão desativada ou divergência do
vínculo ou da conexão causa falha fechada, em vez da troca para o harness
comum no diretório pessoal do agente.

A origem original da CLI ou do VS Code continua elegível para ambos os
catálogos. A ramificação canônica é uma thread nativa do Codex, mas seu tipo de
origem é `appServer`; clientes nativos podem filtrar esse tipo de origem,
portanto sua exibição no Codex Desktop não é garantida.

Origens ativas não podem iniciar uma nova ramificação nem ser arquivadas; um
Chat supervisionado existente ainda pode ser aberto. `notLoaded` significa que
a atividade é desconhecida, não que está ociosa; o OpenClaw permite arquivar
uma linha local `idle` ou `notLoaded` somente após confirmação explícita de que
não há outro executor e uma nova leitura local ao processo do status. O Codex
serializa mutações de threads dentro de um processo do App Server, mas não
fornece uma concessão exclusiva entre processos para o executor ou o
responsável pelas aprovações; portanto, essa leitura não pode provar que outro
processo não está usando a thread. O OpenClaw bloqueia um proprietário de
vínculo sabidamente ativo para o destino exato ou qualquer descendente gerado
não arquivado retornado pela consulta paginada de descendentes do Codex. Erros
de enumeração, ciclos e esgotamento do limite de segurança causam falha
fechada. O arquivamento nativo ainda pode disputar com um novo turno em outro
processo; portanto, a confirmação abrange clientes desconhecidos e o intervalo
entre a leitura do status e o arquivamento. Um Chat supervisionado com modelo
bloqueado não pode ser excluído enquanto protege o vínculo nativo.

Os catálogos de Nodes pareados permanecem restritos a metadados na versão
inicial. O limite atual de invocação do Node funciona com
solicitação/resposta e não pode transportar os eventos de turno de longa
duração, as solicitações de aprovação ou a saída em streaming exigidos por um
vínculo real do harness do Codex. Portanto, **Continuar** e **Arquivar**
remotos permanecem indisponíveis mesmo quando a linha está ociosa.

Consulte [supervisão do Codex](/pt-BR/plugins/codex-supervision) para ver a
configuração do operador e o comportamento visível da interface de controle.

## Respostas visíveis e heartbeats

Os turnos de chat direto/de origem pelo harness do Codex usam por padrão a
entrega automática da resposta final do assistente para superfícies internas
do WebChat, de acordo com o contrato do harness do Pi: o agente responde
normalmente, e o OpenClaw publica o texto final na conversa de origem. Defina
`messages.visibleReplies: "message_tool"` para manter o texto final do
assistente privado, a menos que o agente chame `message(action="send")`.

Os turnos de Heartbeat do Codex recebem `heartbeat_respond` por padrão no
catálogo pesquisável de ferramentas do OpenClaw, para que o agente possa
registrar se o despertar deve permanecer silencioso ou enviar uma notificação.
As orientações de iniciativa do Heartbeat são enviadas como uma instrução de
desenvolvedor do modo de colaboração do Codex com escopo limitado ao turno de
Heartbeat; os turnos comuns de chat permanecem no modo Padrão do Codex. Quando
`HEARTBEAT.md` não está vazio, as instruções de Heartbeat direcionam o Codex
ao arquivo em vez de incorporar seu conteúdo.

## Limites dos hooks

| Camada                                | Responsável              | Finalidade                                                                 |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------------- |
| Hooks de Plugin do OpenClaw           | OpenClaw                 | Compatibilidade do produto/Plugin entre os harnesses do OpenClaw e Codex.  |
| Middleware de extensão do app-server do Codex | Plugins integrados do OpenClaw | Comportamento do adaptador por turno em torno das ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                    | Ciclo de vida de baixo nível do Codex e política de ferramentas nativas da configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` de projeto ou globais do Codex para
rotear o comportamento de Plugins. Para a ponte de ferramentas e permissões
nativas, o OpenClaw injeta configurações do Codex por thread para
`PreToolUse`, `PostToolUse`, `PermissionRequest` e `Stop`.

Quando as aprovações do app-server do Codex estão habilitadas (`approvalPolicy`
não é `"never"`), a configuração padrão injetada dos hooks nativos omite
`PermissionRequest`, para que o revisor do app-server do Codex e a ponte de
aprovação do OpenClaw tratem escalonamentos reais após a revisão. Adicione
`permission_request` a `nativeHookRelay.events` para forçar o retransmissor de
compatibilidade mesmo assim. Outros hooks do Codex, como `SessionStart` e
`UserPromptSubmit`, permanecem controles no nível do Codex; eles não são
expostos como hooks de Plugin do OpenClaw no contrato v1.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois
que o Codex solicita a chamada, portanto o comportamento do Plugin e do
middleware é executado no adaptador do harness. Para ferramentas nativas do
Codex, o Codex controla o registro canônico da ferramenta; o OpenClaw pode
espelhar eventos selecionados, mas não pode reescrever a thread nativa, a menos
que o Codex exponha isso por meio do app-server ou de callbacks de hooks
nativos.

Os eventos `PreToolUse` do app-server do Codex no modo de relatório adiam a
aprovação do Plugin até a aprovação correspondente do app-server. Se um hook
`before_tool_call` do OpenClaw retornar `requireApproval` enquanto a carga
nativa define `openclaw_approval_mode: "report"`, o retransmissor de hooks
nativos registra o requisito de aprovação do Plugin e não retorna nenhuma
decisão nativa. Quando o Codex envia posteriormente a solicitação de aprovação
do app-server para o mesmo uso de ferramenta, o OpenClaw abre o prompt de
aprovação do Plugin e mapeia a decisão de volta para o Codex. Os eventos
`PermissionRequest` do Codex são um caminho de aprovação separado e ainda
podem ser roteados pelas aprovações do OpenClaw quando configurados para essa
ponte.

As notificações de itens do app-server do Codex também fornecem observações
assíncronas de `after_tool_call` para conclusões de ferramentas nativas ainda
não abrangidas pelo retransmissor nativo `PostToolUse`. Elas servem apenas para
telemetria/compatibilidade; não podem bloquear, atrasar nem modificar a chamada
da ferramenta nativa.

As projeções da Compaction e do ciclo de vida do LLM vêm das notificações do
app-server do Codex e do estado do adaptador do OpenClaw, não de comandos de
hooks nativos do Codex. `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` são observações no nível do adaptador, não capturas byte a byte da
solicitação interna ou das cargas de Compaction do Codex.

As notificações `hook/started` e `hook/completed` do app-server dos hooks
nativos do Codex são projetadas como eventos de agente
`codex_app_server.hook` para análise da trajetória e depuração. Elas não
invocam hooks de Plugin do OpenClaw.

## Contrato de suporte da v1

Compatível com o runtime v1 do Codex:

| Superfície                                    | Suporte                                                                          | Motivo                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop de modelo OpenAI por meio do Codex       | Compatível                                                                       | O app-server do Codex controla o turno da OpenAI, a retomada nativa de threads e a continuação nativa de ferramentas.                                                                                                                                                                                                                                                                                                                                                                   |
| Roteamento e entrega de canais do OpenClaw    | Compatível                                                                       | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais permanecem fora do runtime do modelo.                                                                                                                                                                                                                                                                                                                                                                                       |
| Ferramentas dinâmicas do OpenClaw             | Compatível                                                                       | O Codex solicita que o OpenClaw execute essas ferramentas, portanto o OpenClaw permanece no caminho de execução.                                                                                                                                                                                                                                                                                                                                                                        |
| Plugins de prompt e contexto                  | Compatível                                                                       | O OpenClaw projeta o prompt/contexto específico do OpenClaw no turno do Codex, enquanto mantém os prompts básicos, de modelo e de documentação de projeto configurados que pertencem ao Codex no fluxo nativo do Codex. O OpenClaw desativa a personalidade integrada do Codex para threads nativas, para que os arquivos de personalidade do espaço de trabalho do agente continuem sendo a fonte autoritativa. As instruções de desenvolvedor nativas do Codex aceitam somente orientações de comando explicitamente limitadas a `codex_app_server`; dicas globais legadas de comandos permanecem para superfícies de prompt não relacionadas ao Codex. |
| Ciclo de vida do mecanismo de contexto        | Compatível                                                                       | A montagem, a ingestão e a manutenção após o turno são executadas ao redor dos turnos do Codex. Os mecanismos de contexto não substituem a Compaction nativa do Codex.                                                                                                                                                                                                                                                                                                                   |
| Hooks de ferramentas dinâmicas                | Compatível                                                                       | `before_tool_call`, `after_tool_call` e o middleware de resultados de ferramentas são executados ao redor das ferramentas dinâmicas pertencentes ao OpenClaw.                                                                                                                                                                                                                                                                                                                           |
| Hooks de ciclo de vida                        | Compatível como observações do adaptador                                          | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` são acionados com payloads fiéis ao modo Codex.                                                                                                                                                                                                                                                                                                                                                         |
| Barreira de revisão da resposta final         | Compatível por meio do retransmissor de hooks nativos                             | O `Stop` do Codex é retransmitido para `before_agent_finalize`; `revise` solicita ao Codex mais uma passagem do modelo antes da finalização.                                                                                                                                                                                                                                                                                                                                            |
| Bloqueio ou observação nativa de shell, patch e MCP | Compatível por meio do retransmissor de hooks nativos                        | `PreToolUse` e `PostToolUse` do Codex são retransmitidos para superfícies de ferramentas nativas confirmadas, incluindo payloads MCP no app-server do Codex `0.142.0` ou mais recente. Há suporte a bloqueio, mas não à reescrita de argumentos.                                                                                                                                                                                                                                             |
| Política de permissões nativas                | Compatível por meio das aprovações do app-server do Codex e do retransmissor de hooks nativos de compatibilidade | As solicitações de aprovação do app-server do Codex são encaminhadas pelo OpenClaw após a revisão do Codex. O retransmissor do hook nativo `PermissionRequest` é opcional para modos de aprovação nativos, pois o Codex o emite antes da revisão do guardião.                                                                                                                                                                                                                              |
| Captura da trajetória do app-server           | Compatível                                                                       | O OpenClaw registra a solicitação enviada ao app-server e as notificações recebidas dele.                                                                                                                                                                                                                                                                                                                                                                                               |

Não compatível com o runtime v1 do Codex:

| Superfície                                          | Limite da V1                                                                                                                                          | Caminho futuro                                                                                              |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Alteração de argumentos de ferramentas nativas      | Os hooks nativos de pré-ferramenta do Codex podem bloquear, mas o OpenClaw não reescreve os argumentos de ferramentas nativas do Codex.               | Requer suporte de hooks/esquema do Codex para substituir a entrada da ferramenta.                           |
| Histórico editável de transcrição nativa do Codex   | O Codex controla o histórico canônico das threads nativas. O OpenClaw controla um espelho e pode projetar contexto futuro, mas não deve alterar componentes internos sem suporte. | Adicionar APIs explícitas ao app-server do Codex caso seja necessária a intervenção em threads nativas. |
| `tool_result_persist` para registros de ferramentas nativas do Codex | Esse hook transforma gravações de transcrição pertencentes ao OpenClaw, não registros de ferramentas nativas do Codex.                  | Seria possível espelhar registros transformados, mas a reescrita canônica requer suporte do Codex.          |
| Metadados avançados da Compaction nativa            | O OpenClaw pode solicitar a Compaction nativa, mas não recebe uma lista estável de itens mantidos/descartados, diferença de tokens, resumo de conclusão ou payload de resumo. | Requer eventos de Compaction mais detalhados do Codex.                                            |
| Intervenção na Compaction                            | O OpenClaw não permite que plugins ou mecanismos de contexto vetem, reescrevam ou substituam a Compaction nativa do Codex.                          | Adicionar hooks pré/pós-Compaction do Codex caso os plugins precisem vetar ou reescrever a Compaction nativa. |
| Captura byte a byte da solicitação à API do modelo   | O OpenClaw pode capturar solicitações e notificações do app-server, mas o núcleo do Codex cria internamente a solicitação final à API da OpenAI.      | Requer um evento de rastreamento de solicitação do modelo ou uma API de depuração do Codex.                 |

## Permissões nativas e solicitações de informações do MCP

Para `PermissionRequest`, o OpenClaw retorna apenas decisões explícitas de
permissão ou negação quando a política decide. Um resultado sem decisão não é
uma permissão: o Codex o trata como ausência de decisão do hook e prossegue
para seu próprio caminho de aprovação pelo guardião ou pelo usuário.

Por padrão, os modos de aprovação do app-server do Codex omitem esse hook
nativo. Isso se aplica, a menos que `permission_request` seja explicitamente
incluído em `nativeHookRelay.events` ou que um runtime de compatibilidade o
instale.

Quando um operador escolhe `allow-always` para uma solicitação de permissão
nativa do Codex, o OpenClaw memoriza a impressão digital exata da entrada do
provedor/sessão/ferramenta/cwd durante uma janela limitada da sessão. A decisão
memorizada exige, intencionalmente, uma correspondência exata: uma alteração no
comando, nos argumentos, no payload da ferramenta ou no cwd gera uma nova
aprovação.

As solicitações de aprovação de ferramentas MCP do Codex são encaminhadas
pelo fluxo de aprovação de plugins do OpenClaw quando o Codex define
`_meta.codex_approval_kind` como `"mcp_tool_call"`. Os prompts
`request_user_input` do Codex são enviados de volta ao chat de origem, e a
próxima mensagem de acompanhamento na fila responde a essa solicitação do
servidor nativo, em vez de ser direcionada como contexto adicional. Outras
solicitações de informações do MCP falham de modo seguro.

Para conhecer o fluxo geral de aprovação de plugins que transporta esses
prompts, consulte [Solicitações de permissão de plugins](/pt-BR/plugins/plugin-permission-requests).

## Direcionamento da fila

O direcionamento da fila de uma execução ativa é mapeado para `turn/steer` do
app-server do Codex. Com o valor padrão `messages.queue.mode: "steer"`, o
OpenClaw agrupa as mensagens de chat no modo steer durante a janela de
inatividade configurada e as envia como uma única solicitação `turn/steer`,
na ordem de chegada.

Turnos de revisão do Codex e de Compaction manual podem rejeitar o direcionamento no mesmo turno. Nesse
caso, o OpenClaw aguarda a execução ativa terminar antes de iniciar o
prompt. Use `/queue followup` ou `/queue collect` quando as mensagens devam entrar na fila
por padrão, em vez de direcionar. Consulte [Fila de direcionamento](/pt-BR/concepts/queue-steering).

## Envio de feedback do Codex

Quando `/diagnostics [note]` é aprovado para uma sessão no harness nativo do Codex,
o OpenClaw também chama `feedback/upload` do app-server do Codex para threads
relevantes do Codex, incluindo logs de cada thread listada e subthreads
do Codex geradas, quando disponíveis.

O envio passa pelo fluxo normal de feedback do Codex para os servidores da OpenAI. Se
o feedback do Codex estiver desativado nesse app-server, o comando retornará o
erro do app-server. A resposta de diagnóstico concluído lista os canais,
os IDs de sessão do OpenClaw, os IDs de thread do Codex e os comandos locais
`codex resume <thread-id>` das threads enviadas.

Se você negar ou ignorar a aprovação, o OpenClaw não exibirá esses IDs do Codex
nem enviará feedback do Codex. O envio não substitui a exportação local
de diagnósticos do Gateway. Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) para
informações sobre aprovação, privacidade, pacote local e comportamento em conversas em grupo.

Use `/codex diagnostics [note]` somente quando quiser enviar o feedback do Codex
para a thread atualmente anexada sem o pacote completo de diagnósticos do
Gateway.

## Compaction e espelho da transcrição

Quando o modelo selecionado usa o harness do Codex, a Compaction nativa da thread
pertence ao app-server do Codex. O OpenClaw não executa Compaction preliminar nos
turnos do Codex, não substitui a Compaction do Codex pela Compaction do mecanismo de contexto nem
recorre à sumarização do OpenClaw ou à sumarização pública da OpenAI quando a Compaction nativa não
pode ser iniciada. O OpenClaw mantém um espelho da transcrição para o histórico do canal, pesquisa,
`/new`, `/reset` e futuras trocas de modelo ou harness.

Solicitações explícitas de Compaction, como `/compact` ou uma operação manual
de Compaction solicitada por um Plugin, iniciam a Compaction nativa do Codex com `thread/compact/start`.
O OpenClaw mantém a solicitação e a concessão do cliente compartilhado abertas até que o Codex emita o
item de conclusão `contextCompaction` correspondente e, então, informa que o turno de Compaction
foi concluído. Se esse turno terminal exceder o tempo limite de Compaction
configurado, o OpenClaw solicitará uma interrupção nativa do turno. A concessão e a
barreira de Compaction por thread permanecem retidas até que o Codex informe o estado terminal ou confirme
o RPC de interrupção. Se o Codex não confirmar dentro do período de tolerância da
interrupção, o OpenClaw desativa a conexão antes de liberar a barreira. Conexões
remotas também desvinculam a associação da thread correspondente para que trabalhos posteriores não possam
se sobrepor a um turno remoto não confirmado. Outros turnos em uma conexão desativada falham
e podem tentar novamente em um cliente novo. O fechamento do cliente, o cancelamento da solicitação ou um
turno de Compaction com falha retorna uma operação com falha. A Compaction automática por pressão de contexto
é responsabilidade do Codex; o OpenClaw inicia a Compaction nativa somente para acionadores
solicitados manualmente.

Quando um mecanismo de contexto solicita a projeção de inicialização de thread do Codex, o OpenClaw
projeta nomes e IDs de chamadas de ferramentas, formatos de entrada e conteúdo
suprimido de resultados de ferramentas na nova thread do Codex. Ele não copia valores brutos
de argumentos de chamadas de ferramentas para essa projeção.

O espelho inclui o prompt do usuário, o texto final do assistente e registros leves
de raciocínio ou plano do Codex quando o app-server os emite. O OpenClaw
registra o início e o estado terminal da Compaction nativa, mas não
expõe um resumo de Compaction legível por humanos nem uma lista auditável das
entradas que o Codex manteve após a Compaction.

Como o Codex é responsável pela thread nativa canônica, `tool_result_persist` não
reescreve os registros de resultados de ferramentas nativos do Codex. Ele se aplica somente quando o OpenClaw
grava o resultado de uma ferramenta na transcrição de uma sessão pertencente ao OpenClaw.

## Mídia e entrega

O OpenClaw continua responsável pela entrega de mídia e pela seleção do provedor de mídia. Imagens,
vídeos, músicas, PDFs, TTS e compreensão de mídia usam configurações correspondentes
de provedor/modelo, como `agents.defaults.imageGenerationModel`,
`videoGenerationModel`, `pdfModel` e `messages.tts`.

Texto, imagens, vídeos, músicas, TTS, aprovações e saídas de ferramentas de mensagens continuam
pelo fluxo normal de entrega do OpenClaw; a geração de mídia não exige
o runtime legado. Quando o Codex emite um item nativo de geração de imagem com um
`savedPath`, o OpenClaw encaminha esse arquivo exato pelo fluxo normal de mídia
da resposta, mesmo que o turno do Codex não contenha texto do assistente.

## Relacionados

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference)
- [Supervisão do Codex](/pt-BR/plugins/codex-supervision)
- [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Exportação de trajetória](/pt-BR/tools/trajectory)
