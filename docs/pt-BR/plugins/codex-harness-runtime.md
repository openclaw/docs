---
read_when:
    - Você precisa do contrato de suporte em tempo de execução do harness do Codex
    - Você está depurando ferramentas nativas do Codex, ganchos, Compaction ou envio de comentários
    - Você está alterando o comportamento do Plugin entre turnos do Pi e do harness do Codex
summary: Limites de tempo de execução, ganchos, ferramentas, permissões e diagnósticos para o harness do Codex
title: Ambiente de execução da estrutura do Codex
x-i18n:
    generated_at: "2026-05-10T19:41:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 0170c8986b939d8d21684103261c2a7875baf399577eeae572da98c92acbc1e9
    source_path: plugins/codex-harness-runtime.md
    workflow: 16
---

Esta página documenta o contrato de tempo de execução para turnos do harness do Codex. Para configuração e
roteamento, comece com [harness do Codex](/pt-BR/plugins/codex-harness). Para campos de configuração,
consulte [referência do harness do Codex](/pt-BR/plugins/codex-harness-reference).

## Visão geral

O modo Codex não é PI com uma chamada de modelo diferente por baixo. O Codex controla uma parte maior do
loop nativo do modelo, e o OpenClaw adapta suas superfícies de plugin, ferramenta, sessão e
diagnóstico em torno desse limite.

O OpenClaw ainda controla o roteamento de canais, arquivos de sessão, entrega de mensagens visíveis,
ferramentas dinâmicas do OpenClaw, aprovações, entrega de mídia e um espelho de transcrição.
O Codex controla a thread nativa canônica, o loop nativo do modelo, a continuação nativa de ferramentas
e a Compaction nativa.

## Vinculações de thread e mudanças de modelo

Quando uma sessão do OpenClaw é anexada a uma thread existente do Codex, o próximo turno
envia novamente ao app-server o modelo da OpenAI atualmente selecionado, a política de aprovação, a sandbox e a camada de serviço.
Alternar de `openai/gpt-5.5` para
`openai/gpt-5.2` mantém a vinculação da thread, mas pede ao Codex que continue com o
modelo recém-selecionado.

## Respostas visíveis e Heartbeats

Quando um turno de chat de origem passa pelo harness do Codex, as respostas visíveis usam por padrão
a ferramenta `message` do OpenClaw se a implantação não tiver configurado explicitamente
`messages.visibleReplies`. O agente ainda pode concluir seu turno do Codex de forma privada;
ele só publica no canal quando chama `message(action="send")`. Defina
`messages.visibleReplies: "automatic"` para manter as respostas finais de chat direto no
caminho legado de entrega automática.

Turnos de Heartbeat do Codex também recebem `heartbeat_respond` no catálogo pesquisável de
ferramentas do OpenClaw por padrão, para que o agente possa registrar se o despertar deve permanecer
silencioso ou notificar sem codificar esse fluxo de controle no texto final.

A orientação de iniciativa específica de Heartbeat é enviada como uma instrução de desenvolvedor de
modo de colaboração do Codex no próprio turno de Heartbeat. Turnos comuns de chat restauram
o modo Padrão do Codex em vez de carregar a filosofia de Heartbeat em seu prompt normal
de tempo de execução.

## Limites de hooks

O harness do Codex tem três camadas de hooks:

| Camada                                | Dono                     | Finalidade                                                           |
| ------------------------------------- | ------------------------ | ------------------------------------------------------------------- |
| Hooks de plugin do OpenClaw           | OpenClaw                 | Compatibilidade de produto/plugin entre os harnesses PI e Codex.    |
| Middleware de extensão do app-server do Codex | Plugins empacotados do OpenClaw | Comportamento de adaptador por turno em torno das ferramentas dinâmicas do OpenClaw. |
| Hooks nativos do Codex                | Codex                    | Ciclo de vida de baixo nível do Codex e política de ferramentas nativas da configuração do Codex. |

O OpenClaw não usa arquivos `hooks.json` de projeto ou globais do Codex para rotear
comportamento de plugin do OpenClaw. Para a ponte compatível de ferramenta nativa e permissão,
o OpenClaw injeta configuração do Codex por thread para `PreToolUse`, `PostToolUse`,
`PermissionRequest` e `Stop`.

Quando as aprovações do app-server do Codex estão habilitadas, ou seja, `approvalPolicy` não é
`"never"`, a configuração padrão de hook nativo injetada omite `PermissionRequest` para que
o revisor do app-server do Codex e a ponte de aprovação do OpenClaw lidem com
escalonamentos reais após a revisão. Operadores podem adicionar explicitamente `permission_request` a
`nativeHookRelay.events` quando precisam do relay de compatibilidade.

Outros hooks do Codex, como `SessionStart` e `UserPromptSubmit`, continuam sendo
controles no nível do Codex. Eles não são expostos como hooks de plugin do OpenClaw no contrato v1.

Para ferramentas dinâmicas do OpenClaw, o OpenClaw executa a ferramenta depois que o Codex solicita a
chamada, então o OpenClaw dispara o comportamento de plugin e middleware que controla no
adaptador do harness. Para ferramentas nativas do Codex, o Codex controla o registro canônico da ferramenta.
O OpenClaw pode espelhar eventos selecionados, mas não pode reescrever a thread nativa do Codex
a menos que o Codex exponha essa operação por meio do app-server ou de callbacks de hook nativo.

Projeções de Compaction e ciclo de vida do LLM vêm de notificações do app-server do Codex
e do estado do adaptador do OpenClaw, não de comandos de hooks nativos do Codex.
Os eventos `before_compaction`, `after_compaction`, `llm_input` e
`llm_output` do OpenClaw são observações no nível do adaptador, não capturas byte a byte
da solicitação interna ou dos payloads de Compaction do Codex.

As notificações `hook/started` e `hook/completed` nativas do Codex no app-server são
projetadas como eventos de agente `codex_app_server.hook` para trajetória e depuração.
Elas não invocam hooks de plugin do OpenClaw.

## Contrato de suporte v1

Com suporte no tempo de execução v1 do Codex:

| Superfície                                    | Suporte                                                                          | Motivo                                                                                                                                                                                                     |
| --------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Loop de modelo da OpenAI pelo Codex           | Com suporte                                                                      | O app-server do Codex controla o turno da OpenAI, a retomada da thread nativa e a continuação nativa de ferramentas.                                                                                       |
| Roteamento e entrega de canais do OpenClaw    | Com suporte                                                                      | Telegram, Discord, Slack, WhatsApp, iMessage e outros canais permanecem fora do tempo de execução do modelo.                                                                                               |
| Ferramentas dinâmicas do OpenClaw             | Com suporte                                                                      | O Codex pede ao OpenClaw para executar essas ferramentas, então o OpenClaw permanece no caminho de execução.                                                                                                |
| Plugins de prompt e contexto                  | Com suporte                                                                      | O OpenClaw cria sobreposições de prompt e projeta contexto no turno do Codex antes de iniciar ou retomar a thread.                                                                                         |
| Ciclo de vida do mecanismo de contexto        | Com suporte                                                                      | Montagem, ingestão, manutenção após o turno e coordenação de Compaction do mecanismo de contexto são executadas para turnos do Codex.                                                                       |
| Hooks de ferramentas dinâmicas                | Com suporte                                                                      | `before_tool_call`, `after_tool_call` e middleware de resultado de ferramenta são executados em torno de ferramentas dinâmicas controladas pelo OpenClaw.                                                   |
| Hooks de ciclo de vida                        | Com suporte como observações do adaptador                                        | `llm_input`, `llm_output`, `agent_end`, `before_compaction` e `after_compaction` disparam com payloads honestos do modo Codex.                                                                             |
| Portão de revisão de resposta final           | Com suporte por meio do relay de hook nativo                                     | `Stop` do Codex é retransmitido para `before_agent_finalize`; `revise` pede ao Codex mais uma passagem de modelo antes da finalização.                                                                      |
| Bloqueio ou observação de shell, patch e MCP nativos | Com suporte por meio do relay de hook nativo                                     | `PreToolUse` e `PostToolUse` do Codex são retransmitidos para superfícies de ferramentas nativas comprometidas, incluindo payloads MCP no app-server do Codex `0.125.0` ou mais recente. Bloqueio tem suporte; reescrita de argumentos não. |
| Política de permissão nativa                  | Com suporte por meio das aprovações do app-server do Codex e do relay de hook nativo de compatibilidade | Solicitações de aprovação do app-server do Codex passam pelo OpenClaw após a revisão do Codex. O relay de hook nativo `PermissionRequest` é opcional para modos de aprovação nativa porque o Codex o emite antes da revisão do guardião. |
| Captura de trajetória do app-server           | Com suporte                                                                      | O OpenClaw registra a solicitação enviada ao app-server e as notificações do app-server que recebe.                                                                                                         |

Sem suporte no tempo de execução v1 do Codex:

| Superfície                                          | Limite v1                                                                                                                                       | Caminho futuro                                                                            |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Mutação de argumentos de ferramentas nativas        | Hooks nativos pré-ferramenta do Codex podem bloquear, mas o OpenClaw não reescreve argumentos de ferramentas nativas do Codex.                 | Requer suporte de hook/esquema do Codex para entrada de ferramenta de substituição.       |
| Histórico editável de transcrição nativa do Codex   | O Codex controla o histórico canônico da thread nativa. O OpenClaw controla um espelho e pode projetar contexto futuro, mas não deve mutar partes internas sem suporte. | Adicionar APIs explícitas do app-server do Codex se cirurgia de thread nativa for necessária. |
| `tool_result_persist` para registros de ferramentas nativas do Codex | Esse hook transforma gravações de transcrição controladas pelo OpenClaw, não registros de ferramentas nativas do Codex.                         | Poderia espelhar registros transformados, mas a reescrita canônica precisa de suporte do Codex. |
| Metadados ricos de Compaction nativa                | O OpenClaw observa o início e a conclusão da Compaction, mas não recebe uma lista estável de itens mantidos/descartados, delta de tokens ou payload de resumo. | Precisa de eventos de Compaction mais ricos do Codex.                                    |
| Intervenção na Compaction                           | Os hooks atuais de Compaction do OpenClaw são de nível de notificação no modo Codex.                                                            | Adicionar hooks de pré/pós-Compaction do Codex se plugins precisarem vetar ou reescrever a Compaction nativa. |
| Captura byte a byte da solicitação de API do modelo | O OpenClaw pode capturar solicitações e notificações do app-server, mas o núcleo do Codex cria internamente a solicitação final para a API da OpenAI. | Precisa de um evento de rastreamento de solicitação de modelo do Codex ou de uma API de depuração. |

## Permissões nativas e elicitações MCP

Para `PermissionRequest`, o OpenClaw só retorna decisões explícitas de permitir ou negar
quando a política decide. Um resultado sem decisão não é uma permissão. O Codex o trata como ausência de
decisão de hook e prossegue para seu próprio caminho de guardião ou aprovação do usuário.

Os modos de aprovação do app-server do Codex omitem esse hook nativo por padrão. Esse comportamento
se aplica quando `permission_request` é incluído explicitamente em
`nativeHookRelay.events` ou quando um tempo de execução de compatibilidade o instala.

Quando um operador escolhe `allow-always` para uma solicitação de permissão nativa do Codex,
o OpenClaw memoriza a impressão digital exata de provedor/sessão/entrada de ferramenta/cwd para uma
janela de sessão limitada. A decisão memorizada é intencionalmente apenas de correspondência exata:
um comando, argumentos, payload de ferramenta ou cwd alterado cria uma nova
aprovação.

As solicitações de aprovação de ferramenta MCP do Codex são roteadas pelo fluxo de
aprovação de Plugin do OpenClaw quando o Codex marca `_meta.codex_approval_kind` como
`"mcp_tool_call"`. Os prompts `request_user_input` do Codex são enviados de volta ao
chat de origem, e a próxima mensagem de acompanhamento enfileirada responde a essa
solicitação nativa do servidor em vez de ser direcionada como contexto extra. Outras
solicitações MCP de elicitação falham de forma fechada.

## Direcionamento de fila

O direcionamento de fila durante execução ativa é mapeado para `turn/steer` do servidor de aplicativo do Codex. Com o
padrão `messages.queue.mode: "steer"`, o OpenClaw agrupa as mensagens de chat enfileiradas
durante a janela de silêncio configurada e as envia como uma solicitação `turn/steer` em
ordem de chegada. O modo legado `queue` envia solicitações `turn/steer` separadas.

Turnos de revisão do Codex e Compaction manual podem rejeitar direcionamento no mesmo turno. Nesse
caso, o OpenClaw usa a fila de acompanhamento quando o modo selecionado permite fallback.
Consulte [Fila de direcionamento](/pt-BR/concepts/queue-steering).

## Upload de feedback do Codex

Quando `/diagnostics [note]` é aprovado para uma sessão usando o harness nativo do Codex,
o OpenClaw também chama `feedback/upload` do servidor de aplicativo do Codex para threads
relevantes do Codex. O upload solicita que o servidor de aplicativo inclua logs de cada thread
listada e de subthreads do Codex geradas, quando disponíveis.

O upload passa pelo caminho normal de feedback do Codex para os servidores da OpenAI. Se o
feedback do Codex estiver desabilitado nesse servidor de aplicativo, o comando retorna o erro do
servidor de aplicativo. A resposta de diagnóstico concluída lista os canais, ids de sessão do OpenClaw,
ids de thread do Codex e comandos locais `codex resume <thread-id>` para as threads
que foram enviadas.

Se você negar ou ignorar a aprovação, o OpenClaw não imprime esses ids do Codex e
não envia feedback do Codex. O upload não substitui a exportação local de diagnósticos do
Gateway. Consulte [Exportação de diagnósticos](/pt-BR/gateway/diagnostics) para o
comportamento de aprovação, privacidade, pacote local e chat em grupo.

Use `/codex diagnostics [note]` apenas quando quiser especificamente o upload de
feedback do Codex para a thread anexada no momento, sem o pacote completo de diagnósticos do
Gateway.

## Compaction e espelho de transcrição

Quando o modelo selecionado usa o harness do Codex, a Compaction nativa da thread é
delegada ao servidor de aplicativo do Codex. O OpenClaw mantém um espelho de transcrição para histórico
de canais, busca, `/new`, `/reset` e futura troca de modelo ou harness.

O espelho inclui o prompt do usuário, o texto final do assistente e registros leves de
raciocínio ou plano do Codex quando o servidor de aplicativo os emite. Hoje, o OpenClaw apenas
registra sinais de início e conclusão de Compaction nativa. Ele ainda não expõe um
resumo de Compaction legível por humanos nem uma lista auditável de quais entradas o Codex
manteve após a Compaction.

Como o Codex possui a thread nativa canônica, `tool_result_persist` atualmente não
reescreve registros de resultado de ferramenta nativos do Codex. Ele se aplica apenas quando
o OpenClaw está escrevendo um resultado de ferramenta de transcrição de sessão pertencente ao OpenClaw.

## Mídia e entrega

O OpenClaw continua responsável pela entrega de mídia e pela seleção de provedor de mídia. Imagem,
vídeo, música, PDF, TTS e compreensão de mídia usam configurações correspondentes de provedor/modelo,
como `agents.defaults.imageGenerationModel`, `videoGenerationModel`,
`pdfModel` e `messages.tts`.

Texto, imagens, vídeo, música, TTS, aprovações e saída de ferramenta de mensagens continuam
pelo caminho normal de entrega do OpenClaw. A geração de mídia não exige PI.
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
