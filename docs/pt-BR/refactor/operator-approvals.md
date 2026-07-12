---
read_when:
    - Alteração do ciclo de vida, armazenamento, protocolo ou autorização de aprovações de exec ou Plugin
    - Adição de links de aprovação ou controles nativos de aprovação a um canal
    - Projetando aprovações de sessões filhas nas visualizações da sessão pai ou do orquestrador
summary: Design para aprovações duráveis e acessíveis por links diretos na interface de controle, em aplicativos nativos, canais e sessões principais
title: Aprovações de operadores em múltiplas superfícies
x-i18n:
    generated_at: "2026-07-12T15:35:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 3f3dfc5d503d46bfc7a5eb94960baf2a81216ac973ef1bb1e6a0ef63f0bec6d5
    source_path: refactor/operator-approvals.md
    workflow: 16
---

# Aprovações de operadores em múltiplas superfícies

Este design acompanha a [#103505](https://github.com/openclaw/openclaw/issues/103505). Ele substitui a autoridade de aprovação local ao processo por um único ciclo de vida pertencente ao Gateway e respaldado por SQLite. Cada aprovação de execução ou de plugin/ferramenta pertencente ao Gateway recebe um ID estável, uma rota autenticada da IU de Controle, resolução atômica em que a primeira resposta vence e projeções visíveis somente para operadores nos fluxos de sua sessão de origem e de suas sessões ancestrais.

Ações embutidas e links profundos coexistem. Não há alternância de modo de aprovação.

## Objetivos

- Um objeto de aprovação durável para bloqueios de execução e de plugin/ferramenta.
- Rota estável `${controlUiBasePath}/approve/{approvalId}`.
- Resolução por qualquer IU de Controle autorizada, aplicativo nativo ou superfície de canal.
- Comportamento atômico em que a primeira resposta vence entre superfícies simultâneas.
- Novas tentativas idênticas são idempotentes; respostas tardias conflitantes não podem sobrescrever a vencedora.
- Tempos limite, vereditos confiáveis malformados, rotas ausentes, cancelamentos e reinicializações falham de modo fechado.
- Eventos de solicitação e terminais chegam à sessão de origem e a todos os proprietários pais/orquestradores relevantes.
- Os canais recebem ações tipadas de aprovação e navegação; os dados de callback do transporte permanecem privados ao canal.
- Os métodos existentes do Gateway para execução/plugin permanecem compatíveis enquanto sua implementação converge para um único serviço.

## Fora do escopo

- Persistir ou retomar a própria execução bloqueada da ferramenta após a reinicialização do Gateway.
- Tornar um ID ou URL de aprovação uma credencial ao portador.
- Anexar solicitações de aprovação a transcrições visíveis ao modelo ou despertar agentes pais.
- Transferir a política de aprovação, os comandos do produto ou a autorização de revisores para plugins de canal.
- Clonar o estado de aprovação por canal, dispositivo ou ancestral.
- Redesenhar listas de permissões de execução, a composição de políticas de plugins ou a persistência de `allow-always`, exceto quando necessário para tornar inequívocos os resultados terminais.
- Tornar uma TUI incorporada sem Gateway acessível remotamente no primeiro incremento. Ela permanece somente local e deve falhar de modo fechado quando não houver revisor.

## Linha de base anterior à implantação e mapa de evidências

Esta tabela registra o estado da implementação quando a #103505 foi aberta. As seções de implantação abaixo acompanham o registro durável, as ações tipadas, a página de link profundo e os incrementos de clientes nativos desenvolvidos sobre essa linha de base.

| Superfície        | Ponto de entrada e proprietário na linha de base                                                                                                               | Comportamento e lacuna na linha de base                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Execução do agente | `src/agents/bash-tools.exec-approval-request.ts`, `src/agents/bash-tools.exec-host-shared.ts`                                                                   | O registro em duas fases de `exec.approval.*` evita uma condição de corrida antecipada de `/approve`, mas o tempo limite ainda pode resultar em permissão por meio de `askFallback`.           |
| Bloqueio de ferramenta de plugin | `src/agents/agent-tools.before-tool-call.ts`                                                                                                         | Solicita `plugin.approval.*`; `timeoutBehavior: "allow"` pode aprovar um bloqueio cujo tempo limite expirou. O modo incorporado tem autoridade separada e local ao processo em `src/infra/embedded-plugin-approval-broker.ts`. |
| Bloqueio de Node de plugin | `src/gateway/node-invoke-plugin-policy.ts`                                                                                                              | Cria e transmite diretamente pelo gerenciador de plugins, duplicando parte do ciclo de vida do método do servidor.                                                                           |
| Autoridade do Gateway | `src/gateway/server-aux-handlers.ts`, `src/gateway/exec-approval-manager.ts`, `src/gateway/server-methods/approval-shared.ts`                                | Gerenciadores separados de execução e plugin usam mapas locais ao processo. Entradas terminais persistem por 15 segundos. A primeira resposta vence somente dentro de um processo.           |
| Protocolo do Gateway | `packages/gateway-protocol/src/schema/exec-approvals.ts`, `packages/gateway-protocol/src/schema/plugin-approvals.ts`, `src/gateway/methods/core-descriptors.ts` | A execução tem um `get` somente para pendentes; o plugin não tem `get`; não existe consulta terminal independente de tipo para um link profundo.                                              |
| Entrega           | `src/infra/exec-approval-channel-runtime.ts`, `src/infra/approval-native-runtime.ts`, `src/infra/approval-handler-runtime.ts`                                   | Oferece roteamento de origem, mensagens diretas para aprovadores, reprodução de pendências, manipuladores nativos e limpeza terminal no processo. Um acompanhamento separado adiciona reconciliação terminal durável. |
| Ações portáveis   | `src/interactive/payload.ts`, `src/plugin-sdk/interactive-runtime.ts`, `src/plugin-sdk/approval-reply-runtime.ts`                                               | Os botões de aprovação são ações de comando que contêm `/approve ...`; destinos de URL e de Aplicativo Web são campos de botão não tipados.                                                   |
| Telegram          | `extensions/telegram/src/approval-handler.runtime.ts`, `extensions/telegram/src/button-types.ts`                                                                | O renderizador analisa o texto do comando para reconhecer a semântica de aprovação antes de produzir dados de callback privados.                                                             |
| IU de Controle    | `ui/src/app/exec-approval.ts`, `ui/src/app/overlays.ts`, `ui/src/components/exec-approval.ts`                                                                   | A IU de aprovação é uma caixa de diálogo modal global. `ui/src/app-route-paths.ts` e `ui/src/app-routes.ts` usam rotas exatas e redirecionam caminhos desconhecidos para o Chat.              |
| Propriedade da sessão | `src/agents/subagent-registry.types.ts`, `src/agents/subagent-registry-read.ts`, `src/config/sessions/types.ts`                                             | Já existem propriedades de controlador, solicitante, pai explícito e geração legada, mas os eventos de aprovação não são projetados para esses fluxos de sessão.                             |
| Estado compartilhado | `src/state/openclaw-state-schema.sql`, `src/state/openclaw-state-db.ts`                                                                                      | Transações imediatas existentes e atualizações condicionais do Kysely permitem comparação e troca durável em `state/openclaw.sqlite`.                                                        |

Os testes atuais representativos incluem `src/gateway/exec-approval-manager.test.ts`, `src/gateway/server-methods/approval-shared.test.ts`, `src/agents/bash-tools.exec-gateway-approval.e2e.test.ts`, `extensions/telegram/src/approval-handler.runtime.test.ts` e `ui/src/e2e/approval-flow.e2e.test.ts`.

O SDK de plugins continua sendo a única fronteira de canais/plugins. As alterações no runtime e na apresentação de aprovações devem ser exportadas pelos subcaminhos existentes `src/plugin-sdk/approval-*.ts` e `src/plugin-sdk/interactive-runtime.ts`; o código de produção dos plugins não deve importar componentes internos do Gateway.

## Trabalhos anteriores

O Omnigent fornece semânticas úteis de UX e falha:

- [`approval.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/runtime/policies/approval.py) coloca ASK em espera, aplica tempos limite por política e trata somente uma aceitação exata como aprovação.
- [`sessions.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/routes/sessions.py) contém o bloqueio do harness nativo no lado do servidor e a projeção ancestral de solicitação/resolução.
- [`ApprovePage.tsx`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/web/src/pages/ApprovePage.tsx) fornece a página independente de aprovação móvel.

Não copie sem análise sua alegação sobre armazenamento. O estado pendente ativo atual é local ao processo em [`_elicitation_registry.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/server/_elicitation_registry.py), e a tabela de pendências não utilizada é removida por [`e3b1f2a4c9d7_drop_pending_tool_calls_table.py`](https://github.com/omnigent-ai/omnigent/blob/46e3cd9754c3b8567f7b09f4d19b6249dabe0e80/omnigent/db/migrations/versions/e3b1f2a4c9d7_drop_pending_tool_calls_table.py). O OpenClaw vai deliberadamente além: o SQLite é a fonte de autoridade e cada transição terminal é uma operação de comparação e troca no banco de dados.

## Arquitetura e propriedade

O Gateway é proprietário do ciclo de vida:

1. Um agente, hook de plugin ou política de Node fornece uma solicitação específica do tipo e um vínculo de execução local ao processo.
2. O Gateway a valida e cria uma projeção sanitizada para o revisor.
3. O serviço de aprovação calcula um público de origem/proprietários, insere a linha canônica e então registra o aguardador no processo.
4. Após a inserção durável, o Gateway publica os eventos de aprovação existentes, as projeções de sessão, as notificações de canal e o push nativo.
5. Todas as superfícies resolvem por meio do mesmo serviço.
6. O serviço confirma uma transição terminal, desperta o aguardador do runtime e publica projeções terminais.
7. Uma falha na entrega de eventos nunca reverte a decisão confirmada; os clientes se recuperam por meio de `approval.get` ou da reprodução da lista.

Limites de propriedade:

- `src/gateway/`: serviço de aprovação, autorização, adaptadores RPC, construção de URLs, ciclo de vida do aguardador e publicação de eventos.
- `src/state/`: esquema compartilhado e tipos Kysely gerados.
- `src/infra/`: modelos de visualização de aprovação sanitizados e construção de apresentações portáveis.
- `src/agents/`: solicitam, aguardam e aplicam o veredito retornado; sem persistência.
- `src/channels/` e `extensions/*`: renderizam ações tipadas, autorizam usuários do canal, codificam callbacks privados e atualizam controles entregues.
- `src/plugin-sdk/`: somente contratos públicos de aprovação e apresentação.
- `ui/`: página independente e clientes existentes de fila/modal.

O aguardador no processo é um mecanismo de notificação, não uma autoridade. O registro insere a linha e instala o aguardador de forma síncrona antes de publicar a solicitação, portanto um resolvedor não pode se intercalar entre essas etapas. Todos os resolvedores posteriores confirmam por meio do SQLite antes de concluir esse aguardador.

## Registro persistente

Adicione uma única tabela `operator_approvals` ao banco de dados de estado compartilhado.

| Coluna                                             | Finalidade                                                                                                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `approval_id`                                      | ID canônico globalmente exclusivo. Mantenha os IDs de execução existentes e os IDs `plugin:` para compatibilidade de protocolo, mas nunca infira o tipo pelo prefixo. |
| `resolution_ref`                                   | Localizador base64url SHA-256 completo e exclusivo para callbacks de transporte que não podem carregar o ID canônico. Não é uma autorização nem um ID de URL pública. |
| `kind`                                             | Discriminador fechado `exec \| plugin`.                                                                                                          |
| `status`                                           | Estado fechado `pending \| allowed \| denied \| expired \| cancelled`.                                                                           |
| `presentation_json`                                | Projeção para revisores validada e marcada por tipo. Solicitações brutas do runtime, vínculos de comandos e payloads de callbacks permanecem locais ao processo. |
| `source_agent_id`, `source_session_key`            | Âncora de identidade de origem e projeção da sessão. A chave de sessão é durável; o UUID rotativo da sessão não é.                               |
| `audience_session_keys_json`                       | Array JSON ordenado e sem duplicatas produzido pela busca em largura limitada de propriedade. Os eventos solicitados e terminais usam esse mesmo snapshot. |
| `requested_by_device_id`, `requested_by_client_id` | Metadados duráveis do solicitante e de auditoria. O ID da conexão permanece na memória e não é um principal entre superfícies.                   |
| `reviewer_device_ids_json`                         | Dispositivos de revisores explicitamente direcionados, opcionais e fornecidos somente pelo runtime confiável de aprovação.                       |
| `runtime_epoch`                                    | Época do processo que controla a execução estacionada; usada para cancelar linhas órfãs após a reinicialização.                                  |
| `created_at_ms`, `expires_at_ms`, `updated_at_ms`  | Temporização autoritativa.                                                                                                                       |
| `decision`                                         | Decisão explícita do usuário, quando houver.                                                                                                     |
| `terminal_reason`                                  | Motivo fechado, como `user`, `timeout`, `malformed-verdict`, `no-route`, `run-aborted` ou `gateway-restart`.                                     |
| `resolved_at_ms`, `resolver_kind`, `resolver_id`   | Identidade do vencedor e de auditoria mantida no servidor. As projeções para revisores omitem os identificadores brutos do responsável pela resolução. |
| `consumed_at_ms`, `consumed_by`                    | Proteção separada contra repetição para `allow-once`; o consumo não deve apagar a decisão registrada.                                            |

Índices obrigatórios:

- exclusivo `(resolution_ref)`; as inserções também rejeitam ambiguidade entre as colunas `approval_id`/`resolution_ref`
- `(status, expires_at_ms)`
- `(source_session_key, created_at_ms DESC)`
- `(resolved_at_ms)` para remoção por retenção

Os arrays de público são pequenos e limitados. A repetição filtrada por sessão primeiro seleciona as linhas pendentes visíveis por meio do Kysely e, em seguida, decodifica e filtra os arrays limitados de público no código da aplicação; ela não usa correspondência de strings nem consultas JSON com SQL bruto.

Mantenha as linhas terminais por 30 dias, em conformidade com a retenção de auditoria de metadados em `src/audit/audit-event-store.ts`. A remoção é uma política fixa de manutenção, não uma nova superfície de configuração. O banco de dados é um estado privado do plano de controle local, mas as APIs de revisores nunca devem expor a solicitação armazenada completa nem o vínculo do runtime.

## Máquina de estados e comparação e definição

Somente estas transições são válidas:

- `pending -> allowed`: `allow-once` ou `allow-always` explícito.
- `pending -> denied`: negação explícita, veredito terminal malformado confiável ou ausência de rota de entrega.
- `pending -> expired`: prazo autoritativo atingido.
- `pending -> cancelled`: interrupção da execução, encerramento normal ou recuperação de órfãos após reinicialização.

Todo estado terminal que não seja permitido tem como veredito efetivo a negação.

A resolução usa uma transação SQLite imediata e uma atualização condicional do Kysely equivalente a:

```sql
UPDATE operator_approvals
SET status = ?, decision = ?, terminal_reason = ?, resolved_at_ms = ?
WHERE approval_id = ?
  AND status = 'pending'
  AND expires_at_ms > ?;
```

Se a atualização não afetar nenhuma linha, a mesma transação lê o registro:

- Ausente ou não autorizado: retornar não encontrado; não revelar a existência.
- Ainda pendente, mas com o prazo atingido: usar comparação e definição para alterá-lo para `expired` e, em seguida, retornar essa linha terminal.
- Mesma decisão registrada: retornar sucesso idempotente com o vencedor registrado.
- Decisão diferente: a API unificada retorna `applied: false` com o vencedor registrado; os adaptadores legados mantêm `APPROVAL_ALREADY_RESOLVED` quando exigido pelo contrato publicado correspondente.
- Qualquer estado terminal: nunca modificá-lo.

`now == expires_at_ms` significa expirado. O horário do Gateway é autoritativo.

A execução de `allow-once` usa uma segunda CAS sobre `consumed_at_ms IS NULL`, vinculada ao contexto existente e exato do comando/execução do sistema. A linha de aprovação permanece como registro de auditoria após o consumo.

Entradas HTTP/RPC malformadas que não possam ser autenticadas nem identificar uma aprovação são rejeitadas sem alteração e nunca podem aprovar. Um veredito terminal malformado recebido de um harness/aguardador confiável para uma aprovação conhecida faz a transição para `denied`.

## API do Gateway

Adicione métodos de revisão independentes de tipo:

| Método                                    | Contrato                                                                                                                                                                                                            |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approval.get { id }`                     | Retorna uma projeção pendente visível ou terminal retida.                                                                                                                                                           |
| `approval.resolve { id, kind, decision }` | Aceita o ID canônico ou uma referência de transporte de tamanho fixo e, em seguida, executa autorização, validação de tipo e decisão permitida, reconciliação de prazo e CAS terminal. A resposta sempre inclui o ID canônico. |

Após uma CAS bem-sucedida, retorne imediatamente a projeção confirmada. Eventos legados, encaminhadores de canal e finalizadores de push são acompanhamentos de melhor esforço; uma superfície lenta ou com falha não deve atrasar nem reverter a resposta vencedora.

A validação de solicitação específica do tipo permanece em `exec.approval.request` e `plugin.approval.request`. Os métodos existentes `exec.approval.get/list/waitDecision/resolve` e `plugin.approval.list/waitDecision/resolve` tornam-se adaptadores de limite de protocolo para o serviço canônico, pois fazem parte da API publicada do Gateway. Os chamadores internos migram para o serviço na mesma alteração.

Uma projeção para revisores é uma união marcada:

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

O caminho estável é derivado, não persistido. `approval.get` retorna `urlPath`; superfícies que conhecem uma origem pública aprovada também podem receber uma `url` absoluta. Os snapshots dos revisores omitem as chaves de sessão de origem e de público. O Gateway mantém essas chaves de roteamento no servidor para a projeção separada `session.approval`.

## Eventos e ações portáteis

O PR 1 preserva os nomes de eventos publicados, os payloads e os filtros existentes de destinatários no nível do registro:

- `exec.approval.requested`
- `exec.approval.resolved`
- `plugin.approval.requested`
- `plugin.approval.resolved`

Esses eventos legados podem conter a solicitação completa do runtime, portanto não devem ser distribuídos para todos os clientes com escopo de aprovação. O PR 5 adiciona campos marcados do ciclo de vida (`status`, `sourceSessionKey`, `urlPath`, metadados terminais e um `kind` no nível da apresentação) por meio da projeção sanitizada do ciclo de vida, em vez de ampliar a entrega de eventos legados.

Adicione um evento de projeção `session.approval` com escopo de aprovação. Publique o evento canônico uma vez com as chaves de público persistidas; assinantes de sessão exata recebem o mesmo evento para cada chave correspondente:

- `sessionKey`: fluxo que recebe a projeção.
- `sourceSessionKey`: filho/origem que acionou o bloqueio.
- `phase`: `pending \| terminal`, discriminada em relação ao status da aprovação.
- uma projeção segura de `OperatorApproval`.

Os clientes aderem com `sessions.messages.subscribe { key, agentId?, includeApprovals: true }`. A resposta bem-sucedida adiciona uma `approvalReplay` contendo até 1.000 aprovações pendentes atuais para essa chave de fluxo exata que o cliente assinante também está autorizado, no nível do registro, a revisar. `truncated: false` torna a repetição filtrada autoritativa, e os clientes que se reconectam substituem seu conjunto local pendente por ela; `truncated: true` é um sinal de sobrecarga, e os clientes devem manter as entradas locais ainda não vistas até que a consulta canônica ou eventos posteriores do ciclo de vida as resolvam. Um timeout durável posterior descoberto durante a repetição emite lápides terminais somente para públicos assinantes e autorizados no nível do registro antes que o novo snapshot seja retornado. `operator.admin` pode aderir diretamente; clientes mais restritos exigem tanto uma identidade de dispositivo pareado quanto `operator.approvals`. A assinatura de sessão por si só nunca concede visibilidade de aprovação.

Registre o evento em `operator.approvals` em `src/gateway/server-broadcast.ts`. A projeção é observacional: nunca adiciona linhas à transcrição, emite `sessions.changed` nem desperta um agente.

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

O núcleo cria ações de decisão tipadas e um link separado de Revisão quando uma origem absoluta aprovada da Control UI está disponível. Os canais codificam uma ação de aprovação em seu próprio formato de callback e enviam a resolução ao serviço canônico. Um callback usa o ID canônico exato quando ele couber; caso contrário, usa o `resolution_ref` de digest completo exclusivo da linha. A referência é apenas uma chave compacta de consulta: a autenticação normal do Gateway, a autorização no nível do registro, o tipo explícito, a validação de decisão permitida, a reconciliação de prazo e a CAS de primeira resposta ainda se aplicam. Os canais não devem truncar IDs, resolver prefixos de hash, analisar o texto `/approve` nem inferir o tipo por um prefixo do ID.

Mantenha `button.url`, `button.webApp` e controles de aprovação baseados em comandos como entradas de compatibilidade obsoletas do SDK de plugins. Normalize-os no limite do SDK; migre todos os chamadores internos incluídos no mesmo PR. `/approve {id} {decision}` permanece como alternativa textual e comando de CLI/chat, não como contrato semântico de botão.

## Control UI

A rota é `${basePath}/approve/{approvalId}`. O ID é o único parâmetro do caminho; a identidade da sessão de origem vem do registro.

Como o roteador atual tem rotas estáticas exatas e reescreve caminhos desconhecidos para o Chat, detecte esse link direto em `ui/src/app/bootstrap.ts` antes da normalização de rota padrão. Reutilize a configuração normal do Gateway e da autenticação, mas renderize uma página de aprovação independente, fora da estrutura da barra lateral e do modal global.

O documento pertence ao Gateway que serviu sua URL. Sua conexão inicial ignora a seleção persistida de Gateway remoto do aplicativo completo, sem alterar nem copiar as configurações dessa seleção; apenas a autenticação permanece vinculada à sessão do Gateway que o está servindo. A autenticação nativa confiável ou uma substituição de `gatewayUrl` confirmada separadamente pode redirecioná-lo. O núcleo reserva o namespace de um segmento `/approve` antes das rotas HTTP de plugins e da detecção de extensões estáticas, incluindo IDs que terminem em `.json` ou `.js`; quando o fornecimento da Control UI está desabilitado, a rota reservada falha de forma segura com `404`. Mantenha a página no pacote principal da Control UI para que uma falha em um chunk carregado sob demanda não deixe uma decisão de segurança presa em um indicador de carregamento.

Estados da página:

- carregando
- autenticação obrigatória
- pendente
- resolvendo
- aprovado ou negado aqui
- resolvido em outro lugar
- expirado
- cancelado
- proibido/não encontrado
- erro de conexão com nova tentativa

A página chama o RPC do Gateway, não uma segunda API REST não autenticada. Atualizar o navegador relê o estado durável. Ela nunca coloca credenciais do Gateway na URL, na consulta nem no fragmento.

## Autorização e privacidade

A URL é um localizador, não uma autorização. A resolução exige:

1. conexão autenticada com o Gateway;
2. `operator.approvals` ou `operator.admin`;
3. autorização do revisor no nível do registro.

Regras no nível do registro:

- `operator.admin` pode revisar.
- `reviewer_device_ids` é autoritativo quando está presente. Somente um dispositivo
  `operator.approvals` pareado e listado pode revisar; o dispositivo solicitante não tem
  acesso implícito, a menos que também esteja listado.
- Sem uma lista explícita de revisores, o dispositivo solicitante
  `operator.approvals` pareado pode revisar seu próprio registro.
- Registros realmente legados sem associação de solicitante ou revisor mantêm ampla
  visibilidade para dispositivos pareados, para que as atualizações não deixem trabalhos já pendentes
  inacessíveis.
- Runtimes internos sem dispositivo podem resolver, mas não ler, pela conexão
  de runtime de aprovação com escopo definido. Essa autoridade vem somente do token de runtime
  autenticado pelo servidor; campos públicos de `approval.resolve` não podem
  concedê-la.
- A propriedade da conexão ativa do solicitante permanece válida para adaptadores legados; ela
  nunca é inferida com base em um nome de cliente correspondente.
- A associação ao público altera apenas a apresentação. Ela nunca amplia a autorização.

`approval.get` expõe somente a projeção sanitizada para o revisor e omite chaves internas de roteamento de origem/público. O evento `session.approval` da PR 5 transporta seu único `sessionKey` de destino, além de `sourceSessionKey`, depois que o Gateway aplica no lado do servidor o snapshot persistido do público. Os eventos existentes de execução/plugin mantêm seu payload histórico e seus destinatários restritos até que os consumidores migrem. A solicitação executável, a associação do comando e a continuação permanecem somente no processo de espera local. A linha durável contém a apresentação segura, além dos metadados de ciclo de vida, roteamento e auditoria; ela nunca armazena valores brutos de ambiente, credenciais, cabeçalhos de autenticação nem dados de callback do canal.

## Projeção de público

Calcule o público uma única vez antes da inserção e persista o snapshot ordenado. A propriedade é um grafo, nem sempre uma única cadeia de pais: um filho pode ter tanto um controlador atual quanto um solicitante original, e esses proprietários podem levar a raízes diferentes.

Use uma travessia determinística em largura:

1. Inicialize a fila com a chave da sessão de origem.
2. Para cada chave removida da fila, leia a linha mais recente do registro de subagentes e adicione à fila ambas as arestas de propriedade distintas em ordem fixa: `controllerSessionKey` e, em seguida, `requesterSessionKey`.
3. Quando existir uma linha utilizável no registro, não siga também a linhagem da entrada da sessão, que pode estar desatualizada após o redirecionamento. Caso contrário, adicione à fila a única aresta alternativa atual `parentSessionKey ?? spawnedBy`.
4. Normalize e elimine duplicatas ao adicionar à fila, para que o primeiro caminho, que é o mais curto, prevaleça.
5. Pare ao atingir 64 chaves únicas; esse limite de tamanho do público também restringe a profundidade da travessia.

A fonte do registro é `src/agents/subagent-registry-read.ts`; os campos de propriedade são definidos em `src/agents/subagent-registry.types.ts`. Os campos alternativos da sessão são definidos em `src/config/sessions/types.ts`.

As projeções de solicitação e de estado terminal usam o mesmo público persistido, mesmo que a propriedade de foco/controlador mude enquanto a aprovação estiver pendente. Isso garante a limpeza terminal de cada fluxo de sessão do público que recebeu a projeção da solicitação. A resolução sempre tem como alvo o ID de aprovação de origem; as sessões do público nunca recebem um estado de aprovação clonado. A limpeza de mensagens de canal encaminhadas continua sendo o acompanhamento separado do localizador de entrega descrito abaixo.

Não grave mensagens na transcrição, injete prompts de sistema, inicie turnos dos proprietários nem emita `sessions.changed` exclusivamente por causa de uma aprovação.

## Convergência das superfícies de entrega

Os manipuladores nativos de aprovação já retêm as entradas das mensagens entregues por tempo suficiente para substituir ou desativar os controles ativos. Atualmente, as mensagens genéricas de aprovação encaminhadas descartam o `MessageReceipt`, portanto, uma decisão em outra superfície pode fazer com que seus controles antigos continuem aparentando estar pendentes. Uma alteração complementar separada elimina essa lacuna com uma tabela filha `operator_approval_deliveries` no banco de dados de estado compartilhado.

Cada linha armazena o ID da aprovação, um ID de entrega exclusivo, canal/conta/rota exata, um localizador de mensagem privado do canal, limitado e validado por JSON, os registros de data e hora da entrega e o estado de finalização. Ela nunca armazena dados de callback, tokens de decisão nem solicitações de aprovação brutas. O canal é responsável pela codificação do localizador e pela alteração da mensagem; o núcleo é responsável pelo status canônico, pela seleção do destino, pela política de novas tentativas e pelo texto terminal alternativo.

O registro da entrega e a resolução terminal são protegidos contra condições de corrida:

1. Depois que um envio pendente retornar seu recibo, insira o localizador de entrega e leia o status da aprovação pai em uma única transação.
2. Se a aprovação pai já estiver em estado terminal, agende a terminalização imediata em vez de deixar a entrega tardia pendente.
3. Cada transição terminal confirmada agenda separadamente todas as linhas de entrega não finalizadas; transmissões descartáveis não são o gatilho.
4. Um terminalizador de canal informa `replaced`, `retired` ou `unsupported`. Substituído suprime uma mensagem terminal duplicada; desativado envia o acompanhamento terminal existente; não compatível ou falha recorre ao fallback sem reverter o CAS da aprovação.
5. Na inicialização, as aprovações terminais com entregas não concluídas são tentadas novamente, tornando a limpeza resiliente à reinicialização do Gateway.

Este ciclo de vida do transporte é um hook opcional do adaptador de entrega, não um renderizador nem uma ação de mensagem voltada para o modelo. Atualmente, as mensagens C2C/de grupo do QQ não têm API de edição, exclusão ou limpeza de teclado; esse adaptador continua sem suporte e só pode mostrar a verdade canônica após um clique posterior, até que o transporte passe a oferecer uma API de mutação.

## Semântica de reinicialização, tempo limite e rota

A persistência em SQLite não implica a retomada da execução. Os vínculos de comandos/ferramentas permanecem na memória porque podem conter fatos de runtime sensíveis à segurança e não constituem um contrato de tarefa retomável.

Na inicialização do Gateway:

- gerar uma nova época de runtime;
- fazer a transição atômica das linhas pendentes de épocas anteriores para `cancelled`, com o motivo `gateway-restart`;
- reter as linhas para que suas URLs expliquem o que aconteceu;
- nunca executar uma aprovação posterior contra um vínculo de runtime ausente.

Os temporizadores são otimizações de ativação. A autoridade sobre o prazo está armazenada em `expires_at_ms`; leituras, esperas e resoluções executam a reconciliação de expiração.

Comportamento estrito final:

- tempo limite -> `expired`, negar;
- sem rota -> `denied`, negar;
- cancelamento da execução -> `cancelled`, negar;
- veredito confiável malformado -> `denied`, negar;
- somente uma decisão explícita de permitir que seja autorizada -> `allowed`.

O comportamento de execução atualmente lançado ainda entra em conflito com este contrato:

- `src/agents/bash-tools.exec-host-shared.ts` pode aplicar `askFallback`.
- `docs/tools/exec-approvals.md` e `docs/cli/approvals.md` documentam essa superfície.

As aprovações de plugins agora falham de forma fechada em caso de tempo limite e vereditos malformados; o campo legado
`timeoutBehavior` continua sendo aceito, mas é ignorado. O trabalho subsequente de semântica estrita da execução
deve atualizar código, tipos, documentação, testes e changelog em conjunto, com
revisão explícita do responsável e de segurança. `askFallback` pode continuar descrevendo
a seleção de política anterior à barreira durante a migração, mas não deve transformar o
tempo limite de um registro pendente criado em aprovação.

## Plano de compatibilidade

- Protocolo do Gateway aditivo; sem incremento da versão do protocolo.
- Preservar os métodos e eventos existentes de execução/plugins no limite externo.
- Manter os IDs existentes, incluindo os prefixos `plugin:`, mas deixar de usar prefixos como informação de tipo.
- Manter o comportamento do comando de texto `/approve`.
- Manter os campos legados de URL de botão/Web App e as ações de comando como entrada de compatibilidade do SDK de plugins; a nova saída do núcleo é tipada.
- Migrar todos os canais integrados e chamadores internos na mesma alteração de ações tipadas.
- Adicionar uma entrada ao changelog para a nova URL/página e para a alteração posterior do comportamento de tempo limite.
- Não adicionar uma configuração de modo de elicitação.

## Implantação

### PR 1: ciclo de vida durável

- Esta nota de design.
- Esquema SQLite compartilhado, geração do Kysely, armazenamento e limpeza após 30 dias.
- Serviço de aprovação do Gateway, ponte de espera do runtime e tratamento de órfãos após reinicialização.
- `approval.get/resolve` unificado.
- Adaptadores de métodos de execução/plugins.
- Testes de prevalência da primeira resposta, idempotência, expiração, autorização e consumo.
- Ainda sem alteração no comportamento da interface ou dos canais.

### PR 2: ações tipadas e callbacks de canais

- Ações tipadas de aprovação, URL e Web App.
- Construtores de apresentação do núcleo e exportações do SDK de plugins.
- Codificação de callbacks privada do transporte com tipo de responsável explícito.
- Referências duráveis de tamanho fixo para callbacks de IDs canônicos que excedam os limites do transporte.
- Migração dos canais integrados para eliminar a inferência por texto de comando e ID de aprovação.
- Verdade canônica da primeira resposta na superfície clicada e atualizações terminais nativas ativas de melhor esforço; a terminalização durável de mensagens de canal permanece como trabalho subsequente.
- Testes do SDK e dos canais integrados.

### PR 3: link direto da Control UI

- Página de aprovação autenticada independente e roteamento de inicialização compatível com o caminho base.
- Vinculação ao Gateway de serviço sem alterar a seleção remota salva pelo operador.
- Namespace HTTP de aprovação pertencente ao núcleo, incluindo IDs semelhantes a ativos.
- Payload de URL criado pelo Gateway e sondagem do estado pendente até que os eventos do ciclo de vida sejam lançados.
- Comprovação em largura de dispositivos móveis, reconexão, respostas concorrentes, recarregamento e caminho montado.

### PR 4: clientes nativos

- As superfícies de revisão do iOS e Android usam `approval.get/resolve` com reconhecimento de tipo; o watchOS retransmite prompts seguros para o revisor e decisões por meio do iPhone emparelhado.
- O Watch oferece as decisões de execução compatíveis com seu contrato compacto de retransmissão: permitir uma vez e negar.
- A verdade terminal canônica da primeira resposta substitui o estado local de tentativa de decisão.
- Confirmações de resolução perdidas ou ambíguas congelam os controles até a releitura canônica.
- Instâncias lançadas anteriormente do Gateway v4 mantêm a revisão de execução por meio de um fallback restrito para métodos legados; o estado terminal retido entre superfícies exige os métodos unificados.
- Os avisos ao revisor e o contexto do responsável permanecem visíveis no iPhone, Watch e Android.
- Testes unitários nativos, build e comprovação de plataforma.

### PR 5: propagação do ciclo de vida para ancestrais

- Entrega pendente/terminal de `session.approval` com base no snapshot do público persistido no PR 1.
- Assinatura da sessão exata, reprodução após reconexão e marcadores de exclusão terminais sem alteração da transcrição nem ativação do agente.
- Os callbacks do ciclo de vida são executados após a inserção/CAS durável e nunca se tornam autoridade de aprovação.
- Comprovação de subagentes aninhados e reconexão.

### PR 6: comportamento de falha fechada

- Migrar `node-invoke-plugin-policy.ts` e o broker de plugins integrado para eliminar a autoridade duplicada.
- Semântica estrita de tempo limite, conteúdo malformado, ausência de rota, vínculo e consumo de permissão única.
- Descontinuar as configurações permissivas de tempo limite já lançadas sem respeitá-las depois que uma solicitação estiver pendente.
- Comprovação de contenção entre múltiplas superfícies e injeção de falhas.

### Trabalho subsequente: limpeza durável de mensagens remotas

- Persista os localizadores de entrega encaminhada e finalize todas as mensagens de canal entregues após a reinicialização.
- Mantenha esse ciclo de vida do transporte separado da autoridade canônica de aprovação e das ações tipadas de apresentação.

## Testes

Cobertura direcionada obrigatória:

- A reabertura do SQLite preserva as projeções pendentes e terminais.
- Dois resolvedores simultâneos produzem exatamente um vencedor de CAS.
- A repetição da mesma decisão é bem-sucedida de forma idempotente; uma repetição conflitante retorna o vencedor registrado.
- Uma resolução no prazo-limite ou após ele não pode aprovar.
- `allow-once` pode ser consumido exatamente uma vez sem apagar o estado terminal de auditoria.
- A inicialização cancela épocas de runtime mais antigas.
- A consulta e a resolução não autorizadas não revelam a existência do registro.
- Comportamento da lista de permissões explícita de revisores e de `operator.approvals` para operadores pareados em geral.
- Os métodos legados de execução e de plugins compartilham o mesmo armazenamento.
- Esquemas de solicitação/listagem/consulta/resolução do Gateway e payloads aditivos de eventos.
- Normalização de ações tipadas, renderização de fallback, exportações do SDK e opções dos canais incluídos.
- A codificação de callbacks do Telegram contém dados privados do transporte e não faz inferência com base em strings de comando.
- Filho direto, proprietários ramificados de controlador/solicitante, proprietários aninhados, reatribuição, fallback de campo de sessão, ciclo e limite de tamanho do público.
- As matrizes de público solicitado e terminal são idênticas.
- As projeções do proprietário não causam alteração da transcrição nem ativação do agente.
- A rota da UI de controle funciona em `/` e em um caminho-base configurado; a atualização mostra a verdade pendente ou terminal.
- Respostas simultâneas da UI de controle e do Telegram mostram um vencedor e "resolvido em outro lugar" para o perdedor.
- Os identificadores nativos de aprovação e os identificadores de proprietário do Gateway preservam exatamente os bytes UTF-8 durante o roteamento e a reconciliação.
- A negociação da família de RPC nativa fixa uma família canônica ou legada por rota admitida do Gateway e nunca faz downgrade silencioso após o uso.
- Confirmações perdidas de resolução nativa bloqueiam as ações até a releitura canônica; uma releitura com falha não pode inventar um vencedor nem confirmar uma atualização do Watch.
- A correlação da solicitação de snapshot do Watch só é aceita para o proprietário exato do Gateway pareado e após uma releitura canônica concluída do iPhone.
- Comprovação do fluxo do usuário por meio de Testbox/Crabbox, incluindo uma página de aprovação com largura de dispositivo móvel, limpeza das ações do Telegram e um ciclo completo de pendência/resolução/perdedor tardio no Android, iPhone e Watch.

## Observabilidade

Emita logs de transição estruturados e sem conteúdo, com ID da aprovação, tipo, chave da sessão de origem, status, motivo e latência. Nunca registre a prévia nem a associação bruta.

Monitore:

- contagem de solicitações por tipo;
- contagem de estados terminais por tipo/status/motivo;
- indicador de pendências;
- latência entre solicitação e estado terminal;
- resultados de disputas de resolução: vencedor, repetição idempotente, conflito, expiração;
- contagem de rotas de entrega e recusas por ausência de rota;
- cancelamentos de órfãos na inicialização;
- tamanho do público.

Uma transição confirmada é considerada bem-sucedida mesmo que a entrega posterior do evento falhe. Os assinantes do ciclo de vida se recuperam por meio da reprodução da PR 5 e da consulta canônica. A finalização durável de mensagens de canal permanece como a tarefa de acompanhamento separada descrita acima.

## Decisões em aberto

1. **Origem da UI de controle acessível externamente.** Cada snapshot contém o `urlPath` relativo estável. Uma URL absoluta só pode ser anunciada a partir de uma localização em cache do Tailscale Serve/Funnel depois que a exposição do Gateway for bem-sucedida; `allowedOrigins`, cabeçalhos Host da solicitação, `gateway.remote.url` e candidatos de loopback/LAN usados apenas para exibição não são origens canônicas. O Telegram pode usar seu wrapper autenticado de Mini App para preservar o caminho de aprovação durante a inicialização. Proxies reversos arbitrários permanecem limitados a caminhos relativos até que exista um contrato explícito de URL pública revisado separadamente. Nunca permita que um canal deduza a origem.
2. **Transição de compatibilidade do tempo limite estrito de execução.** Os tempos limite de aprovação de plugins agora falham de forma fechada, e `timeoutBehavior` está obsoleto. O contrato distribuído restante de `askFallback` precisa de revisão explícita do proprietário e de segurança, changelog, documentação e uma decisão de migração/obsolescência antes de deixar de autorizar a execução quando uma solicitação pendente expira.
3. **Modo incorporado sem Gateway.** Recomendação: inicialmente, mantenha-o somente local; depois, transforme-o em cliente do serviço canônico quando houver um Gateway. Não anuncie um link profundo que nenhum servidor possa resolver.
