---
read_when:
    - Alteração do ciclo de vida, armazenamento, protocolo ou autorização de aprovações de exec ou Plugin
    - Adição de links de aprovação ou controles de aprovação nativos a um canal
    - Projetando aprovações de sessões filhas em visualizações do pai ou do orquestrador
summary: Design para aprovações duráveis e acessíveis por links diretos na interface de controle, em aplicativos nativos, canais e sessões principais
title: Aprovações de operadores em múltiplas superfícies
x-i18n:
    generated_at: "2026-07-16T12:52:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 9defdaada1911df1184f64429e1787c4881e735c433d6dbc30a5946e11cc7cce
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Aprovações do operador em múltiplas superfícies

Este design acompanha a [#103505](https://github.com/openclaw/openclaw/issues/103505). Ele substitui a autoridade de aprovação local ao processo por um único ciclo de vida pertencente ao Gateway e respaldado por SQLite. Cada aprovação de execução ou de plugin/ferramenta pertencente ao Gateway recebe um ID estável, uma rota autenticada da interface de controle, resolução atômica em que a primeira resposta prevalece e projeções exclusivas para operadores nos fluxos da sessão de origem e das sessões ancestrais.

Ações em linha e links profundos coexistem. Não há alternância de modo de aprovação.

## Objetivos

- Um objeto de aprovação durável para barreiras de execução e de plugin/ferramenta.
- Rota `${controlUiBasePath}/approve/{approvalId}` estável.
- Resolução por qualquer interface de controle, aplicativo nativo ou superfície de canal autorizados.
- Comportamento atômico em que a primeira resposta prevalece entre superfícies simultâneas.
- Novas tentativas idênticas são idempotentes; respostas tardias conflitantes não podem substituir a vencedora.
- Tempo limite, vereditos confiáveis malformados, rotas ausentes, cancelamento e reinicialização resultam em bloqueio.
- Eventos de solicitação e terminais chegam à sessão de origem e a todos os proprietários pais/orquestradores relevantes.
- Os canais recebem ações tipadas de aprovação e navegação; os dados de retorno do transporte permanecem privados ao canal.
- Os métodos existentes do Gateway para execução/plugin permanecem compatíveis enquanto sua implementação converge para um único serviço.

## Fora do escopo

- Persistir ou retomar a própria execução bloqueada da ferramenta após a reinicialização do Gateway.
- Transformar um ID ou URL de aprovação em uma credencial ao portador.
- Acrescentar solicitações de aprovação a transcrições visíveis ao modelo ou despertar agentes pais.
- Transferir política de aprovação, comandos do produto ou autorização do revisor para plugins de canal.
- Clonar o estado da aprovação por canal, dispositivo ou ancestral.
- Redesenhar listas de permissões de execução, composição de políticas de plugin ou persistência de `allow-always`, exceto quando necessário para tornar os resultados terminais inequívocos.
- Tornar uma TUI incorporada sem Gateway remotamente acessível no primeiro incremento. Ela permanece somente local e deve resultar em bloqueio quando não houver revisor.

## Linha de base anterior à implantação e mapa de evidências

Esta tabela registra o estado da implementação quando a #103505 foi aberta. As seções de implantação abaixo acompanham o registro durável, as ações tipadas, a página de link profundo e os incrementos do cliente nativo desenvolvidos sobre essa linha de base.

| Superfície           | Ponto de entrada e proprietário da linha de base                                                                                                                                  | Comportamento e lacuna da linha de base                                                                                                                                                                    |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Execução do agente        | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | O registro em duas fases de `exec.approval.*` evita uma condição de corrida antecipada de `/approve`, mas o tempo limite ainda pode se tornar uma permissão por meio de `askFallback`.                                                        |
| Barreira de ferramenta de plugin  | `src/agents/agent-tools.before-tool-call.ts`                                                                                                                    | Solicita `plugin.approval.*`; `timeoutBehavior: "allow"` pode aprovar uma barreira cujo tempo limite expirou. O modo incorporado tem autoridade local ao processo separada em `src/infra/embedded-plugin-approval-broker.ts`. |
| Barreira de nó de plugin  | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                                      | Cria e transmite diretamente por meio do gerenciador de plugins, duplicando parte do ciclo de vida do método de servidor.                                                                                 |
| Autoridade do Gateway | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                   | Gerenciadores separados de execução e plugin usam mapas locais ao processo. As entradas terminais permanecem por 15 segundos. A primeira resposta prevalece somente dentro de um processo.                                          |
| Protocolo do Gateway  | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | A execução tem `get` somente para itens pendentes; o plugin não tem `get`; não existe consulta terminal independente do tipo para um link profundo.                                                                                   |
| Entrega          | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Oferece roteamento de origem, mensagens diretas para aprovadores, repetição de itens pendentes, manipuladores nativos e limpeza terminal dentro do processo. Um acompanhamento separado adiciona reconciliação terminal durável.                          |
| Ações portáveis  | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | Os botões de aprovação são ações de comando que contêm `/approve ...`; os destinos de URL e aplicativo Web são campos de botão não tipados.                                                                           |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | O renderizador analisa o texto do comando para reconhecer a semântica de aprovação antes de produzir dados de retorno privados.                                                                                     |
| Interface de controle        | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | A interface de aprovação é um modal global. `ui/src/app-route-paths.ts` e `ui/src/app-routes.ts` usam rotas exatas e redirecionam caminhos desconhecidos para o Chat.                                                    |
| Propriedade da sessão | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                                 | Já existem propriedades de controlador, solicitante, pai explícito e geração legada, mas os eventos de aprovação não são projetados nesses fluxos de sessão.                                                    |
| Estado compartilhado      | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                         | As transações imediatas existentes e as atualizações condicionais do Kysely permitem comparação e definição duráveis em `state/openclaw.sqlite`.                                                                   |

Os testes atuais representativos incluem `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` e `ui/src/e2e/approval-flow.e2e.test.ts`.

O SDK de plugin permanece o único limite de canal/plugin. As alterações de runtime e apresentação de aprovação devem ser exportadas pelos subcaminhos existentes `src/plugin-sdk/approval-*.ts` e `src/plugin-sdk/interactive-runtime.ts`; o código de produção do plugin não deve importar componentes internos do Gateway.

## Trabalhos anteriores

O Omnigent fornece semânticas úteis de experiência do usuário e falhas:

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) coloca ASK em espera, aplica tempos limite por política e trata somente uma aceitação exata como aprovação.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) contém a barreira do mecanismo nativo no lado do servidor e a projeção de solicitação/resolução dos ancestrais.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) fornece a página móvel independente de aprovação.

Não copie sua alegação sobre armazenamento sem análise crítica. O estado pendente ativo atual é local ao processo em [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py), e a tabela pendente não utilizada é removida por [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py). O OpenClaw deliberadamente vai além: o SQLite é a autoridade e cada transição terminal é uma operação de comparação e definição no banco de dados.

## Arquitetura e propriedade

O Gateway é responsável pelo ciclo de vida:

1. Um agente, hook de plugin ou política de nó fornece uma solicitação específica do tipo e uma vinculação de execução local ao processo.
2. O Gateway a valida e cria uma projeção sanitizada para o revisor.
3. O serviço de aprovação calcula um público de origem/proprietários, insere a linha canônica e depois registra o processo em espera.
4. Após a inserção durável, o Gateway publica os eventos de aprovação existentes, as projeções de sessão, as notificações de canal e o push nativo.
5. Todas as superfícies resolvem por meio do mesmo serviço.
6. O serviço confirma uma transição terminal, desperta o processo em espera do runtime e publica projeções terminais.
7. Uma falha na entrega de eventos nunca reverte a decisão confirmada; os clientes se recuperam por meio de `approval.get` ou da repetição da lista.

Limites de propriedade:

- `src/gateway/`: serviço de aprovação, autorização, adaptadores RPC, construção de URL, ciclo de vida do processo em espera e publicação de eventos.
- `src/state/`: esquema compartilhado e tipos Kysely gerados.
- `src/infra/`: modelos de visualização de aprovação sanitizados e construção de apresentação portátil.
- `src/agents/`: solicita, aguarda e aplica o veredito retornado; sem persistência.
- `src/channels/` e `extensions/*`: renderizam ações tipadas, autorizam usuários do canal, codificam retornos privados e atualizam controles entregues.
- `src/plugin-sdk/`: somente contratos públicos de aprovação e apresentação.
- `ui/`: página independente e clientes existentes de fila/modal.

O processo em espera dentro do processo é um mecanismo de notificação, não uma autoridade. O registro insere a linha e instala o processo em espera de forma síncrona antes de publicar a solicitação, de modo que um resolvedor não possa se intercalar entre essas etapas. Cada resolvedor posterior confirma por meio do SQLite antes de concluir esse processo em espera.

## Registro persistente

Adicione uma tabela `operator_approvals` ao banco de dados de estado compartilhado.

| Coluna                                             | Finalidade                                                                                                                                       |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval_id`                                      | ID canônico globalmente exclusivo. Mantenha os IDs de execução existentes e os IDs `plugin:` para compatibilidade de protocolo, mas nunca infira o tipo pelo prefixo.      |
| `resolution_ref`                                   | Localizador base64url SHA-256 completo e exclusivo para callbacks de transporte que não podem carregar o ID canônico. Não é autorização nem um ID de URL pública. |
| `kind`                                             | Discriminador `exec \| plugin` fechado.                                                                                                        |
| `status`                                           | Estado `pending \| allowed \| denied \| expired \| cancelled` fechado.                                                                          |
| `presentation_json`                                | Projeção do revisor validada e marcada por tipo. Solicitações brutas do runtime, associações de comandos e cargas de callbacks permanecem locais ao processo.               |
| `source_agent_id`, `source_session_key`            | Identidade de origem e âncora da projeção da sessão. A chave de sessão é durável; o UUID rotativo da sessão não é.                                          |
| `audience_session_keys_json`                       | Array JSON ordenado e sem duplicatas, produzido pela travessia de propriedade em largura limitada. Os eventos de solicitação e terminais usam este mesmo snapshot. |
| `requested_by_device_id`, `requested_by_client_id` | Metadados duráveis do solicitante e de auditoria. O ID da conexão permanece na memória e não é um principal entre superfícies.                                         |
| `reviewer_device_ids_json`                         | Dispositivos de revisores explicitamente direcionados opcionais, fornecidos somente pelo runtime confiável de aprovação.                                                  |
| `runtime_epoch`                                    | Época do processo que possui a execução estacionada; usada para cancelar linhas órfãs após a reinicialização.                                                     |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Tempos autoritativos.                                                                                                                         |
| `decision`                                         | Decisão explícita do usuário, quando houver.                                                                                                       |
| `terminal_reason`                                  | Motivo fechado, como `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` ou `gateway-restart`.                                |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Identidade do vencedor e de auditoria mantida no lado do servidor. As projeções do revisor omitem identificadores brutos do resolvedor.                                           |
| `consumed_at_ms`, `consumed_by`                    | Proteção separada contra repetição para `allow-once`; o consumo não deve apagar a decisão registrada.                                                       |

Índices obrigatórios:

| Índice                                      | Finalidade                                                                     |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `(resolution_ref)` exclusivo                  | Rejeita ambiguidade `approval_id`/`resolution_ref` entre colunas durante a inserção. |
| `(status, expires_at_ms)`                  | Localiza aprovações pendentes e reconcilia prazos autoritativos.               |
| `(source_session_key, created_at_ms DESC)` | Reproduz aprovações recentes para uma sessão de origem.                             |
| `(resolved_at_ms)`                         | Remove aprovações terminais retidas de acordo com a política fixa de retenção.  |

Os arrays de público são pequenos e limitados. A reprodução filtrada por sessão primeiro seleciona as linhas pendentes visíveis por meio do Kysely e depois decodifica e filtra os arrays limitados de público no código da aplicação; ela não usa correspondência de strings nem consultas JSON em SQL bruto.

Mantenha as linhas terminais por 30 dias, em conformidade com a retenção de auditoria de metadados em `src/audit/audit-event-store.ts`. A remoção é uma política fixa de manutenção, não uma nova superfície de configuração. O banco de dados é um estado privado e local do plano de controle, mas as APIs do revisor nunca devem expor a solicitação armazenada completa nem a associação do runtime.

## Máquina de estados e comparação e definição

Somente estas transições são válidas:

- `pending -> allowed`: `allow-once` ou `allow-always` explícito.
- `pending -> denied`: negação explícita, veredito terminal malformado confiável ou ausência de rota de entrega.
- `pending -> expired`: prazo autoritativo atingido.
- `pending -> cancelled`: cancelamento da execução, encerramento normal ou recuperação de órfãos após reinicialização.

Todo estado terminal não permitido tem como veredito efetivo a negação.

A resolução usa uma transação SQLite imediata e uma atualização condicional do Kysely equivalente a:

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Se a atualização não afetar nenhuma linha, a mesma transação lê o registro:

- Ausente ou não autorizado: retorne não encontrado; não revele a existência.
- Ainda pendente, mas com o prazo atingido: aplique comparação e definição para `expired` e depois retorne essa linha terminal.
- Mesma decisão registrada: retorne sucesso idempotente com o vencedor registrado.
- Decisão diferente: a API unificada retorna `applied: false` com o vencedor registrado; adaptadores legados mantêm `APPROVAL_ALREADY_RESOLVED` quando exigido pelo contrato já lançado.
- Qualquer estado terminal: nunca o altere.

`now == expires_at_ms` está expirado. O horário do Gateway é autoritativo.

A execução de `allow-once` usa uma segunda CAS sobre `consumed_at_ms IS NULL`, vinculada ao contexto exato existente de comando/execução do sistema. A linha de aprovação permanece como registro de auditoria após o consumo.

Entrada HTTP/RPC malformada que não possa ser autenticada nem identificar uma aprovação é rejeitada sem alteração e nunca pode aprovar. Um veredito terminal malformado recebido de um harness/aguardador confiável para uma aprovação conhecida faz a transição para `denied`.

## API do Gateway

Adicione métodos de revisor independentes de tipo:

| Método                                    | Contrato                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Retorna uma projeção visível pendente ou terminal retida.                                                                                                                                                          |
| `approval.resolve { id, kind, decision }` | Aceita o ID canônico ou uma referência de transporte de tamanho fixo e, em seguida, executa autorização, validação do tipo e da decisão permitida, reconciliação do prazo e CAS terminal. A resposta sempre contém o ID canônico. |

Após uma CAS bem-sucedida, retorne imediatamente a projeção confirmada. Eventos legados, encaminhadores de canais e finalizadores push são ações subsequentes de melhor esforço; uma superfície lenta ou com falha não deve atrasar nem reverter a resposta vencedora.

A validação de solicitações específica do tipo permanece em `exec.approval.request` e `plugin.approval.request`. Os `exec.approval.get/list/waitDecision/resolve` e `plugin.approval.list/waitDecision/resolve` existentes tornam-se adaptadores de limite de protocolo para o serviço canônico porque fazem parte da API do Gateway já lançada. Os chamadores internos migram para o serviço na mesma alteração.

Uma projeção do revisor é uma união discriminada:

```ts
type OperatorApproval = {
  id: string;
  status: OperatorApprovalStatus;
  presentation:
    | { kind: "exec"; commandText: string /* visualização segura da execução */ }
    | { kind: "plugin"; title: string; description: string /* visualização segura do plugin */ };
  // campos comuns do ciclo de vida
};
```

O caminho estável é derivado, não persistido. `approval.get` retorna `urlPath`; superfícies que conhecem uma origem pública aprovada também podem receber um `url` absoluto. Os snapshots do revisor omitem as chaves de sessão de origem e de público. O Gateway mantém essas chaves de roteamento no lado do servidor para a projeção `session.approval` separada.

## Eventos e ações portáveis

O PR 1 preserva os nomes de eventos, as cargas e os filtros existentes de destinatários no nível do registro já lançados:

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Esses eventos legados podem conter a solicitação completa do runtime, portanto não devem ser distribuídos para todos os clientes com escopo de aprovação. O PR 5 adiciona campos de ciclo de vida marcados (`status`, `sourceSessionKey`, `urlPath`, metadados terminais e um `kind` no nível da apresentação) por meio da projeção sanitizada do ciclo de vida, em vez de ampliar a entrega de eventos legados.

Adicione um evento de projeção `session.approval` com escopo de aprovação. Publique o evento canônico uma vez com as chaves de público persistidas; assinantes da sessão exata recebem o mesmo evento para cada chave correspondente:

- `sessionKey`: fluxo que recebe a projeção.
- `sourceSessionKey`: filho/origem que acionou o bloqueio.
- `phase`: `pending \| terminal`, discriminado pelo status da aprovação.
- uma projeção `OperatorApproval` segura.

Os clientes aderem com `sessions.messages.subscribe { key, agentId?, includeApprovals: true }`. A resposta bem-sucedida adiciona um `approvalReplay` contendo até 1.000 aprovações pendentes atuais para essa chave exata de fluxo, que o cliente assinante também está autorizado a revisar no nível do registro. `truncated: false` torna a reprodução filtrada autoritativa, e os clientes que se reconectam substituem seu conjunto local de pendências por ela; `truncated: true` é um sinal de sobrecarga, e os clientes devem manter entradas locais ainda não vistas até que a consulta canônica ou eventos posteriores do ciclo de vida as resolvam. Um timeout durável posterior descoberto durante a reprodução emite marcadores de exclusão terminais somente para públicos inscritos e autorizados no nível do registro antes que o novo snapshot seja retornado. `operator.admin` pode aderir diretamente; clientes com escopo mais restrito exigem tanto uma identidade de dispositivo pareado quanto `operator.approvals`. A assinatura da sessão, por si só, nunca concede visibilidade da aprovação.

Registre o evento em `operator.approvals` dentro de `src/gateway/server-broadcast.ts`. A projeção é observacional: ela nunca adiciona linhas à transcrição, emite `sessions.changed` nem desperta um agente.

Estenda `MessagePresentationAction` em `src/interactive/payload.ts`:

```ts
type MessagePresentationAction =
  | { type: "command"; command: string }
  | { type: "callback"; value: string }
  | {
      type: "approval";
      approvalId: string;
      approvalKind: "exec" | "plugin";
      decision: ExecApprovalDecision;
    }
  | { type: "url"; url: string }
  | { type: "web-app"; url: string };
```

O núcleo cria ações de decisão tipadas e um link separado de Revisão quando uma origem absoluta e aprovada da Control UI está disponível. Os canais codificam uma ação de aprovação em seu próprio formato de callback e enviam a resolução ao serviço canônico. Um callback usa o ID canônico exato quando ele cabe; caso contrário, usa o `resolution_ref` exclusivo de digest completo da linha. A referência é apenas uma chave compacta de consulta: a autenticação normal do Gateway, a autorização do registro, o tipo explícito, a validação das decisões permitidas, a reconciliação do prazo e o CAS da primeira resposta ainda se aplicam. Os canais não devem truncar IDs, resolver prefixos de hash, analisar o texto `/approve` nem inferir o tipo a partir de um prefixo de ID.

Mantenha `button.url`, `button.webApp` e os controles de aprovação baseados em comandos como entradas de compatibilidade obsoletas do SDK de plugins. Normalize-os no limite do SDK; migre todos os chamadores internos incluídos no mesmo PR. `/approve {id} {decision}` continua sendo um fallback de texto e um comando de CLI/chat, não o contrato semântico do botão.

## Control UI

A rota é `${basePath}/approve/{approvalId}`. O ID é o único parâmetro do caminho; a identidade da sessão de origem vem do registro.

Como o roteador atual tem rotas estáticas exatas e reescreve caminhos desconhecidos para o Chat, detecte esse link direto em `ui/src/app/bootstrap.ts` antes da normalização comum da rota. Reutilize a configuração normal de Gateway/autenticação, mas renderize uma página de aprovação independente fora do shell da barra lateral e do modal global.

O documento pertence ao Gateway que forneceu sua URL. Sua conexão inicial ignora a seleção persistida de Gateway remoto do aplicativo completo sem alterar nem copiar as configurações dessa seleção; apenas a autenticação permanece vinculada à sessão no Gateway que forneceu a página. A autenticação nativa confiável ou uma substituição `gatewayUrl` confirmada separadamente pode redirecioná-la. O núcleo reserva o namespace de um segmento `/approve` antes das rotas HTTP de plugins e da detecção de extensões estáticas, incluindo IDs que terminam em `.json` ou `.js`; quando o fornecimento da Control UI está desativado, a rota reservada falha de forma fechada com `404`. Mantenha a página no pacote principal da Control UI para que uma falha em um bloco carregado sob demanda não deixe uma decisão de segurança presa em um indicador de carregamento.

Estados da página:

- carregando
- autenticação necessária
- pendente
- resolvendo
- aprovado ou negado aqui
- resolvido em outro lugar
- expirado
- cancelado
- proibido/não encontrado
- erro de conexão com nova tentativa

A página chama o RPC do Gateway, não uma segunda API REST não autenticada. Uma atualização do navegador relê o estado durável. Ela nunca coloca credenciais do Gateway na URL, na consulta ou no fragmento.

## Autorização e privacidade

A URL é um localizador, não uma autoridade. A resolução exige:

1. conexão autenticada com o Gateway;
2. `operator.approvals` ou `operator.admin`;
3. autorização do revisor no nível do registro.

Regras no nível do registro:

- `operator.admin` pode revisar.
- `reviewer_device_ids` é autoritativo quando presente. Somente um dispositivo
  `operator.approvals` pareado e listado pode revisar; o dispositivo solicitante não tem acesso
  implícito, a menos que também esteja listado.
- Sem uma lista explícita de revisores, o dispositivo solicitante pareado
  `operator.approvals` pode revisar seu próprio registro.
- Registros realmente legados sem vínculo de solicitante ou revisor mantêm ampla
  visibilidade para dispositivos pareados, para que as atualizações não deixem trabalhos já pendentes sem solução.
- Ambientes de execução internos sem dispositivo podem resolver, mas não ler, por meio da conexão
  do ambiente de execução de aprovação com escopo definido. Essa autoridade vem somente do token do ambiente
  de execução autenticado pelo servidor; campos públicos `approval.resolve` não podem
  gerá-lo.
- A propriedade da conexão ativa do solicitante continua válida para adaptadores legados; ela
  nunca é inferida de um nome de cliente correspondente.
- A associação ao público-alvo altera somente a apresentação. Ela nunca amplia a autorização.

`approval.get` expõe somente a projeção sanitizada para revisores e omite chaves internas de roteamento de origem/público-alvo. O evento `session.approval` do PR 5 transporta seu único destino `sessionKey`, além de `sourceSessionKey`, depois que o Gateway aplica no lado do servidor o instantâneo persistido do público-alvo. Os eventos existentes de execução/plugin mantêm sua carga útil histórica e os destinatários restritos até que os consumidores sejam migrados. A solicitação executável, a vinculação do comando e a continuação permanecem apenas no processo local em espera. A linha durável contém a apresentação segura, além dos metadados de ciclo de vida, roteamento e auditoria; ela nunca armazena valores brutos de ambiente, credenciais, cabeçalhos de autenticação nem dados de callback do canal.

## Projeção do público-alvo

Calcule o público-alvo uma única vez antes da inserção e persista o instantâneo ordenado. A propriedade é um grafo, nem sempre uma única cadeia de ascendentes: um filho pode ter tanto um controlador atual quanto um solicitante original, e esses proprietários podem levar a raízes diferentes.

Use uma travessia determinística em largura:

1. Inicialize a fila com a chave da sessão de origem.
2. Para cada chave removida da fila, leia a linha mais recente do registro do subagente e adicione à fila ambas as arestas de propriedade distintas em ordem fixa: `controllerSessionKey` e depois `requesterSessionKey`.
3. Quando existir uma linha de registro utilizável, não siga também a linhagem da entrada de sessão, que pode estar desatualizada após o redirecionamento. Caso contrário, adicione à fila a única aresta de fallback atual `parentSessionKey ?? spawnedBy`.
4. Normalize e remova duplicatas ao adicionar à fila para que o primeiro caminho, o mais curto, prevaleça.
5. Pare em 64 chaves exclusivas; esse limite de tamanho do público-alvo também restringe a profundidade da travessia.

A origem do registro é `src/agents/subagent-registry-read.ts`; os campos de propriedade são definidos em `src/agents/subagent-registry.types.ts`. Os campos de fallback da sessão são definidos em `src/config/sessions/types.ts`.

As projeções solicitada e terminal usam o mesmo público-alvo persistido, mesmo que o foco ou a propriedade do controlador mudem enquanto a aprovação estiver pendente. Isso garante a limpeza terminal para cada fluxo de sessão do público-alvo que recebeu a projeção da solicitação. A resolução sempre tem como destino o ID de aprovação de origem; as sessões do público-alvo nunca recebem estados de aprovação clonados. A limpeza de mensagens encaminhadas do canal continua sendo o acompanhamento separado do localizador de entrega descrito abaixo.

Não grave mensagens de transcrição, injete prompts do sistema, inicie turnos dos proprietários nem emita `sessions.changed` apenas por causa de uma aprovação.

## Convergência das superfícies de entrega

Os manipuladores nativos de aprovação já retêm suas entradas de mensagens entregues por tempo suficiente para substituir ou desativar controles ativos. Atualmente, as mensagens genéricas de aprovação encaminhadas descartam o `MessageReceipt`, portanto uma decisão em outra superfície pode deixar seus controles antigos aparentando estar pendentes. Um acompanhamento separado elimina essa lacuna com uma tabela filha `operator_approval_deliveries` no banco de dados de estado compartilhado.

Cada linha armazena o ID da aprovação, um ID de entrega exclusivo, o canal/a conta/a rota exata, um localizador privado de mensagens do canal, limitado e validado como JSON, os carimbos de data/hora da entrega e o estado de terminalização. Ela nunca armazena dados de callback, tokens de decisão nem solicitações brutas de aprovação. O canal é responsável pela codificação do localizador e pela alteração da mensagem; o núcleo é responsável pelo status canônico, pela seleção do destino, pela política de novas tentativas e pelo texto terminal de fallback.

O registro da entrega e a resolução terminal lidam com concorrência de forma segura:

1. Depois que o envio pendente retorna seu recibo, insira o localizador de entrega e leia o status da aprovação pai em uma única transação.
2. Se o pai já estiver em estado terminal, agende a terminalização imediata em vez de deixar a entrega tardia pendente.
3. Cada transição terminal confirmada agenda separadamente todas as linhas de entrega não finalizadas; broadcasts descartáveis não são o gatilho.
4. Um terminalizador de canal informa `replaced`, `retired` ou `unsupported`. A substituição suprime uma mensagem terminal duplicada; a desativação envia o acompanhamento terminal existente; a falta de suporte ou uma falha recorre ao fallback sem reverter o CAS da aprovação.
5. Na inicialização, há novas tentativas para aprovações terminais com entregas não concluídas, tornando a limpeza resiliente à reinicialização do Gateway.

Esse ciclo de vida do transporte é um hook opcional do adaptador de entrega, não um renderizador nem uma ação de mensagem voltada ao modelo. As mensagens individuais/de grupo do QQ atualmente não têm API de edição, exclusão nem limpeza do teclado; esse adaptador continua sem suporte e só pode exibir a verdade canônica após um clique posterior, até que o transporte obtenha uma API de alteração.

## Semântica de reinicialização, tempo limite e rota

A persistência em SQLite não implica a retomada da execução. As vinculações de comandos/ferramentas permanecem na memória porque podem conter fatos de ambiente de execução sensíveis à segurança e não constituem um contrato de trabalho retomável.

Na inicialização do Gateway:

- gere uma nova época do ambiente de execução;
- faça a transição atômica das linhas pendentes de épocas anteriores para `cancelled`, com o motivo `gateway-restart`;
- mantenha as linhas para que suas URLs expliquem o que aconteceu;
- nunca execute uma aprovação posterior contra uma vinculação ausente do ambiente de execução.

Os temporizadores são otimizações para despertar. A autoridade sobre o prazo é armazenada em `expires_at_ms`; leituras, esperas e resoluções executam a reconciliação da expiração.

Comportamento estrito final:

- tempo limite -> `expired`, negar;
- sem rota -> `denied`, negar;
- interrupção da execução -> `cancelled`, negar;
- veredito confiável malformado -> `denied`, negar;
- somente uma decisão explícita e permitida de autorizar -> `allowed`.

O comportamento de execução fornecido atualmente ainda entra em conflito com este contrato:

- `src/agents/bash-tools.exec-host-shared.ts` pode aplicar `askFallback`.
- `docs/tools/exec-approvals.md` e `docs/cli/approvals.md` documentam essa superfície.

As aprovações de plugins agora falham de forma fechada em casos de tempo limite e vereditos malformados; o campo legado
`timeoutBehavior` continua sendo aceito, mas é ignorado. O acompanhamento da semântica estrita
da execução deve atualizar código, tipos, documentação, testes e changelog em conjunto, com
revisão explícita dos responsáveis/de segurança. `askFallback` pode continuar descrevendo
a seleção de políticas anterior ao bloqueio durante a migração, mas não deve transformar em aprovação
o tempo limite de um registro pendente já criado.

## Plano de compatibilidade

- Protocolo aditivo do Gateway; sem incremento da versão do protocolo.
- Preserve os métodos e eventos existentes de execução/plugin no limite externo.
- Mantenha os IDs existentes, incluindo os prefixos `plugin:`, mas deixe de usar prefixos como informações de tipo.
- Mantenha o comportamento do comando de texto `/approve`.
- Mantenha os campos legados de URL/Web App dos botões e as ações de comando como entrada de compatibilidade do SDK de plugins; a nova saída do núcleo é tipada.
- Migre todos os canais incluídos e chamadores internos na mesma alteração de ações tipadas.
- Adicione uma entrada ao changelog para a nova URL/página e para a alteração posterior do comportamento de tempo limite.
- Não adicione uma configuração de modo de elicitação.

## Implantação

### PR 1: ciclo de vida durável

- Esta nota de design.
- Esquema SQLite compartilhado, geração do Kysely, armazenamento e remoção após 30 dias.
- Serviço de aprovação do Gateway, ponte do ambiente de execução em espera e tratamento de órfãos na reinicialização.
- `approval.get/resolve` unificado.
- Adaptadores de métodos de execução/plugin.
- Testes de prevalência da primeira resposta, idempotência, expiração, autorização e consumo.
- Ainda sem alterações no comportamento da UI ou dos canais.

### PR 2: ações tipadas e callbacks de canais

- Ações tipadas de aprovação, URL e Web App.
- Construtores de apresentação do núcleo e exportações do SDK de plugins.
- Codificação de callback privada do transporte com tipo de proprietário explícito.
- Referências duráveis de tamanho fixo para callbacks de IDs canônicos que excedem os limites do transporte.
- Migração dos canais incluídos para eliminar a inferência baseada no texto do comando e no ID de aprovação.
- Estado canônico da primeira resposta na superfície clicada e atualizações de terminal nativo ativo em regime de melhor esforço; a terminalização durável das mensagens de canal permanece como trabalho futuro.
- Testes do SDK e dos canais incluídos.

### PR 3: link direto da UI de Controle

- Página de aprovação autenticada independente e roteamento de inicialização que considera o caminho base.
- Vinculação ao Gateway em serviço sem alterar a seleção remota salva pelo operador.
- Namespace HTTP de aprovação pertencente ao núcleo, incluindo IDs semelhantes a ativos.
- Payload de URL gerado pelo Gateway e sondagem do estado pendente até que os eventos de ciclo de vida sejam disponibilizados.
- Comprovação de largura para dispositivos móveis, reconexão, respostas concorrentes, recarregamento e caminho montado.

### PR 4: clientes nativos

- As superfícies de revisão do iOS e Android usam `approval.get/resolve` com reconhecimento de tipo; o watchOS retransmite prompts e decisões seguros para o revisor por meio do iPhone emparelhado.
- O Watch oferece as decisões de execução compatíveis com seu contrato compacto de retransmissão: permitir uma vez e negar.
- O estado terminal canônico da primeira resposta substitui o estado local da tentativa de decisão.
- Confirmações de resolução perdidas ou ambíguas bloqueiam os controles até a releitura canônica.
- As instâncias anteriores disponibilizadas do Gateway v4 mantêm a revisão de execução por meio de um fallback restrito para o método legado; o estado terminal preservado entre superfícies exige os métodos unificados.
- Os avisos ao revisor e o contexto do proprietário permanecem visíveis no iPhone, Watch e Android.
- Comprovação nativa de unidades, compilação e plataforma.

### PR 5: propagação do ciclo de vida para ancestrais

- Entrega pendente/terminal de `session.approval` com base no snapshot de público persistido no PR 1.
- Assinatura da sessão exata, repetição após reconexão e tombstones terminais sem alteração da transcrição nem ativação do agente.
- Os callbacks de ciclo de vida são executados após a inserção/CAS durável e nunca se tornam autoridade de aprovação.
- Comprovação de subagentes aninhados e reconexão.

### PR 6: comportamento de falha fechada

- Migrar `node-invoke-plugin-policy.ts` e o broker de plugins incorporado para eliminar a autoridade duplicada.
- Semântica estrita de tempo limite, dados malformados, ausência de rota, vinculação e consumo de permissão única.
- Descontinuar as configurações permissivas de tempo limite disponibilizadas sem respeitá-las após uma solicitação ficar pendente.
- Comprovação de contenção entre várias superfícies e injeção de falhas.

### Trabalho futuro: limpeza durável de mensagens remotas

- Persistir os localizadores de entrega encaminhada e terminalizar cada mensagem de canal entregue após a reinicialização.
- Manter esse ciclo de vida do transporte separado da autoridade canônica de aprovação e das ações tipadas de apresentação.

## Testes

Cobertura específica obrigatória:

- A reabertura do SQLite preserva as projeções pendentes e terminais.
- Dois resolvedores simultâneos produzem exatamente um vencedor do CAS.
- A repetição da mesma decisão é bem-sucedida de forma idempotente; uma repetição conflitante retorna o vencedor registrado.
- A resolução no prazo final ou depois dele não pode aprovar.
- `allow-once` pode ser consumido exatamente uma vez sem apagar o estado terminal de auditoria.
- A inicialização cancela épocas de runtime mais antigas.
- A consulta e a resolução não autorizadas não revelam a existência do registro.
- Lista explícita de revisores permitidos e comportamento geral de `operator.approvals` emparelhado.
- Os métodos legados de execução e de plugins compartilham o mesmo armazenamento.
- Esquemas de solicitação/listagem/obtenção/resolução do Gateway e payloads de eventos aditivos.
- Normalização de ações tipadas, renderização de fallback, exportações do SDK e alternâncias dos canais incluídos.
- A codificação de callback do Telegram contém dados privados do transporte e nenhuma inferência baseada em string de comando.
- Filho direto, proprietários ramificados de controlador/solicitante, proprietários aninhados, reatribuição, fallback do campo de sessão, ciclo e limite de tamanho do público.
- As matrizes de público solicitado e terminal são idênticas.
- As projeções do proprietário não causam alteração da transcrição nem ativação do agente.
- A rota da UI de Controle funciona em `/` e em um caminho base configurado; a atualização da página mostra o estado pendente ou terminal verdadeiro.
- Respostas simultâneas na UI de Controle e no Telegram mostram um vencedor e "resolvido em outro lugar" para o perdedor.
- Os identificadores de aprovação nativos e os identificadores de proprietário do Gateway preservam exatamente os bytes UTF-8 durante o roteamento e a reconciliação.
- A negociação da família de RPC nativa fixa uma família canônica ou legada por rota admitida do Gateway e nunca faz downgrade silencioso após o uso.
- Confirmações de resolução nativas perdidas bloqueiam as ações até a releitura canônica; uma releitura malsucedida não pode inventar um vencedor nem confirmar uma atualização do Watch.
- A correlação da solicitação de snapshot do Watch é aceita somente para o proprietário exato do Gateway emparelhado e após a conclusão de uma releitura canônica no iPhone.
- Comprovação do fluxo do usuário pelo Testbox/Crabbox, incluindo uma página de aprovação com largura para dispositivos móveis, limpeza de ações do Telegram e um ciclo completo de pendência/resolução/perdedor tardio no Android, iPhone e Watch.

## Observabilidade

Emita logs de transição estruturados e sem conteúdo, com ID de aprovação, tipo, chave da sessão de origem, status, motivo e latência. Nunca registre a prévia nem a vinculação bruta.

Acompanhe:

- contagem de solicitações por tipo;
- contagem de estados terminais por tipo/status/motivo;
- medidor de pendências;
- latência entre solicitação e estado terminal;
- resultados de corrida de resolução: vencedor, repetição idempotente, conflito, expirado;
- contagem de rotas de entrega e negações por ausência de rota;
- cancelamentos de órfãos na inicialização;
- tamanho do público.

Uma transição confirmada é considerada bem-sucedida mesmo que a entrega posterior do evento falhe. Os assinantes do ciclo de vida se recuperam por meio da repetição do PR 5 e da consulta canônica. A terminalização durável das mensagens de canal permanece como o trabalho futuro separado descrito acima.

## Decisões em aberto

1. **Origem externamente acessível da UI de Controle.** Cada snapshot carrega o `urlPath` relativo estável. Uma URL absoluta só pode ser anunciada a partir de um local armazenado em cache do Tailscale Serve/Funnel depois que a exposição do Gateway for bem-sucedida; `allowedOrigins`, cabeçalhos Host da solicitação, `gateway.remote.url` e candidatos de loopback/LAN apenas para exibição não são origens canônicas. O Telegram pode usar seu wrapper autenticado de Mini App para preservar o caminho de aprovação durante a inicialização. Proxies reversos arbitrários permanecem apenas relativos até que exista um contrato explícito de URL pública revisado separadamente. Nunca permita que um canal tente adivinhar a origem.
2. **Transição de compatibilidade para o tempo limite estrito de execução.** Os tempos limite de aprovação de plugins agora falham de forma fechada, e `timeoutBehavior` foi descontinuado. O contrato disponibilizado restante de `askFallback` exige revisão explícita do proprietário e de segurança, changelog, documentação e uma decisão de migração/descontinuação antes de deixar de autorizar a execução quando uma solicitação pendente atinge o tempo limite.
3. **Modo incorporado sem Gateway.** Recomendação: inicialmente, mantê-lo apenas local e, depois, torná-lo cliente do serviço canônico quando houver um Gateway. Não anuncie um link direto que nenhum servidor possa resolver.
