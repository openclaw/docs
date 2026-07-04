---
read_when:
    - Você precisa do contrato de suporte ao tempo de execução do harness Codex
    - Você está depurando ferramentas nativas do Codex, hooks, compaction ou upload de feedback
    - Você está alterando o comportamento do Plugin em turnos do harness do OpenClaw e do Codex
summary: Limites de tempo de execução, hooks, ferramentas, permissões e diagnósticos para o harness do Codex
title: Tempo de execução do ambiente de testes do Codex
x-i18n:
    generated_at: "2026-07-04T20:28:53Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: c681de59a53b85402e95b1d3f2aa853e78989185ad05cf1f0497814be5959232
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Esta página documenta o contrato de runtime para turnos do harness Codex. Para configuração e
roteamento, comece com [harness Codex](/pt-BR/plugins/codex-harness). Para campos de configuração,
consulte [referência do harness Codex](/pt-BR/plugins/codex-harness-reference).

## Visão geral

O modo Codex não é o OpenClaw com uma chamada de modelo diferente por baixo. O Codex é responsável por mais partes
do loop nativo do modelo, e o OpenClaw adapta suas superfícies de Plugin, ferramenta, sessão e
diagnóstico em torno desse limite.

O OpenClaw ainda é responsável pelo roteamento de canais, arquivos de sessão, entrega de mensagens visíveis,
ferramentas dinâmicas do OpenClaw, aprovações, entrega de mídia e um espelho de transcrição.
O Codex é responsável pela thread nativa canônica, pelo loop nativo do modelo, pela continuação de ferramentas nativas
e pela Compaction nativa.

O roteamento de prompts segue o runtime selecionado, não apenas a string do provedor. Um
turno nativo do Codex recebe instruções de desenvolvedor do app-server do Codex, enquanto uma
rota explícita de compatibilidade do OpenClaw mantém o prompt de sistema normal do OpenClaw mesmo
quando usa autenticação ou transporte OpenAI no estilo Codex.

O Codex nativo mantém instruções base/de modelo e comportamento de documentos do projeto de propriedade do Codex
conforme a configuração ativa da thread do Codex. O OpenClaw inicia e retoma threads nativas do
Codex com a personalidade integrada do Codex desabilitada para que os arquivos de
personalidade do workspace e a identidade do agente OpenClaw permaneçam autoritativos. Execuções leves do
OpenClaw ainda preservam a supressão existente de documentos do projeto. Instruções de desenvolvedor do OpenClaw
cobrem preocupações de runtime do OpenClaw, como entrega de canal de origem,
ferramentas dinâmicas do OpenClaw, delegação ACP, contexto do adaptador e os
arquivos de perfil do workspace do agente ativo. Catálogos de Skills do OpenClaw e ponteiros
`MEMORY.md` roteados por ferramenta são projetados como instruções de desenvolvedor de colaboração com escopo de turno
para o Codex nativo. Conteúdo ativo de `BOOTSTRAP.md` e injeção de fallback completa de
`MEMORY.md` ainda usam contexto de referência de entrada do turno.

## Vínculos de thread e alterações de modelo

Quando uma sessão do OpenClaw é anexada a uma thread existente do Codex, o próximo turno
envia novamente ao app-server o modelo OpenAI selecionado no momento, a política de aprovação, a sandbox e a camada de serviço. Alternar de `openai/gpt-5.5` para
`openai/gpt-5.2` mantém o vínculo da thread, mas solicita que o Codex continue com o
modelo recém-selecionado.

## Respostas visíveis e heartbeats

Quando um turno de chat direto/de origem é executado pelo harness Codex, as respostas visíveis
usam por padrão a entrega automática final do assistente para superfícies internas do WebChat.
Isso mantém o Codex alinhado ao contrato de prompt do harness Pi: agentes respondem
normalmente, e o OpenClaw publica o texto final na conversa de origem. Defina
`messages.visibleReplies: "message_tool"` quando um chat direto/de origem deve
intencionalmente manter o texto final do assistente privado, a menos que o agente chame
`message(action="send")`.

Turnos de Heartbeat do Codex também recebem `heartbeat_respond` no catálogo pesquisável de ferramentas do OpenClaw
por padrão, para que o agente possa registrar se o despertar deve permanecer
silencioso ou notificar sem codificar esse fluxo de controle no texto final.

A orientação de iniciativa específica de Heartbeat é enviada como uma instrução de desenvolvedor em modo de colaboração do Codex
no próprio turno de Heartbeat. Turnos comuns de chat restauram
o modo Padrão do Codex em vez de carregar a filosofia de Heartbeat no prompt normal
do runtime. Quando existe um `HEARTBEAT.md` não vazio, as instruções em modo de colaboração de Heartbeat
apontam o Codex para o arquivo em vez de incorporar seu conteúdo.

## Limites de hooks

O harness Codex tem três camadas de hooks:

| Camada                                | Responsável              | Finalidade                                                           |
| ------------------------------------- | ------------------------ | -------------------------------------------------------------------- |
| Hooks de Plugin do OpenClaw           | OpenClaw                 | Compatibilidade de produto/Plugin entre harnesses OpenClaw e Codex.  |
| Middleware de extensão do app-server do Codex | Plugins empacotados do OpenClaw | Comportamento do adaptador por turno em torno das ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                    | Ciclo de vida de baixo nível do Codex e política de ferramentas nativas da configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` de projeto ou globais do Codex para rotear
comportamento de Plugin do OpenClaw. Para a ponte compatível de ferramenta nativa e permissão,
o OpenClaw injeta configuração do Codex por thread para `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`.

Quando as aprovações do app-server do Codex estão habilitadas, ou seja, `approvalPolicy` não é
`"never"`, a configuração padrão injetada de hooks nativos omite `PermissionRequest` para que
o revisor do app-server do Codex e a ponte de aprovação do OpenClaw lidem com
escalonamentos reais após a revisão. Operadores podem adicionar explicitamente `permission_request` a
`nativeHookRelay.events` quando precisam do relay de compatibilidade.

Outros hooks do Codex, como `SessionStart` e `UserPromptSubmit`, permanecem
controles no nível do Codex. Eles não são expostos como hooks de Plugin do OpenClaw no contrato v1.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois que o Codex solicita a
chamada, então o OpenClaw dispara o comportamento de Plugin e middleware que ele possui no
adaptador do harness. Para ferramentas nativas do Codex, o Codex é responsável pelo registro canônico da ferramenta.
O OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread nativa do Codex
a menos que o Codex exponha essa operação por meio do app-server ou callbacks de hooks nativos.

Eventos `PreToolUse` em modo de relatório do app-server do Codex adiam solicitações de aprovação de Plugin
para a aprovação correspondente do app-server. Se um hook `before_tool_call` do OpenClaw
retornar `requireApproval` enquanto o payload nativo define o modo de aprovação de relatório
(`openclaw_approval_mode` é `"report"`), o relay de hooks nativos registra o
requisito de aprovação de Plugin e não retorna nenhuma decisão nativa. Quando o Codex envia a
solicitação de aprovação do app-server para o mesmo uso de ferramenta, o OpenClaw abre o prompt de aprovação do Plugin
e mapeia a decisão de volta para o Codex. Eventos `PermissionRequest`
do Codex são um caminho de aprovação separado e ainda podem ser roteados por aprovações do OpenClaw
quando o runtime está configurado para essa ponte.

Notificações de itens do app-server do Codex também fornecem observações assíncronas `after_tool_call`
para conclusões de ferramentas nativas que ainda não são cobertas pelo
relay nativo `PostToolUse`. Essas observações são apenas para telemetria e compatibilidade de Plugin;
elas não podem bloquear, atrasar nem modificar a chamada de ferramenta nativa.

Projeções de Compaction e ciclo de vida de LLM vêm de notificações do app-server do Codex
e do estado do adaptador do OpenClaw, não de comandos nativos de hooks do Codex.
Os eventos `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` do OpenClaw são observações no nível do adaptador, não capturas byte a byte
da solicitação interna ou dos payloads de Compaction do Codex.

Notificações `hook/started` e `hook/completed` nativas do Codex no app-server são
projetadas como eventos de agente `codex_app_server.hook` para trajetória e depuração.
Elas não invocam hooks de Plugin do OpenClaw.

## Contrato de suporte v1

Compatível no runtime Codex v1:

| Superfície | Suporte | Por quê |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop de modelo OpenAI por meio do Codex | Compatível | O app-server do Codex controla o turno OpenAI, a retomada nativa da thread e a continuação nativa de ferramentas. |
| Roteamento e entrega de canais do OpenClaw | Compatível | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais permanecem fora do runtime do modelo. |
| Ferramentas dinâmicas do OpenClaw | Compatível | O Codex pede ao OpenClaw para executar essas ferramentas, então o OpenClaw permanece no caminho de execução. |
| Plugins de prompt e contexto | Compatível | O OpenClaw projeta prompt/contexto específicos do OpenClaw no turno do Codex, enquanto deixa prompts base, de modelo e de documentação de projeto configurada pertencentes ao Codex na trilha nativa do Codex. O OpenClaw desativa a personalidade integrada do Codex para threads nativas, para que os arquivos de personalidade do workspace do agente permaneçam autoritativos. As instruções nativas de desenvolvedor do Codex aceitam apenas orientação de comandos explicitamente escopada para `codex_app_server`; dicas globais legadas de comando permanecem para superfícies de prompt que não são Codex. |
| Ciclo de vida do mecanismo de contexto | Compatível | Montagem, ingestão e manutenção pós-turno são executadas ao redor dos turnos do Codex. Mecanismos de contexto não substituem a Compaction nativa do Codex. |
| Hooks de ferramentas dinâmicas | Compatível | `before_tool_call`, `after_tool_call` e middleware de resultado de ferramenta são executados ao redor das ferramentas dinâmicas pertencentes ao OpenClaw. |
| Hooks de ciclo de vida | Compatível como observações do adaptador | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` disparam com payloads honestos do modo Codex. |
| Gate de revisão da resposta final | Compatível por retransmissão de hook nativo | `Stop` do Codex é retransmitido para `before_agent_finalize`; `revise` pede ao Codex mais uma passagem de modelo antes da finalização. |
| Shell, patch e bloqueio ou observação de MCP nativos | Compatível por retransmissão de hook nativo | `PreToolUse` e `PostToolUse` do Codex são retransmitidos para superfícies nativas de ferramenta confirmadas, incluindo payloads MCP no app-server do Codex `0.125.0` ou mais novo. Bloqueio é compatível; reescrita de argumentos não é. |
| Política de permissões nativa | Compatível por aprovações do app-server do Codex e retransmissão compatível de hook nativo | Solicitações de aprovação do app-server do Codex são roteadas pelo OpenClaw após a revisão do Codex. A retransmissão do hook nativo `PermissionRequest` é opcional para modos de aprovação nativa porque o Codex a emite antes da revisão do guardião. |
| Captura de trajetória do app-server | Compatível | O OpenClaw registra a solicitação enviada ao app-server e as notificações do app-server que recebe. |

Não compatível no runtime Codex v1:

| Superfície | Limite da V1 | Caminho futuro |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutação de argumentos de ferramentas nativas | Hooks nativos pré-ferramenta do Codex podem bloquear, mas o OpenClaw não reescreve argumentos de ferramentas nativas do Codex. | Requer suporte de hook/esquema do Codex para entrada de ferramenta substituta. |
| Histórico editável de transcrição nativa do Codex | O Codex controla o histórico canônico da thread nativa. O OpenClaw controla um espelho e pode projetar contexto futuro, mas não deve modificar componentes internos sem suporte. | Adicionar APIs explícitas do app-server do Codex se cirurgia em thread nativa for necessária. |
| `tool_result_persist` para registros de ferramentas nativas do Codex | Esse hook transforma gravações de transcrição pertencentes ao OpenClaw, não registros de ferramentas nativas do Codex. | Poderia espelhar registros transformados, mas a reescrita canônica precisa de suporte do Codex. |
| Metadados ricos de Compaction nativa | O OpenClaw pode solicitar Compaction nativa, mas não recebe uma lista estável de itens mantidos/descartados, delta de tokens, resumo de conclusão ou payload de resumo. | Precisa de eventos de Compaction do Codex mais ricos. |
| Intervenção na Compaction | O OpenClaw não permite que plugins ou mecanismos de contexto vetem, reescrevam ou substituam a Compaction nativa do Codex. | Adicionar hooks pré/pós-Compaction do Codex se plugins precisarem vetar ou reescrever Compaction nativa. |
| Captura byte a byte da solicitação à API do modelo | O OpenClaw pode capturar solicitações e notificações do app-server, mas o núcleo do Codex constrói internamente a solicitação final à API OpenAI. | Precisa de um evento de rastreamento de solicitação de modelo do Codex ou uma API de depuração. |

## Permissões nativas e solicitações MCP

Para `PermissionRequest`, o OpenClaw retorna apenas decisões explícitas de permitir ou negar
quando a política decide. Um resultado sem decisão não é uma permissão. O Codex o trata como ausência de
decisão de hook e segue para seu próprio caminho de aprovação do guardião ou do usuário.

Os modos de aprovação do app-server do Codex omitem esse hook nativo por padrão. Esse comportamento
se aplica quando `permission_request` está explicitamente incluído em
`nativeHookRelay.events` ou quando um runtime de compatibilidade o instala.

Quando um operador escolhe `allow-always` para uma solicitação de permissão nativa do Codex,
o OpenClaw lembra a impressão digital exata de provedor/sessão/entrada de ferramenta/cwd por uma
janela de sessão limitada. A decisão lembrada é intencionalmente apenas de correspondência exata:
um comando, argumentos, payload de ferramenta ou cwd alterado cria uma nova
aprovação.

Solicitações de aprovação de ferramenta MCP do Codex são roteadas pelo fluxo de
aprovação de Plugin do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Prompts `request_user_input` do Codex são enviados de volta ao
chat de origem, e a próxima mensagem de acompanhamento enfileirada responde a essa solicitação do
servidor nativo em vez de ser direcionada como contexto extra. Outras solicitações MCP de elicitação
falham de forma fechada.

Para o fluxo geral de aprovação de Plugin que transporta esses prompts, consulte
[Solicitações de permissão de Plugin](/pt-BR/plugins/plugin-permission-requests).

## Direcionamento de fila

O direcionamento de fila de execução ativa é mapeado para `turn/steer` do app-server do Codex. Com o
padrão `messages.queue.mode: "steer"`, o OpenClaw agrupa mensagens de chat em modo steer
durante a janela silenciosa configurada e as envia como uma única solicitação `turn/steer`
na ordem de chegada.

As revisões do Codex e os turnos manuais de Compaction podem rejeitar o direcionamento no mesmo turno. Nesse
caso, o OpenClaw aguarda a execução ativa terminar antes de iniciar o prompt.
Use `/queue followup` ou `/queue collect` quando as mensagens devem entrar na fila por padrão
em vez de direcionar. Consulte [Fila de direcionamento](/pt-BR/concepts/queue-steering).

## Upload de feedback do Codex

Quando `/diagnostics [note]` é aprovado para uma sessão que usa o harness nativo do Codex,
o OpenClaw também chama `feedback/upload` do app-server do Codex para threads relevantes
do Codex. O upload solicita que o app-server inclua logs para cada thread listada
e subthreads do Codex geradas quando disponíveis.

O upload passa pelo caminho normal de feedback do Codex para os servidores da OpenAI. Se o feedback do Codex
estiver desativado nesse app-server, o comando retorna o erro do app-server.
A resposta de diagnósticos concluída lista os canais, ids de sessão do OpenClaw,
ids de thread do Codex e comandos locais `codex resume <thread-id>` para as threads
que foram enviadas.

Se você negar ou ignorar a aprovação, o OpenClaw não imprime esses ids do Codex e
não envia feedback do Codex. O upload não substitui a exportação local de diagnósticos do Gateway.
Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) para o comportamento de
aprovação, privacidade, pacote local e chat em grupo.

Use `/codex diagnostics [note]` somente quando você quiser especificamente o upload de feedback do Codex
para a thread atualmente anexada sem o pacote completo de diagnósticos do Gateway.

## Compaction e espelho de transcrição

Quando o modelo selecionado usa o harness do Codex, a Compaction de thread nativa pertence
ao app-server do Codex. O OpenClaw não executa Compaction de preflight para turnos do Codex,
não substitui a Compaction do Codex pela Compaction do mecanismo de contexto e não
recorre à sumarização do OpenClaw ou pública da OpenAI quando a Compaction nativa do Codex
não pode ser iniciada. O OpenClaw mantém um espelho de transcrição para histórico do canal,
busca, `/new`, `/reset` e troca futura de modelo ou harness.

Solicitações explícitas de Compaction, como `/compact` ou uma operação manual de compactação
solicitada por Plugin, iniciam a Compaction nativa do Codex com `thread/compact/start`.
O OpenClaw mantém a solicitação e o lease do cliente compartilhado abertos até que o Codex emita o
item de conclusão `contextCompaction` correspondente e então relata o turno de Compaction
como concluído. Se esse turno terminal exceder o tempo limite configurado de Compaction,
o OpenClaw solicita uma interrupção de turno nativa. O lease e a barreira de Compaction
por thread permanecem retidos até que o Codex relate o estado terminal ou confirme o RPC de interrupção.
Se o Codex não confirmar dentro do período de carência da interrupção, o OpenClaw aposenta
a conexão antes de liberar a barreira. Conexões remotas também destacam o vínculo da thread
correspondente para que trabalho posterior não possa se sobrepor a um turno remoto não confirmado.
Outros turnos em uma conexão aposentada falham e podem tentar novamente em um cliente novo.
Fechamento do cliente, cancelamento da solicitação ou falha em um turno de Compaction retorna uma
operação com falha.

Quando um mecanismo de contexto solicita projeção de bootstrap de thread do Codex, o OpenClaw
projeta nomes e ids de chamadas de ferramenta, formatos de entrada e conteúdo editado de resultados de ferramenta
na nova thread do Codex. Ele não copia valores brutos de argumentos de chamada de ferramenta para
essa projeção.

O espelho inclui o prompt do usuário, o texto final do assistente e registros leves de raciocínio
ou plano do Codex quando o app-server os emite. O OpenClaw registra o início da Compaction
nativa e o status terminal, mas não expõe um resumo de Compaction legível por humanos
nem uma lista auditável de quais entradas o Codex manteve após a Compaction.

Como o Codex é dono da thread nativa canônica, `tool_result_persist` atualmente não
reescreve registros de resultado de ferramenta nativos do Codex. Ele se aplica apenas quando
o OpenClaw está escrevendo um resultado de ferramenta de transcrição de sessão de propriedade do OpenClaw.

## Mídia e entrega

O OpenClaw continua sendo dono da entrega de mídia e da seleção de provedor de mídia. Imagem,
vídeo, música, PDF, TTS e compreensão de mídia usam configurações de provedor/modelo
correspondentes, como `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` e `messages.tts`.

Texto, imagens, vídeo, música, TTS, aprovações e saída da ferramenta de mensagens continuam
pelo caminho normal de entrega do OpenClaw. A geração de mídia não exige o runtime legado.
Quando o Codex emite um item nativo de geração de imagem com um `savedPath`, o OpenClaw
encaminha esse arquivo exato pelo caminho normal de mídia de resposta, mesmo que o turno do Codex
não tenha texto de assistente.

## Relacionados

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference)
- [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Exportação de trajetória](/pt-BR/tools/trajectory)
