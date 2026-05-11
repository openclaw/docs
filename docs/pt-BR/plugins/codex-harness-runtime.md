---
read_when:
    - Você precisa do contrato de suporte de tempo de execução do harness do Codex
    - Você está depurando ferramentas nativas do Codex, hooks, Compaction ou upload de feedback
    - Você está alterando o comportamento do Plugin em turnos do PI e do ambiente Codex
summary: Limites de tempo de execução, ganchos, ferramentas, permissões e diagnósticos para o ambiente do Codex
title: Runtime do mecanismo do Codex
x-i18n:
    generated_at: "2026-05-11T20:33:13Z"
    model: gpt-5.5
    provider: openai
    source_hash: 8373441e725360527f89f66883f2bd1a164de558e82d1dee05c29af6756db25e
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Esta página documenta o contrato de runtime para turnos do harness do Codex. Para configuração e
roteamento, comece com [harness do Codex](/pt-BR/plugins/codex-harness). Para campos de configuração,
consulte [referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

## Visão geral

O modo Codex não é PI com uma chamada de modelo diferente por baixo. O Codex controla mais do
loop nativo do modelo, e o OpenClaw adapta suas superfícies de plugin, ferramenta, sessão e
diagnóstico em torno desse limite.

O OpenClaw ainda controla roteamento de canais, arquivos de sessão, entrega de mensagens visíveis,
ferramentas dinâmicas do OpenClaw, aprovações, entrega de mídia e um espelho de transcrição.
O Codex controla a thread nativa canônica, o loop nativo do modelo, a continuação nativa de
ferramentas e a compactação nativa.

## Vinculações de threads e mudanças de modelo

Quando uma sessão do OpenClaw é anexada a uma thread existente do Codex, o próximo turno
envia novamente ao app-server o modelo OpenAI selecionado no momento, a política de aprovação,
o sandbox e a camada de serviço. Mudar de `openai/gpt-5.5` para
`openai/gpt-5.2` mantém a vinculação da thread, mas pede ao Codex que continue com o
modelo recém-selecionado.

## Respostas visíveis e heartbeats

Quando um turno de chat de origem passa pelo harness do Codex, as respostas visíveis usam por padrão
a ferramenta `message` do OpenClaw se a implantação não tiver configurado explicitamente
`messages.visibleReplies`. O agente ainda pode finalizar seu turno do Codex privadamente;
ele só publica no canal quando chama `message(action="send")`. Defina
`messages.visibleReplies: "automatic"` para manter as respostas finais de chats diretos no
caminho legado de entrega automática.

Turnos de heartbeat do Codex também recebem `heartbeat_respond` no catálogo pesquisável de
ferramentas do OpenClaw por padrão, para que o agente possa registrar se o despertar deve permanecer
silencioso ou notificar, sem codificar esse fluxo de controle no texto final.

A orientação de iniciativa específica de heartbeat é enviada como uma instrução de desenvolvedor
do modo de colaboração do Codex no próprio turno de heartbeat. Turnos comuns de chat restauram
o modo Padrão do Codex em vez de carregar a filosofia de heartbeat em seu prompt de runtime normal.

## Limites de hooks

O harness do Codex tem três camadas de hooks:

| Camada                                | Proprietário              | Finalidade                                                           |
| ------------------------------------- | ------------------------- | -------------------------------------------------------------------- |
| Hooks de plugins do OpenClaw          | OpenClaw                  | Compatibilidade de produto/plugin entre os harnesses PI e Codex.     |
| Middleware de extensão do app-server do Codex | Plugins incluídos do OpenClaw | Comportamento de adaptador por turno em torno das ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                     | Ciclo de vida de baixo nível do Codex e política de ferramentas nativas da configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` de projeto ou globais do Codex para rotear
comportamento de plugins do OpenClaw. Para a ponte compatível de ferramentas nativas e permissões,
o OpenClaw injeta configuração do Codex por thread para `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`.

Quando as aprovações do app-server do Codex estão habilitadas, ou seja, `approvalPolicy` não é
`"never"`, a configuração nativa padrão de hook injetado omite `PermissionRequest`, para que
o revisor do app-server do Codex e a ponte de aprovação do OpenClaw tratem escalonamentos reais
após a revisão. Operadores podem adicionar explicitamente `permission_request` a
`nativeHookRelay.events` quando precisarem do relay de compatibilidade.

Outros hooks do Codex, como `SessionStart` e `UserPromptSubmit`, continuam sendo controles
no nível do Codex. Eles não são expostos como hooks de plugins do OpenClaw no contrato v1.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois que o Codex solicita
a chamada, então o OpenClaw aciona o comportamento de plugin e middleware que controla no
adaptador do harness. Para ferramentas nativas do Codex, o Codex controla o registro canônico da ferramenta.
O OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread nativa do Codex
a menos que o Codex exponha essa operação por meio do app-server ou de callbacks de hooks nativos.

As notificações de itens do app-server do Codex também fornecem observações assíncronas
`after_tool_call` para conclusões de ferramentas nativas que ainda não são cobertas pelo
relay nativo `PostToolUse`. Essas observações servem apenas para telemetria e compatibilidade
de plugins; elas não podem bloquear, atrasar ou alterar a chamada nativa da ferramenta.

Projeções de compactação e ciclo de vida de LLM vêm das notificações do app-server do Codex
e do estado do adaptador do OpenClaw, não de comandos de hooks nativos do Codex.
Os eventos `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` do OpenClaw são observações no nível do adaptador, não capturas byte a byte
da requisição interna do Codex ou dos payloads de compactação.

As notificações `hook/started` e `hook/completed` nativas do Codex no app-server são
projetadas como eventos de agente `codex_app_server.hook` para trajetória e depuração.
Elas não invocam hooks de plugins do OpenClaw.

## Contrato de suporte v1

Com suporte no runtime v1 do Codex:

| Superfície                                    | Suporte                                                                          | Motivo                                                                                                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop do modelo OpenAI via Codex               | Suportado                                                                        | O app-server do Codex controla o turno OpenAI, a retomada da thread nativa e a continuação nativa de ferramentas.                                                                                          |
| Roteamento e entrega de canais do OpenClaw    | Suportado                                                                        | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais ficam fora do runtime do modelo.                                                                                                              |
| Ferramentas dinâmicas do OpenClaw             | Suportado                                                                        | O Codex pede que o OpenClaw execute essas ferramentas, então o OpenClaw permanece no caminho de execução.                                                                                                   |
| Plugins de prompt e contexto                  | Suportado                                                                        | O OpenClaw constrói sobreposições de prompt e projeta contexto no turno do Codex antes de iniciar ou retomar a thread.                                                                                      |
| Ciclo de vida do mecanismo de contexto        | Suportado                                                                        | Montagem, ingestão, manutenção pós-turno e coordenação de compactação do mecanismo de contexto são executadas para turnos do Codex.                                                                         |
| Hooks de ferramentas dinâmicas                | Suportado                                                                        | `before_tool_call`, `after_tool_call` e middleware de resultado de ferramenta são executados em torno de ferramentas dinâmicas controladas pelo OpenClaw.                                                   |
| Hooks de ciclo de vida                        | Suportado como observações do adaptador                                           | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` disparam com payloads honestos do modo Codex.                                                                             |
| Gate de revisão de resposta final             | Suportado por meio do relay de hook nativo                                        | O `Stop` do Codex é retransmitido para `before_agent_finalize`; `revise` pede ao Codex mais uma passagem de modelo antes da finalização.                                                                    |
| Bloqueio ou observação de shell, patch e MCP nativos | Suportado por meio do relay de hook nativo                                  | `PreToolUse` e `PostToolUse` do Codex são retransmitidos para superfícies nativas de ferramentas comprometidas, incluindo payloads MCP no app-server do Codex `0.125.0` ou mais recente. O bloqueio é suportado; a reescrita de argumentos não. |
| Política nativa de permissões                 | Suportada por aprovações do app-server do Codex e relay de hook nativo de compatibilidade | Solicitações de aprovação do app-server do Codex são roteadas pelo OpenClaw após a revisão do Codex. O relay do hook nativo `PermissionRequest` é opt-in para modos de aprovação nativos porque o Codex o emite antes da revisão do guardião. |
| Captura de trajetória do app-server           | Suportado                                                                        | O OpenClaw registra a requisição que enviou ao app-server e as notificações do app-server que recebe.                                                                                                       |

Sem suporte no runtime v1 do Codex:

| Superfície                                           | Limite v1                                                                                                                                        | Caminho futuro                                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Mutação de argumentos de ferramentas nativas         | Hooks nativos pré-ferramenta do Codex podem bloquear, mas o OpenClaw não reescreve argumentos de ferramentas nativas do Codex.                  | Requer suporte de hook/esquema do Codex para entrada substituta de ferramenta.             |
| Histórico editável de transcrição nativa do Codex    | O Codex controla o histórico canônico da thread nativa. O OpenClaw controla um espelho e pode projetar contexto futuro, mas não deve alterar internals sem suporte. | Adicionar APIs explícitas do app-server do Codex se cirurgia de thread nativa for necessária. |
| `tool_result_persist` para registros de ferramentas nativas do Codex | Esse hook transforma escritas de transcrição controladas pelo OpenClaw, não registros de ferramentas nativas do Codex.                 | Poderia espelhar registros transformados, mas a reescrita canônica precisa de suporte do Codex. |
| Metadados ricos de compactação nativa                | O OpenClaw observa o início e a conclusão da compactação, mas não recebe uma lista estável de itens mantidos/removidos, delta de tokens ou payload de resumo. | Precisa de eventos de compactação mais ricos do Codex.                                     |
| Intervenção na compactação                           | Os hooks atuais de compactação do OpenClaw são de nível de notificação no modo Codex.                                                            | Adicionar hooks pré/pós-compactação do Codex se plugins precisarem vetar ou reescrever a compactação nativa. |
| Captura byte a byte da requisição da API do modelo   | O OpenClaw pode capturar requisições e notificações do app-server, mas o core do Codex constrói internamente a requisição final da API OpenAI.   | Precisa de um evento de rastreamento de requisição de modelo do Codex ou API de depuração. |

## Permissões nativas e elicitações MCP

Para `PermissionRequest`, o OpenClaw só retorna decisões explícitas de permissão ou negação
quando a política decide. Um resultado sem decisão não é uma permissão. O Codex o trata como
nenhuma decisão de hook e segue para seu próprio caminho de guardião ou aprovação do usuário.

Os modos de aprovação do app-server do Codex omitem esse hook nativo por padrão. Esse comportamento
se aplica quando `permission_request` é incluído explicitamente em
`nativeHookRelay.events` ou quando um runtime de compatibilidade o instala.

Quando um operador escolhe `allow-always` para uma solicitação de permissão nativa do Codex,
o OpenClaw lembra essa impressão digital exata de provedor/sessão/entrada da ferramenta/cwd por uma
janela de sessão limitada. A decisão lembrada é intencionalmente apenas de correspondência exata:
um comando, argumentos, payload da ferramenta ou cwd alterado cria uma nova
aprovação.

As elicitações de aprovação de ferramenta MCP do Codex são roteadas pelo fluxo de
aprovação de Plugin do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Os prompts `request_user_input` do Codex são enviados de volta ao
chat de origem, e a próxima mensagem de acompanhamento enfileirada responde a essa solicitação
do servidor nativo em vez de ser direcionada como contexto extra. Outras solicitações de elicitação
MCP falham fechadas.

## Direcionamento de fila

O direcionamento de fila em execução ativa é mapeado para `turn/steer` do app-server do Codex. Com o
padrão `messages.queue.mode: "steer"`, o OpenClaw agrupa mensagens de chat enfileiradas
durante a janela de silêncio configurada e as envia como uma solicitação `turn/steer` em
ordem de chegada. O modo legado `queue` envia solicitações `turn/steer` separadas.

Turnos de revisão e Compaction manual do Codex podem rejeitar o direcionamento no mesmo turno. Nesse
caso, o OpenClaw usa a fila de acompanhamento quando o modo selecionado permite fallback.
Veja [Fila de direcionamento](/pt-BR/concepts/queue-steering).

## Upload de feedback do Codex

Quando `/diagnostics [note]` é aprovado para uma sessão usando o harness nativo do Codex,
o OpenClaw também chama `feedback/upload` do app-server do Codex para threads relevantes
do Codex. O upload solicita que o app-server inclua logs para cada thread listada
e subthreads do Codex geradas quando disponíveis.

O upload passa pelo caminho normal de feedback do Codex para os servidores da OpenAI. Se o feedback
do Codex estiver desativado nesse app-server, o comando retorna o erro do app-server.
A resposta de diagnósticos concluída lista os canais, ids de sessão do OpenClaw,
ids de thread do Codex e comandos locais `codex resume <thread-id>` para as threads
que foram enviadas.

Se você negar ou ignorar a aprovação, o OpenClaw não imprime esses ids do Codex e
não envia feedback do Codex. O upload não substitui a exportação local de diagnósticos do
Gateway. Veja [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) para o
comportamento de aprovação, privacidade, pacote local e chat em grupo.

Use `/codex diagnostics [note]` somente quando você quiser especificamente o upload de
feedback do Codex para a thread anexada atualmente sem o pacote completo de diagnósticos do
Gateway.

## Compaction e espelho de transcrição

Quando o modelo selecionado usa o harness do Codex, a Compaction de thread nativa é
delegada ao app-server do Codex. O OpenClaw mantém um espelho de transcrição para histórico
de canal, busca, `/new`, `/reset` e futuras trocas de modelo ou harness.

O espelho inclui o prompt do usuário, o texto final do assistente e registros leves de raciocínio
ou plano do Codex quando o app-server os emite. Hoje, o OpenClaw registra apenas
sinais nativos de início e conclusão de Compaction. Ele ainda não expõe um
resumo de Compaction legível por humanos ou uma lista auditável de quais entradas o Codex
manteve após a Compaction.

Como o Codex possui a thread nativa canônica, `tool_result_persist` atualmente não
reescreve registros de resultado de ferramenta nativos do Codex. Ele só se aplica quando
o OpenClaw está gravando um resultado de ferramenta de transcrição de sessão pertencente ao OpenClaw.

## Mídia e entrega

O OpenClaw continua responsável pela entrega de mídia e pela seleção de provedor de mídia. Imagem,
vídeo, música, PDF, TTS e entendimento de mídia usam configurações correspondentes de provedor/modelo
como `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` e `messages.tts`.

Texto, imagens, vídeo, música, TTS, aprovações e saída de ferramenta de mensagem continuam
pelo caminho normal de entrega do OpenClaw. A geração de mídia não exige PI.
Quando o Codex emite um item nativo de geração de imagem com um `savedPath`, o OpenClaw
encaminha exatamente esse arquivo pelo caminho normal de mídia de resposta, mesmo que o turno do Codex
não tenha texto de assistente.

## Relacionados

- [Harness do Codex](/pt-BR/plugins/codex-harness)
- [Referência do harness do Codex](/pt-BR/plugins/codex-harness-reference)
- [Plugins nativos do Codex](/pt-BR/plugins/codex-native-plugins)
- [Hooks de Plugin](/pt-BR/plugins/hooks)
- [Plugins de harness de agente](/pt-BR/plugins/sdk-agent-harness)
- [Exportação de diagnósticos](/pt-BR/gateway/diagnostics)
- [Exportação de trajetória](/pt-BR/tools/trajectory)
