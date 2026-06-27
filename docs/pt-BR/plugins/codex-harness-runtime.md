---
read_when:
    - Você precisa do contrato de suporte ao runtime do harness do Codex
    - Você está depurando ferramentas nativas do Codex, ganchos, Compaction ou envio de feedback
    - Você está alterando o comportamento de Plugin em turnos do harness do OpenClaw e do Codex
summary: Limites de runtime, hooks, ferramentas, permissões e diagnósticos para o harness do Codex
title: Ambiente de execução do sistema de testes do Codex
x-i18n:
    generated_at: "2026-06-27T17:45:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 84bca37f41003fd78a8e272cb8a54db05e780fab027af60d2ce058cc472ec001
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Esta página documenta o contrato de runtime para turnos do harness Codex. Para configuração e
roteamento, comece com [harness Codex](/pt-BR/plugins/codex-harness). Para campos de configuração,
consulte a [referência do harness Codex](/pt-BR/plugins/codex-harness-reference).

## Visão geral

O modo Codex não é o OpenClaw com uma chamada de modelo diferente por baixo. O Codex controla uma parte maior
do loop nativo do modelo, e o OpenClaw adapta suas superfícies de plugin, ferramenta, sessão e
diagnóstico em torno desse limite.

O OpenClaw ainda controla roteamento de canais, arquivos de sessão, entrega de mensagens visíveis,
ferramentas dinâmicas do OpenClaw, aprovações, entrega de mídia e um espelho de transcrição.
O Codex controla a thread nativa canônica, o loop nativo do modelo, a continuação nativa de ferramentas
e a Compaction nativa.

O roteamento de prompts segue o runtime selecionado, não apenas a string do provedor. Um
turno nativo do Codex recebe instruções de desenvolvedor do app-server do Codex, enquanto uma
rota explícita de compatibilidade do OpenClaw mantém o prompt de sistema normal do OpenClaw mesmo
quando usa autenticação ou transporte OpenAI com estilo Codex.

O Codex nativo mantém instruções base/de modelo e comportamento de documentos do projeto controlados pelo Codex
de acordo com a configuração ativa da thread do Codex. O OpenClaw inicia e retoma threads nativas do
Codex com a personalidade integrada do Codex desativada para que arquivos de personalidade do workspace
e a identidade do agente OpenClaw permaneçam autoritativos. Execuções leves do
OpenClaw ainda preservam sua supressão existente de documentos do projeto. As instruções de desenvolvedor do OpenClaw
cobrem preocupações de runtime do OpenClaw, como entrega ao canal de origem,
ferramentas dinâmicas do OpenClaw, delegação ACP, contexto do adaptador e os
arquivos de perfil do workspace do agente ativo. Catálogos de Skills do OpenClaw e ponteiros
`MEMORY.md` roteados por ferramenta são projetados como instruções de desenvolvedor de colaboração
com escopo de turno para o Codex nativo. Conteúdo ativo de `BOOTSTRAP.md` e injeção de fallback completa de
`MEMORY.md` ainda usam contexto de referência da entrada do turno.

## Vinculações de thread e alterações de modelo

Quando uma sessão do OpenClaw é anexada a uma thread existente do Codex, o próximo turno
envia novamente ao app-server o modelo OpenAI, a política de aprovação, o sandbox e o nível de serviço
selecionados no momento. Trocar de `openai/gpt-5.5` para
`openai/gpt-5.2` mantém a vinculação da thread, mas solicita que o Codex continue com o
modelo recém-selecionado.

## Respostas visíveis e heartbeats

Quando um turno de chat direto/de origem é executado pelo harness Codex, as respostas visíveis
usam por padrão a entrega automática da resposta final do assistente para superfícies internas de WebChat.
Isso mantém o Codex alinhado ao contrato de prompt do harness Pi: os agentes respondem
normalmente, e o OpenClaw publica o texto final na conversa de origem. Defina
`messages.visibleReplies: "message_tool"` quando um chat direto/de origem deve
intencionalmente manter o texto final do assistente privado, a menos que o agente chame
`message(action="send")`.

Turnos de heartbeat do Codex também recebem `heartbeat_respond` no catálogo pesquisável de ferramentas do OpenClaw
por padrão, para que o agente possa registrar se o despertar deve permanecer
silencioso ou notificar sem codificar esse fluxo de controle no texto final.

Orientação de iniciativa específica de Heartbeat é enviada como uma instrução de desenvolvedor em modo de colaboração do Codex
no próprio turno de heartbeat. Turnos comuns de chat restauram
o modo Default do Codex em vez de carregar a filosofia de heartbeat em seu prompt normal de
runtime. Quando existe um `HEARTBEAT.md` não vazio, as instruções de modo de colaboração de heartbeat
apontam o Codex para o arquivo em vez de inserir seu conteúdo inline.

## Limites de hooks

O harness Codex tem três camadas de hook:

| Camada                                | Proprietário             | Propósito                                                            |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Hooks de plugin do OpenClaw           | OpenClaw                 | Compatibilidade de produto/plugin entre harnesses OpenClaw e Codex.  |
| Middleware de extensão do app-server do Codex | Plugins incluídos do OpenClaw | Comportamento de adaptador por turno em torno de ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                    | Ciclo de vida de baixo nível do Codex e política nativa de ferramentas da configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` de projeto ou globais do Codex para rotear
comportamento de plugin do OpenClaw. Para a ponte nativa compatível de ferramentas e permissões,
o OpenClaw injeta configuração do Codex por thread para `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`.

Quando aprovações do app-server do Codex estão habilitadas, ou seja, `approvalPolicy` não é
`"never"`, a configuração padrão injetada de hook nativo omite `PermissionRequest` para que
o revisor do app-server do Codex e a ponte de aprovação do OpenClaw lidem com
escalonamentos reais após a revisão. Operadores podem adicionar explicitamente `permission_request` a
`nativeHookRelay.events` quando precisarem do relay de compatibilidade.

Outros hooks do Codex, como `SessionStart` e `UserPromptSubmit`, permanecem
controles no nível do Codex. Eles não são expostos como hooks de plugin do OpenClaw no contrato v1.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois que o Codex solicita a
chamada, então o OpenClaw dispara o comportamento de plugin e middleware que ele controla no
adaptador do harness. Para ferramentas nativas do Codex, o Codex controla o registro canônico da ferramenta.
O OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread nativa do Codex
a menos que o Codex exponha essa operação por meio do app-server ou de callbacks de hooks
nativos.

Eventos `PreToolUse` em modo de relatório do app-server do Codex adiam solicitações de aprovação de plugin
para a aprovação correspondente do app-server. Se um hook `before_tool_call` do OpenClaw
retornar `requireApproval` enquanto o payload nativo define o modo de aprovação de relatório
(`openclaw_approval_mode` é `"report"`), o relay de hook nativo registra o
requisito de aprovação do plugin e não retorna nenhuma decisão nativa. Quando o Codex envia a
solicitação de aprovação do app-server para o mesmo uso de ferramenta, o OpenClaw abre o prompt de
aprovação do plugin e mapeia a decisão de volta para o Codex. Eventos `PermissionRequest`
do Codex são um caminho de aprovação separado e ainda podem ser roteados por aprovações do OpenClaw
quando o runtime está configurado para essa ponte.

Notificações de itens do app-server do Codex também fornecem observações assíncronas de `after_tool_call`
para conclusões de ferramentas nativas que ainda não são cobertas pelo relay nativo
`PostToolUse`. Essas observações servem apenas para telemetria e compatibilidade de plugin;
elas não podem bloquear, atrasar ou modificar a chamada de ferramenta nativa.

Projeções de Compaction e do ciclo de vida do LLM vêm de notificações do app-server do Codex
e do estado do adaptador do OpenClaw, não de comandos de hooks nativos do Codex.
Os eventos `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` do OpenClaw são observações no nível do adaptador, não capturas byte a byte
da requisição interna do Codex ou de payloads de Compaction.

Notificações `hook/started` e `hook/completed` nativas do Codex no app-server são
projetadas como eventos de agente `codex_app_server.hook` para trajetória e depuração.
Elas não invocam hooks de plugin do OpenClaw.

## Contrato de suporte V1

Compatível no runtime Codex v1:

| Superfície                                    | Suporte                                                                          | Por quê                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop de modelo da OpenAI por meio do Codex    | Compatível                                                                       | O app-server do Codex controla o turno da OpenAI, a retomada de thread nativa e a continuação de ferramenta nativa.                                                                                                                                                                                                                                                                                                                                                                 |
| Roteamento e entrega de canais do OpenClaw    | Compatível                                                                       | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais permanecem fora do runtime do modelo.                                                                                                                                                                                                                                                                                                                                                                                 |
| Ferramentas dinâmicas do OpenClaw             | Compatível                                                                       | O Codex pede ao OpenClaw para executar essas ferramentas, então o OpenClaw permanece no caminho de execução.                                                                                                                                                                                                                                                                                                                                                                       |
| Plugins de prompt e contexto                  | Compatível                                                                       | O OpenClaw projeta prompt/contexto específicos do OpenClaw no turno do Codex, enquanto deixa prompts-base, de modelo e de documentação de projeto configurada pertencentes ao Codex na via nativa do Codex. O OpenClaw desabilita a personalidade integrada do Codex para threads nativas, para que os arquivos de personalidade do workspace do agente continuem sendo a autoridade. Instruções de desenvolvedor nativas do Codex aceitam apenas orientações de comando explicitamente escopadas para `codex_app_server`; dicas legadas de comando globais permanecem para superfícies de prompt que não são do Codex. |
| Ciclo de vida do mecanismo de contexto        | Compatível                                                                       | Montagem, ingestão e manutenção pós-turno rodam ao redor dos turnos do Codex. Mecanismos de contexto não substituem a Compaction nativa do Codex.                                                                                                                                                                                                                                                                                                                                  |
| Hooks de ferramentas dinâmicas                | Compatível                                                                       | `before_tool_call`, `after_tool_call` e middleware de resultado de ferramenta rodam ao redor de ferramentas dinâmicas pertencentes ao OpenClaw.                                                                                                                                                                                                                                                                                                                                     |
| Hooks de ciclo de vida                        | Compatível como observações do adaptador                                          | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` disparam com payloads honestos do modo Codex.                                                                                                                                                                                                                                                                                                                                                      |
| Portão de revisão da resposta final           | Compatível por meio de retransmissão de hook nativo                              | O `Stop` do Codex é retransmitido para `before_agent_finalize`; `revise` pede ao Codex mais uma passagem do modelo antes da finalização.                                                                                                                                                                                                                                                                                                                                            |
| Shell, patch e MCP nativos bloqueiam ou observam | Compatível por meio de retransmissão de hook nativo                           | `PreToolUse` e `PostToolUse` do Codex são retransmitidos para superfícies de ferramentas nativas confirmadas, incluindo payloads MCP no app-server do Codex `0.125.0` ou mais recente. Bloqueio é compatível; reescrita de argumentos não é.                                                                                                                                                                                                                                      |
| Política de permissões nativa                 | Compatível por meio de aprovações do app-server do Codex e retransmissão compatível de hook nativo | Solicitações de aprovação do app-server do Codex são roteadas pelo OpenClaw depois da revisão do Codex. A retransmissão do hook nativo `PermissionRequest` é opt-in para modos de aprovação nativos porque o Codex o emite antes da revisão do guardião.                                                                                                                                                                                                                            |
| Captura de trajetória do app-server           | Compatível                                                                       | O OpenClaw registra a solicitação enviada ao app-server e as notificações do app-server que recebe.                                                                                                                                                                                                                                                                                                                                                                                 |

Não compatível no runtime Codex v1:

| Superfície                                           | Limite da V1                                                                                                                                     | Caminho futuro                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Mutação de argumentos de ferramentas nativas         | Hooks nativos pré-ferramenta do Codex podem bloquear, mas o OpenClaw não reescreve argumentos de ferramentas nativas do Codex.                  | Requer suporte de hook/esquema do Codex para entrada de ferramenta substituta.            |
| Histórico editável de transcrição nativa do Codex    | O Codex controla o histórico canônico da thread nativa. O OpenClaw controla um espelho e pode projetar contexto futuro, mas não deve mutar internals sem suporte. | Adicionar APIs explícitas do app-server do Codex se cirurgia de thread nativa for necessária. |
| `tool_result_persist` para registros de ferramentas nativas do Codex | Esse hook transforma gravações de transcrição pertencentes ao OpenClaw, não registros de ferramentas nativas do Codex.                          | Poderia espelhar registros transformados, mas a reescrita canônica precisa de suporte do Codex. |
| Metadados ricos de Compaction nativa                 | O OpenClaw pode solicitar Compaction nativa, mas não recebe uma lista estável de mantidos/descartados, delta de tokens, resumo de conclusão ou payload de resumo. | Precisa de eventos de Compaction do Codex mais ricos.                                     |
| Intervenção de Compaction                            | O OpenClaw não permite que Plugins ou mecanismos de contexto vetem, reescrevam ou substituam a Compaction nativa do Codex.                      | Adicionar hooks pré/pós-Compaction do Codex se Plugins precisarem vetar ou reescrever a Compaction nativa. |
| Captura byte a byte da solicitação da API do modelo  | O OpenClaw pode capturar solicitações e notificações do app-server, mas o núcleo do Codex constrói internamente a solicitação final da API da OpenAI. | Precisa de um evento de rastreamento de solicitação de modelo do Codex ou API de depuração. |

## Permissões nativas e elicitações MCP

Para `PermissionRequest`, o OpenClaw retorna apenas decisões explícitas de permitir ou negar
quando a política decide. Um resultado sem decisão não é uma permissão. O Codex o trata como ausência de
decisão de hook e prossegue para seu próprio caminho de guardião ou aprovação do usuário.

Modos de aprovação do app-server do Codex omitem esse hook nativo por padrão. Esse comportamento
se aplica quando `permission_request` é explicitamente incluído em
`nativeHookRelay.events` ou quando um runtime de compatibilidade o instala.

Quando um operador escolhe `allow-always` para uma solicitação de permissão nativa do Codex,
o OpenClaw lembra aquela impressão digital exata de provedor/sessão/entrada de ferramenta/cwd por uma
janela de sessão limitada. A decisão lembrada é intencionalmente apenas de correspondência exata:
um comando, argumentos, payload de ferramenta ou cwd alterado cria uma nova
aprovação.

Elicitações de aprovação de ferramenta MCP do Codex são roteadas pelo fluxo de
aprovação de Plugin do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Prompts `request_user_input` do Codex são enviados de volta ao chat
de origem, e a próxima mensagem de acompanhamento enfileirada responde a essa solicitação do
servidor nativo em vez de ser direcionada como contexto extra. Outras solicitações de elicitação MCP
falham de forma fechada.

Para o fluxo geral de aprovação de Plugin que transporta esses prompts, veja
[Solicitações de permissão de Plugin](/pt-BR/plugins/plugin-permission-requests).

## Direcionamento de fila

O direcionamento de fila em execução ativa mapeia para `turn/steer` do app-server do Codex. Com o
padrão `messages.queue.mode: "steer"`, o OpenClaw agrupa mensagens de chat em modo de direcionamento
durante a janela de silêncio configurada e as envia como uma única solicitação `turn/steer`
na ordem de chegada.

A revisão do Codex e os turnos de Compaction manual podem rejeitar direcionamento no mesmo turno. Nesse
caso, o OpenClaw espera a execução ativa terminar antes de iniciar o prompt.
Use `/queue followup` ou `/queue collect` quando as mensagens devem entrar na fila por padrão
em vez de direcionar. Consulte [Fila de direcionamento](/pt-BR/concepts/queue-steering).

## Upload de feedback do Codex

Quando `/diagnostics [note]` é aprovado para uma sessão usando o harness nativo do Codex,
o OpenClaw também chama `feedback/upload` do app-server do Codex para threads
relevantes do Codex. O upload solicita que o app-server inclua logs de cada thread
listada e subthreads geradas do Codex quando disponíveis.

O upload passa pelo caminho normal de feedback do Codex para os servidores da OpenAI. Se o feedback do Codex
estiver desativado nesse app-server, o comando retorna o erro do app-server.
A resposta de diagnósticos concluída lista os canais, ids de sessão do OpenClaw,
ids de thread do Codex e comandos locais `codex resume <thread-id>` para as threads
que foram enviadas.

Se você negar ou ignorar a aprovação, o OpenClaw não imprime esses ids do Codex e
não envia feedback do Codex. O upload não substitui a exportação local de diagnósticos do Gateway.
Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) para o comportamento de
aprovação, privacidade, pacote local e bate-papo em grupo.

Use `/codex diagnostics [note]` somente quando você quiser especificamente o upload de
feedback do Codex para a thread atualmente anexada sem o pacote completo de diagnósticos do Gateway.

## Compaction e espelho de transcrição

Quando o modelo selecionado usa o harness do Codex, a Compaction de thread nativa pertence
ao app-server do Codex. O OpenClaw não executa Compaction de preflight para turnos do Codex,
não substitui a Compaction do Codex pela Compaction do mecanismo de contexto e não
recorre ao OpenClaw nem à sumarização pública da OpenAI quando a Compaction nativa do Codex
não pode ser iniciada. O OpenClaw mantém um espelho de transcrição para histórico de canais,
pesquisa, `/new`, `/reset` e troca futura de modelo ou harness.

Solicitações explícitas de Compaction, como `/compact` ou uma operação manual
compacta solicitada por Plugin, iniciam a Compaction nativa do Codex com `thread/compact/start`.
O OpenClaw retorna após iniciar essa operação nativa. Ele não espera a
conclusão, não impõe um timeout separado do OpenClaw, não reinicia o app-server
compartilhado do Codex nem registra a operação como uma Compaction concluída pelo OpenClaw.

Quando um mecanismo de contexto solicita projeção de bootstrap de thread do Codex, o OpenClaw
projeta nomes e ids de chamadas de ferramenta, formatos de entrada e conteúdo redigido de resultados
de ferramenta para a nova thread do Codex. Ele não copia valores brutos de argumentos de chamadas de ferramenta
para essa projeção.

O espelho inclui o prompt do usuário, o texto final do assistente e registros leves de
raciocínio ou plano do Codex quando o app-server os emite. Hoje, o OpenClaw apenas
registra sinais explícitos de início de Compaction nativa quando solicita Compaction. Ele
não expõe um resumo de Compaction legível por humanos nem uma lista auditável de
quais entradas o Codex manteve após a Compaction.

Como o Codex possui a thread nativa canônica, `tool_result_persist` atualmente não
reescreve registros de resultado de ferramenta nativos do Codex. Ele se aplica apenas quando
o OpenClaw está gravando um resultado de ferramenta de transcrição de sessão pertencente ao OpenClaw.

## Mídia e entrega

O OpenClaw continua responsável pela entrega de mídia e pela seleção do provedor de mídia. Imagem,
vídeo, música, PDF, TTS e compreensão de mídia usam configurações correspondentes de provedor/modelo,
como `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` e `messages.tts`.

Texto, imagens, vídeo, música, TTS, aprovações e saída de ferramenta de mensagens continuam
pelo caminho normal de entrega do OpenClaw. A geração de mídia não exige o runtime legado.
Quando o Codex emite um item nativo de geração de imagem com um `savedPath`, o OpenClaw
encaminha esse arquivo exato pelo caminho normal de mídia de resposta, mesmo que o turno do Codex
não tenha texto do assistente.

## Relacionados

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference)
- [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Exportação de trajetória](/pt-BR/tools/trajectory)
