---
read_when:
    - Você precisa chamar auxiliares do núcleo a partir de um plugin (TTS, STT, geração de imagens, pesquisa na web, Gateway, subagente, nodes)
    - Você quer entender o que `api.runtime` expõe
    - Você está acessando auxiliares de configuração, agente ou mídia a partir do código do plugin
sidebarTitle: Runtime helpers
summary: api.runtime -- os auxiliares de runtime injetados disponíveis para plugins
title: Auxiliares de runtime de Plugins
x-i18n:
    generated_at: "2026-07-12T15:28:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e43a2a56d15f970df68380a1b34776936777f667615bda51515b993e5bf3369
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

Referência para o objeto `api.runtime` injetado em cada plugin durante o registro. Use estes auxiliares em vez de importar diretamente os componentes internos do host.

<CardGroup cols={2}>
  <Card title="Plugins de canal" href="/pt-BR/plugins/sdk-channel-plugins">
    Guia passo a passo que usa estes auxiliares no contexto de plugins de canal.
  </Card>
  <Card title="Plugins de provedor" href="/pt-BR/plugins/sdk-provider-plugins">
    Guia passo a passo que usa estes auxiliares no contexto de plugins de provedor.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version` é a versão atual do produto OpenClaw, obtida do resolvedor de versão compartilhado para que os plugins vejam o mesmo valor informado pela CLI.

## Carregamento e gravação da configuração

Prefira a configuração que já foi passada para o caminho de chamada ativo, por exemplo, `api.config` durante o registro ou um argumento `cfg` em callbacks de canal/provedor. Isso mantém um único snapshot do processo fluindo pelo trabalho, em vez de reanalisar a configuração nos caminhos críticos.

Use `api.runtime.config.current()` somente quando um manipulador de longa duração precisar do snapshot atual do processo e nenhuma configuração tiver sido passada para essa função. O valor retornado é somente leitura; clone-o ou use um auxiliar de mutação antes de editá-lo.

As fábricas de ferramentas recebem `ctx.runtimeConfig` mais `ctx.getRuntimeConfig()`. Use o getter dentro do callback `execute` de uma ferramenta de longa duração quando a configuração puder mudar após a criação da definição da ferramenta.

Persista as alterações com `api.runtime.config.mutateConfigFile(...)` ou `api.runtime.config.replaceConfigFile(...)`. Cada gravação deve escolher uma política `afterWrite` explícita:

- `afterWrite: { mode: "auto" }` permite que o planejador de recarregamento do Gateway decida.
- `afterWrite: { mode: "restart", reason: "..." }` força uma reinicialização limpa quando o gravador sabe que o recarregamento em tempo real não é seguro.
- `afterWrite: { mode: "none", reason: "..." }` suprime o recarregamento ou a reinicialização automáticos somente quando o chamador é responsável pela ação subsequente.

Os auxiliares de mutação retornam `afterWrite` mais um resumo tipado `followUp`, para que os chamadores possam registrar ou testar se solicitaram uma reinicialização. O Gateway continua sendo responsável por determinar quando essa reinicialização realmente ocorrerá.

<Warning>
`api.runtime.config.loadConfig()` e `api.runtime.config.writeConfigFile(...)` estão obsoletos. Eles emitem um aviso uma vez por plugin em tempo de execução e permanecem disponíveis somente para plugins externos antigos durante o período de migração. Plugins integrados não devem usá-los: uma proteção interna de limite de configuração faz a compilação falhar se o código do plugin os chamar ou importar esses auxiliares de subcaminhos do SDK de plugins. Em vez disso, use `current()`, um `cfg` fornecido, `mutateConfigFile(...)` ou `replaceConfigFile(...)`.
</Warning>

Para importações diretas do SDK, prefira os subcaminhos específicos de configuração ao barrel de compatibilidade amplo `openclaw/plugin-sdk/config-runtime`: `config-contracts` para tipos, `plugin-config-runtime` para asserções de configurações já carregadas e consulta de entradas de plugin, `runtime-config-snapshot` para snapshots atuais do processo e `config-mutation` para gravações. Os testes de plugins integrados devem simular diretamente esses subcaminhos específicos, em vez de simular o barrel de compatibilidade amplo.

O código interno do runtime do OpenClaw segue a mesma direção: carregue a configuração uma vez no limite da CLI, do Gateway ou do processo e, em seguida, passe esse valor adiante. Gravações de mutação bem-sucedidas atualizam o snapshot da configuração do runtime do processo e avançam sua revisão interna; caches de longa duração devem usar a chave de cache pertencente ao runtime, em vez de serializar a configuração localmente. Os módulos de runtime de longa duração têm um verificador de tolerância zero para chamadas ambientes a `loadConfig()`; use um `cfg` fornecido, um `context.getRuntimeConfig()` da solicitação ou `getRuntimeConfig()` em um limite explícito do processo.

Os caminhos de execução de provedores e canais devem usar o snapshot ativo da configuração do runtime, não um snapshot de arquivo retornado para releitura ou edição da configuração. Snapshots de arquivo preservam valores de origem, como marcadores SecretRef, para a interface e gravações; callbacks de provedores precisam da visão resolvida do runtime. Quando um auxiliar puder ser chamado com o snapshot ativo de origem ou com o snapshot ativo do runtime, passe por `selectApplicableRuntimeConfig()` antes de ler credenciais.

## Utilitários reutilizáveis do runtime

Use os fatos `botLoopProtection` de entrada para mensagens de entrada geradas por bots. O núcleo aplica a proteção compartilhada de janela deslizante em memória antes do registro da sessão e do despacho, sem vincular a política a um único canal. A proteção rastreia chaves `(scopeId, conversationId, participant pair)`, conta conjuntamente as duas direções de um par, aplica um período de espera quando o limite da janela é excedido e remove oportunisticamente as entradas inativas.

Plugins de canal que expõem esse comportamento aos operadores devem preferir a estrutura compartilhada `channels.defaults.botLoopProtection` para limites básicos e, em seguida, sobrepor substituições específicas do canal/provedor. A configuração compartilhada usa segundos porque é voltada ao usuário:

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

Passe os fatos normalizados do par de bots com o turno resolvido. O núcleo resolve os padrões, a conversão de unidades e a semântica de `enabled`:

```typescript
return {
  channel: "example",
  routeSessionKey,
  storePath,
  ctxPayload,
  recordInboundSession,
  runDispatch,
  botLoopProtection: {
    scopeId: "account-1",
    conversationId: "channel-1",
    senderId: "bot-a",
    receiverId: "bot-b",
    config: channelConfig.botLoopProtection,
    defaultsConfig: runtimeConfig.channels?.defaults?.botLoopProtection,
    defaultEnabled: allowBotsMode !== "off",
  },
};
```

Use `openclaw/plugin-sdk/pair-loop-guard-runtime` diretamente somente para loops de eventos personalizados
entre duas partes que não passam pelo executor compartilhado de respostas de entrada.

## Namespaces do runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identidade do agente, diretórios e gerenciamento de sessões.

    ```typescript
    // Resolver o diretório de trabalho do agente (agentId é obrigatório)
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // Resolver o espaço de trabalho do agente
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

    // Obter a identidade do agente
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Obter o nível padrão de raciocínio
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // Validar um nível de raciocínio fornecido pelo usuário em relação ao perfil ativo do provedor
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // passar o nível para uma execução incorporada
    }

    // Obter o tempo limite do agente
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Garantir que o espaço de trabalho exista
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Executar um turno incorporado do agente
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "Resuma as alterações mais recentes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` é o auxiliar neutro para iniciar um turno normal do agente OpenClaw a partir do código de um plugin. Ele usa a mesma resolução de provedor/modelo e seleção do framework do agente usadas pelas respostas acionadas por canais.

    `runEmbeddedPiAgent(...)` permanece como um alias de compatibilidade obsoleto para plugins existentes. Código novo deve usar `runEmbeddedAgent(...)`.

    `resolveThinkingPolicy(...)` retorna os níveis de raciocínio compatíveis do provedor/modelo e o padrão opcional. Os plugins de provedor são responsáveis pelo perfil específico do modelo por meio de seus hooks de raciocínio; portanto, plugins de ferramentas devem chamar este auxiliar do runtime em vez de importar ou duplicar listas de provedores.

    `normalizeThinkingLevel(...)` converte texto do usuário, como `on`, `x-high` ou `extra high`, para o nível canônico armazenado antes de verificá-lo em relação à política resolvida.

    Os **auxiliares do armazenamento de sessões** ficam em `api.runtime.agent.session`:

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // Iterar pelas linhas de sessão sem depender da estrutura legada de sessions.json.
    }
    await api.runtime.agent.session.patchSessionEntry({
      agentId,
      sessionKey,
      update: (entry) => ({ thinkingLevel: "high" }),
    });

    const created = await api.runtime.agent.session.createSessionEntry({
      cfg,
      key: "agent:main:my-plugin:task-1",
      initialEntry: {
        agentHarnessId: "my-harness",
        modelSelectionLocked: true,
        pluginExtensions: { "my-plugin": { phase: "initializing" } },
      },
      afterCreate: async () => ({
        pluginExtensions: { "my-plugin": { phase: "ready" } },
      }),
    });

    const storePath = api.runtime.agent.session.resolveStorePath(cfg.session?.store, { agentId });
    await api.runtime.agent.session.runWithWorkAdmission(
      { storePath, sessionKey },
      async (signal) => {
        // Criar ou atualizar a sessão e, em seguida, passar signal para a execução admitida do agente.
      },
    );
    ```

    Prefira `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` ou `upsertSessionEntry(...)` para fluxos de trabalho de sessão. Esses auxiliares identificam as sessões pela identidade do agente/sessão, para que os plugins não dependam da estrutura de armazenamento legada `sessions.json`. Use `preserveActivity: true` para correções somente de metadados que não devem atualizar a atividade da sessão e `replaceEntry: true` somente quando o callback retornar uma entrada completa e os campos excluídos precisarem permanecer excluídos. Os caminhos de diagnóstico e migração podem combinar `fallbackEntry`, `skipMaintenance` e `requireWriteSuccess` para realizar uma correção atômica do armazenamento canônico.

    `createSessionEntry(...)` cria uma nova linha de sessão canônica e uma transcrição. Sua superfície confiável `initialEntry` é deliberadamente restrita: um `agentHarnessId` não vazio, `modelSelectionLocked: true` opcional e `pluginExtensions` opcional. O runtime injetado aceita somente IDs de framework pertencentes ao plugin chamador por meio de `registerAgentHarness(...)`; essa é uma invariante de propriedade, não uma sandbox entre plugins no mesmo processo. Ele rejeita uma linha existente; `label` e `spawnedCwd` são campos de criação separados, em vez de correções de entrada confiável.

    A criação mantém a barreira de mutação do ciclo de vida da sessão durante `afterCreate`, de modo que novos trabalhos aguardem a conclusão da inicialização pertencente ao plugin e trabalhos admitidos preexistentes façam a criação falhar. O callback recebe um clone do estado criado. Se retornar uma correção, ela poderá conter somente `pluginExtensions`, e seu valor será o campo `pluginExtensions` final completo. Uma falha no callback ou na persistência final reverte a nova linha inalterada e a transcrição; a reversão protegida preserva uma linha alterada ou reivindicada simultaneamente. `recoverMatchingInitialEntry: true` serve somente para repetir uma inicialização interrompida quando os campos confiáveis persistidos correspondem exatamente, e a recuperação exige que `afterCreate` retorne uma correção final.

    Use `runWithWorkAdmission(...)` quando um plugin iniciar um trabalho em uma sessão persistida. O callback rejeita sessões arquivadas ou substituídas simultaneamente, mantém as mutações de arquivamento/redefinição/exclusão coordenadas até a conclusão e recebe um `AbortSignal` que deve ser encaminhado à execução do agente. Um framework pode nomear explicitamente delegados de execução confiáveis por meio de seu campo de registro experimental `delegatedExecutionPluginIds`. Os delegados podem admitir e executar somente uma sessão existente exata com o modelo bloqueado; todas as mutações de sessão permanecem restritas ao proprietário do framework. Consulte [Plugins de framework de agente](/pt-BR/plugins/sdk-agent-harness#delegated-execution).

    Plugins de manutenção e reparo podem usar `deleteSessionEntry(...)` para uma entrada de sessão com escopo definido, `cleanupSessionLifecycleArtifacts(...)` para sessões temporárias pertencentes ao ciclo de vida e `resolveSessionStoreBackupPaths(...)` antes de modificar um armazenamento. Esses auxiliares são superfícies restritas de reparo/ciclo de vida, não uma API geral de exclusão de armazenamento.

    `resolveStorePath(...)` e `updateSessionStoreEntry(...)` completam os auxiliares de sessão: `resolveStorePath` resolve o caminho do armazenamento de sessões para um determinado escopo, e `updateSessionStoreEntry({ storePath, sessionKey, update })` modifica diretamente uma entrada pelo caminho do armazenamento quando o chamador já o conhece.

    `loadTranscriptEventsSync(...)` está disponível para caminhos síncronos de diagnóstico e reparo que não podem usar o runtime assíncrono de transcrições. Ele retorna registros brutos de `SessionStoreTranscriptEvent`. O código normal de runtime de plugins deve preferir `openclaw/plugin-sdk/session-transcript-runtime`.

    `formatSqliteSessionFileMarker(...)`, `parseSqliteSessionFileMarker(...)` e `sqliteSessionFileMarkerMatchesSession(...)` são auxiliares de transição para código que ainda recebe um campo legado chamado `sessionFile`. Um marcador SQLite analisado identifica um destino ativo de transcrição SQLite; ele não é um caminho do sistema de arquivos. Novas APIs devem transportar a identidade tipada da sessão em vez de strings de marcador.

    Para leituras e gravações de transcrições, importe `openclaw/plugin-sdk/session-transcript-runtime` e use `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `readVisibleSessionTranscriptMessageEntries(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` ou `withSessionTranscriptWriteLock(...)` com `{ agentId, sessionKey, sessionId }`. Essas APIs permitem que plugins identifiquem uma transcrição, leiam eventos brutos ou entradas de mensagens visíveis e seguras entre ramificações, adicionem mensagens, publiquem atualizações e executem operações relacionadas sob o mesmo bloqueio de gravação da transcrição sem depender de caminhos de arquivos de transcrição ativos. `readVisibleSessionTranscriptMessageEntries(...)` retorna metadados de leitura ordenados; seu campo `seq` não é um cursor retomável.

    Os auxiliares legados para o armazenamento inteiro e para arquivos de transcrição ativos não são mais exportados pelo SDK de plugins. Use os auxiliares de entrada com escopo definido para metadados de sessão e os auxiliares de identidade de transcrição para operações de transcrição ativa. Fluxos de arquivamento/suporte que precisem de artefatos de arquivo devem usar suas superfícies dedicadas de arquivamento em vez das APIs de runtime de sessão ativa.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Constantes padrão de modelo e provedor:

    ```typescript
    const model = api.runtime.agent.defaults.model; // por exemplo, "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // por exemplo, "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    Execute uma conclusão de texto pertencente ao host sem importar componentes internos do provedor nem
    duplicar a preparação de modelo/autenticação/URL base do OpenClaw.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "Resuma esta transcrição." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    A orquestração do provedor também pode adquirir o ciclo de vida
    configurado do serviço local antes de emitir uma solicitação HTTP:

    ```typescript
    const lease = await api.runtime.llm.acquireLocalService(
      {
        providerId,
        baseUrl,
        headers,
      },
      signal,
    );
    try {
      // Envie e consuma integralmente a solicitação ao provedor.
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)` é um contrato SDK estável e genérico de serviço
    de provedor. O host resolve a configuração do processo a partir de
    `models.providers.<providerId>.localService`; os chamadores não podem fornecer
    comando, argumentos, ambiente nem política de ciclo de vida. A criação do processo,
    a prontidão, os diagnósticos e a política de encerramento por inatividade permanecem internos ao host.

    Passe o ID exato do provedor configurado e a URL base resolvida da solicitação. Não
    substitua aliases por um ID de adaptador: aliases distintos podem apontar para hosts
    locais de GPU distintos. O host rejeita endpoints que não correspondam à URL base
    configurada do provedor, exceto pela normalização de `/v1` usada pelos adaptadores Ollama e LM
    Studio. O host controla a serialização da inicialização, as sondagens de prontidão,
    as concessões de solicitação, o tratamento de cancelamento e o encerramento por inatividade.

    O auxiliar usa o mesmo caminho de preparação de conclusão simples que o runtime
    integrado do OpenClaw e o snapshot de configuração de runtime pertencente ao host. Os mecanismos de contexto
    recebem uma capacidade `llm.complete` vinculada à sessão, portanto as chamadas de modelo usam o
    agente da sessão ativa e não recorrem silenciosamente ao agente padrão. O
    resultado inclui a atribuição de provedor/modelo/agente, além do uso normalizado de tokens,
    cache e custo estimado, quando disponível.

    <Warning>
    Substituições de modelo exigem autorização explícita do operador por meio de `plugins.entries.<id>.llm.allowModelOverride: true` na configuração. Use `plugins.entries.<id>.llm.allowedModels` para restringir plugins confiáveis a destinos canônicos específicos de `provider/model`. Conclusões entre agentes exigem `plugins.entries.<id>.llm.allowAgentIdOverride: true`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    Chame outro método do Gateway no processo, preservando a identidade confiável de runtime
    do plugin atual. Isso se destina a plugins integrados ou oficiais confiáveis que compõem recursos
    do Gateway pertencentes ao plugin sem abrir uma conexão WebSocket de loopback.

    ```typescript
    if (await api.runtime.gateway.isAvailable()) {
      const result = await api.runtime.gateway.request<{ callId: string }>(
        "voicecall.start",
        { to: "+15550001234", mode: "conversation" },
        { timeoutMs: 60_000 },
      );
    }
    ```

    As solicitações usam o escopo `operator.write` e não concedem escopo de administrador. Chamadas de plugins
    externos arbitrários são rejeitadas. Métodos com falha lançam um `GatewayClientRequestError`, preservando
    `details` estruturados, metadados de repetição e o código de erro do Gateway para fluxos de recuperação. Use `isAvailable()`
    antes de escolher esse caminho em ferramentas que também podem ser executadas em processos independentes de agentes.

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Inicie e gerencie execuções de subagentes em segundo plano.

    ```typescript
    // Inicie uma execução de subagente
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expanda esta consulta em pesquisas complementares direcionadas.",
      provider: "openai", // substituição opcional
      model: "gpt-5.6-sol", // substituição opcional
      deliver: false,
    });

    // Aguarde a conclusão
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Leia as mensagens da sessão
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Exclua uma sessão
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Substituições de modelo (`provider`/`model`) exigem autorização explícita do operador por meio de `plugins.entries.<id>.subagent.allowModelOverride: true` na configuração. Plugins não confiáveis ainda podem executar subagentes, mas as solicitações de substituição são rejeitadas.
    </Warning>

    `deleteSession(...)` pode excluir sessões criadas pelo mesmo plugin por meio de `api.runtime.subagent.run(...)`. A exclusão de sessões arbitrárias de usuários ou operadores ainda exige uma solicitação do Gateway com escopo de administrador.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Liste os Nodes conectados e invoque um comando hospedado em Node a partir de código de plugin carregado pelo Gateway ou de comandos CLI de plugins. Use isso quando um plugin for responsável por trabalho local em um dispositivo pareado, por exemplo, uma ponte de navegador ou áudio em outro Mac.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    `nodes.list(...)` inclui os descritores
    `nodePluginTools` anunciados por cada Node conectado quando esse Node expõe ao agente
    ferramentas respaldadas por plugins ou MCP. Esses descritores representam o estado da conexão em tempo real: o Gateway
    os remove quando o Node se desconecta, e um Node pode substituí-los por
    `node.pluginTools.update` após alterações no inventário local de plugins/MCP.

    Dentro do Gateway, esse runtime é executado no processo. Em comandos CLI de plugins, ele chama o Gateway configurado por RPC, portanto comandos como `openclaw googlemeet recover-tab` podem inspecionar Nodes pareados pelo terminal. Os comandos de Node ainda passam pelo pareamento normal de Nodes do Gateway, pelas listas de comandos permitidos, pelas políticas de invocação de Node dos plugins e pelo tratamento local de comandos do Node.

    Plugins que expõem ferramentas de agente hospedadas em Nodes podem definir `agentTool.defaultPlatforms` para comandos não perigosos que devem ser incluídos por padrão na lista de permissões. Omita esse campo quando os operadores precisarem autorizar explicitamente com `gateway.nodes.allowCommands`. Comandos perigosos hospedados em Nodes devem registrar uma política de invocação de Node com `api.registerNodeInvokePolicy(...)`; a política é executada no Gateway após as verificações da lista de comandos permitidos e antes que o comando seja encaminhado ao Node, de modo que chamadas diretas a `node.invoke`, ferramentas de plugins hospedadas em Nodes e ferramentas de plugins de nível superior compartilhem o mesmo caminho de aplicação das regras.

    <Warning>
    O campo opcional `scopes` solicita escopos de operador do Gateway para a invocação. O OpenClaw o respeita somente para plugins integrados e instalações confiáveis de plugins oficiais; solicitações de outros plugins não elevam os privilégios da chamada. Use-o somente quando um plugin confiável precisar invocar um comando de Node com um escopo mais restrito do Gateway, como `operator.admin`.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    Vincule o estado de Fluxo de Tarefas e Execução de Tarefa a uma chave de sessão existente do OpenClaw ou a um contexto confiável de ferramenta.

    - `api.runtime.tasks.managedFlows` permite modificações: criar, avançar e cancelar Fluxos de Tarefas.
    - `api.runtime.tasks.flows` e `api.runtime.tasks.runs` são visualizações DTO somente leitura para listagens e consultas de status; ambos expõem `bindSession(...)` / `fromToolContext(...)`, além de `get`, `list`, `findLatest` e `resolve`.
    - `api.runtime.tasks.flow` é um alias obsoleto de `managedFlows`.

    O Fluxo de Tarefas acompanha o estado durável de fluxos de trabalho com várias etapas. Ele não é um agendador:
    use Cron ou `api.session.workflow.scheduleSessionTurn(...)` para ativações
    futuras e, em seguida, use `managedFlows` a partir do turno agendado quando esse trabalho
    precisar de estado de fluxo, tarefas filhas, esperas ou cancelamento.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Revisar novas solicitações de pull",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Revisar a PR nº 123",
      status: "running",
      startedAt: Date.now(),
    });

    const waiting = taskFlow.setWaiting({
      flowId: created.flowId,
      expectedRevision: created.revision,
      currentStep: "await-human-reply",
      waitJson: { kind: "reply", channel: "telegram" },
    });
    ```

    Use `bindSession({ sessionKey, requesterOrigin })` quando você já tiver uma chave de sessão confiável do OpenClaw proveniente da sua própria camada de vinculação. Não faça a vinculação a partir de entrada bruta do usuário.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Síntese de texto em fala.

    ```typescript
    // TTS padrão
    const clip = await api.runtime.tts.textToSpeech({
      text: "Olá do OpenClaw",
      cfg: api.config,
    });

    // TTS otimizado para telefonia
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Olá do OpenClaw",
      cfg: api.config,
    });

    // Listar vozes disponíveis
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Usa a configuração principal `messages.tts` e a seleção de provedor. Retorna um buffer de áudio PCM + taxa de amostragem. `textToSpeechStream` também está disponível para síntese por streaming.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Análise de imagens, áudios e vídeos.

    ```typescript
    // Descrever uma imagem
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Transcrever áudio
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // opcional, para quando não for possível inferir o MIME
    });

    // Descrever um vídeo
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Análise genérica de arquivo
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // Extração estruturada de imagem por meio de um provedor/modelo específico.
    // Inclua pelo menos uma imagem; entradas de texto são contexto complementar.
    const evidence = await api.runtime.mediaUnderstanding.extractStructuredWithModel({
      provider: "codex",
      model: "gpt-5.6-sol",
      input: [
        {
          type: "image",
          buffer: receiptImageBuffer,
          fileName: "receipt.png",
          mime: "image/png",
        },
        { type: "text", text: "Prefira o total impresso às anotações manuscritas." },
      ],
      instructions: "Extraia o fornecedor, o total e as tags pesquisáveis.",
      schemaName: "receipt.evidence",
      jsonSchema: {
        type: "object",
        properties: {
          vendor: { type: "string" },
          total: { type: "number" },
          tags: { type: "array", items: { type: "string" } },
        },
        required: ["vendor", "total"],
      },
      cfg: api.config,
    });
    ```

    Retorna `{ text: undefined }` quando nenhuma saída é produzida (por exemplo, entrada ignorada).

    `describeImageFileWithModel(...)` descreve uma imagem já conhecida por meio de um provedor/modelo específico, ignorando a resolução padrão do modelo ativo usada por `describeImageFile(...)`.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` permanece como um alias de compatibilidade para `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Geração de imagens.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "Um robô pintando um pôr do sol",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.videoGeneration">
    Geração de vídeos, seguindo a mesma estrutura da geração de imagens.

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "Uma tomada de drone sobrevoando um litoral ao nascer do sol",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    Geração de músicas, seguindo a mesma estrutura da geração de imagens.

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "Uma faixa lo-fi animada para uma sessão de programação",
      cfg: api.config,
    });

    const providers = api.runtime.musicGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Pesquisa na Web.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "SDK de plugins do OpenClaw", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Utilitários de mídia de baixo nível.

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "imagem"
    const isVoice = api.runtime.media.isVoiceCompatibleAudio(filePath);
    const metadata = await api.runtime.media.getImageMetadata(filePath);
    const resized = await api.runtime.media.resizeToJpeg(buffer, { maxWidth: 800 });
    const terminalQr = await api.runtime.media.renderQrTerminal("https://openclaw.ai");
    const pngQr = await api.runtime.media.renderQrPngBase64("https://openclaw.ai", {
      scale: 6, // 1-12
      marginModules: 4, // 0-16
    });
    const pngQrDataUrl = await api.runtime.media.renderQrPngDataUrl("https://openclaw.ai");
    const tmpRoot = resolvePreferredOpenClawTmpDir();
    const pngQrFile = await api.runtime.media.writeQrPngTempFile("https://openclaw.ai", {
      tmpRoot,
      dirPrefix: "my-plugin-qr-",
      fileName: "qr.png",
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.config">
    Instantâneo da configuração de runtime atual e gravações transacionais da configuração. Prefira
    a configuração que já foi passada para o caminho de chamada ativo; use
    `current()` somente quando o manipulador precisar diretamente do instantâneo do processo.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)` e `replaceConfigFile(...)` retornam um valor `followUp`,
    por exemplo, `{ mode: "restart", requiresRestart: true, reason }`,
    que registra a intenção do gravador sem retirar do Gateway o controle da
    reinicialização.

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilitários no nível do sistema.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // Alias de compatibilidade obsoleto.
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)` executa imediatamente um único ciclo de Heartbeat, ignorando o temporizador normal de agrupamento. Passe `{ heartbeat: { target: "last" } }` para forçar a entrega ao último canal ativo, em vez da supressão padrão `target: "none"`.

    `runCommandWithTimeout(...)` retorna `stdout` e `stderr` capturados, contagens
    opcionais de truncamento, `code`, `signal`, `killed`, `termination` e
    `noOutputTimedOut`. Resultados de tempo limite e de tempo limite sem saída relatam `code: 124`
    quando o processo filho não fornece um código de saída diferente de zero. Encerramentos por
    sinal não relacionados a tempo limite ainda podem retornar `code: null`; portanto, use `termination` e
    `noOutputTimedOut` para distinguir os motivos de tempo limite.

  </Accordion>
  <Accordion title="api.runtime.events">
    Assinaturas de eventos.

    ```typescript
    api.runtime.events.onAgentEvent((event) => {
      /* ... */
    });
    api.runtime.events.onSessionTranscriptUpdate((update) => {
      /* ... */
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.logging">
    Registro em log.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Resolução de autenticação de modelos e provedores.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });

    // Autenticação pronta para requisições, incluindo trocas no runtime do provedor (por exemplo, atualização de OAuth)
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Resolução do diretório de estado e armazenamento com chaves baseado em SQLite.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir(process.env);
    const store = api.runtime.state.openKeyedStore<MyRecord>({
      namespace: "my-feature",
      maxEntries: 200,
      defaultTtlMs: 15 * 60_000,
    });

    await store.register("key-1", { value: "hello" });
    const claimed = await store.registerIfAbsent("dedupe-key", { value: "first" });
    const value = await store.lookup("key-1");
    await store.consume("key-1");
    await store.clear();
    ```

    Os armazenamentos com chaves persistem após reinicializações e são isolados pelo ID do plugin vinculado ao runtime. Use `registerIfAbsent(...)` para reivindicações atômicas de desduplicação: ele retorna `true` quando a chave estava ausente ou expirada e foi registrada, ou `false` quando um valor válido já existe, sem sobrescrever seu valor, horário de criação ou TTL. Limites: `maxEntries` por namespace, 50,000 linhas válidas por plugin, valores JSON inferiores a 64KB e expiração opcional por TTL. Por padrão, uma gravação que atinge qualquer um dos limites de linhas remove as linhas válidas mais antigas do namespace que está sendo gravado; namespaces irmãos não são despejados por essa gravação, e ela ainda falha se o namespace não puder liberar linhas suficientes. Defina `overflowPolicy: "reject-new"` para registros duráveis de propriedade que nunca devem ser despejados: novas chaves falham em qualquer um dos limites, enquanto as chaves existentes continuam podendo ser atualizadas.

    `openSyncKeyedStore<T>(...)` retorna a mesma estrutura de armazenamento com métodos síncronos (`register`, `registerIfAbsent`, `lookup`, `consume` e `clear` retornam valores diretamente, em vez de promessas) para chamadores que não podem aguardar.

    `openChannelIngressQueue<TPayload>(...)` abre uma fila persistente de entrada, com escopo restrito ao plugin chamador, para armazenar em buffer eventos recebidos que precisam de processamento pelo menos uma vez entre reinicializações. Quando a recuperação de reivindicações obsoletas usa `shouldRecover`, forneça também `shouldRecoverCorrupt` se cargas úteis reivindicadas e corrompidas precisarem ser colocadas em quarentena: sua identidade de reivindicação independente da carga útil permite que o plugin preserve a política ativa de proprietário e de faixa antes que a fila marque a linha como excluída.

    <Warning>
    `openKeyedStore`, `openSyncKeyedStore` e `openChannelIngressQueue` estão disponíveis somente para plugins incluídos no pacote e instalações confiáveis de plugins oficiais nesta versão.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    Auxiliares de runtime específicos de canal (disponíveis quando um plugin de canal está carregado). Agrupados por finalidade:

    | Grupo | Finalidade |
    | --- | --- |
    | `text` | Segmentação (`chunkText`, `chunkMarkdownText`, `resolveChunkMode`), detecção de comandos de controle, conversão de tabelas Markdown. |
    | `reply` | Despacho de respostas em blocos armazenados em buffer, formatação de envelope, resolução de mensagens efetivas/configuração de atraso humano. |
    | `routing` | `buildAgentSessionKey`, `resolveAgentRoute`. |
    | `pairing` | `buildPairingReply`, leituras da lista de permissões, inserções ou atualizações de solicitações de pareamento. |
    | `media` | Download/armazenamento de mídia remota (veja abaixo). |
    | `activity` | Registrar/ler a última atividade do canal. |
    | `session` | Metadados da sessão provenientes de eventos de entrada, atualizações da última rota. |
    | `mentions` | Auxiliares de política de menções (veja abaixo). |
    | `reactions` | Identificadores de reações de confirmação para indicadores de processamento em andamento. |
    | `groups` | Política de grupos e resolução da exigência de menção. |
    | `debounce` | Debounce de mensagens de entrada. |
    | `commands` | Autorização de comandos e controle de comandos de texto. |
    | `outbound` | Carregar o adaptador de saída de um canal. |
    | `inbound` | Criar o contexto do evento de entrada e executar o kernel compartilhado de eventos de entrada/respostas. |
    | `threadBindings` | Ajustar o tempo limite de inatividade/idade máxima para threads de sessão vinculadas. |
    | `runtimeContexts` | Registrar, ler e observar o contexto local do processo por canal/conta/capacidade. |

    `api.runtime.channel.media` é a interface preferencial para downloads e armazenamento de mídia de canais:

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    Use `saveRemoteMedia(...)` quando uma URL remota precisar se tornar mídia do OpenClaw. Use `saveResponseMedia(...)` quando o plugin já tiver obtido uma `Response` com autenticação, redirecionamento ou tratamento de lista de permissões sob responsabilidade do plugin. Use `readRemoteMediaBuffer(...)` somente quando o plugin precisar dos bytes brutos para inspeção, transformações, descriptografia ou reenvio. `fetchRemoteMedia(...)` permanece como um alias de compatibilidade obsoleto para `readRemoteMediaBuffer(...)`.

    `api.runtime.channel.mentions` é a interface compartilhada de política de menções de entrada para plugins de canal incluídos que usam injeção em tempo de execução:

    ```typescript
    const mentionMatch = api.runtime.channel.mentions.matchesMentionWithExplicit(text, {
      mentionRegexes,
      mentionPatterns,
    });

    const decision = api.runtime.channel.mentions.resolveInboundMentionDecision({
      facts: {
        canDetectMention: true,
        wasMentioned: mentionMatch.matched,
        implicitMentionKinds: api.runtime.channel.mentions.implicitMentionKindWhen(
          "reply_to_bot",
          isReplyToBot,
        ),
      },
      policy: {
        isGroup,
        requireMention,
        allowTextCommands,
        hasControlCommand,
        commandAuthorized,
      },
    });
    ```

    Auxiliares de menção disponíveis:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` não expõe intencionalmente os auxiliares de compatibilidade antigos `resolveMentionGating*`. Prefira o caminho normalizado `{ facts, policy }`.

    Vários campos em `reply`, `session` e `inbound` contêm notas `@deprecated` específicas de cada campo que apontam para o kernel atual de turno do canal ou para os adaptadores de saída do canal; verifique o JSDoc inline do auxiliar específico antes de criar novo código com base nele.

  </Accordion>
</AccordionGroup>

## Armazenamento de referências de tempo de execução

Use `createPluginRuntimeStore` para armazenar a referência de tempo de execução para uso fora do callback `register`:

<Steps>
  <Step title="Crie o armazenamento">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="Conecte-o ao ponto de entrada">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Example",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="Acesse-o de outros arquivos">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // lança uma exceção se não estiver inicializado
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // retorna null se não estiver inicializado
    }
    ```

  </Step>
</Steps>

<Note>
Prefira `pluginId` para a identidade do armazenamento de tempo de execução. A forma de nível mais baixo `key` destina-se a casos incomuns em que um plugin precisa intencionalmente de mais de um slot de tempo de execução.
</Note>

## Outros campos de nível superior de `api`

Além de `api.runtime`, o objeto da API também fornece:

<ParamField path="api.id" type="string">
  ID do plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nome de exibição do plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Snapshot atual da configuração (snapshot ativo do tempo de execução em memória, quando disponível).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Configuração específica do plugin proveniente de `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger com escopo (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Modo de carregamento atual: `"full"` (ativação em tempo real), `"discovery"` / `"tool-discovery"` (descoberta de capacidades somente leitura), `"setup-only"` (entrada de configuração leve), `"setup-runtime"` (fluxo de configuração que também precisa da entrada do canal de tempo de execução) ou `"cli-metadata"` (coleta de metadados de comandos da CLI).
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Resolver um caminho relativo à raiz do plugin.
</ParamField>

## Relacionado

- [Componentes internos dos plugins](/pt-BR/plugins/architecture) — modelo de capacidades e registro
- [Pontos de entrada do SDK](/pt-BR/plugins/sdk-entrypoints) — opções de `definePluginEntry`
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) — referência de subcaminhos
