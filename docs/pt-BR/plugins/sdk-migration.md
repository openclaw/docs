---
read_when:
    - Você vê o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você vê o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você usou api.registerEmbeddedExtensionFactory antes do OpenClaw 2026.4.25
    - Você está atualizando um Plugin para a arquitetura moderna de plugins
    - Você mantém um Plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar da camada legada de compatibilidade retroativa para o SDK de Plugin moderno
title: Migração do SDK de Plugin
x-i18n:
    generated_at: "2026-07-01T07:56:33Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 8f05bd42cc0a6fc53f6670377b4330bb452b2a06f4d0542a494875970ee81e08
    source_path: plugins/sdk-migration.md
    workflow: 16
---

OpenClaw migrou de uma camada ampla de compatibilidade retroativa para uma arquitetura moderna de Plugin
com importações focadas e documentadas. Se o seu Plugin foi criado antes
da nova arquitetura, este guia ajuda você a migrar.

## O que está mudando

O antigo sistema de Plugin fornecia duas superfícies amplamente abertas que permitiam aos Plugins importar
qualquer coisa de que precisassem a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** - uma única importação que reexportava dezenas de
  auxiliares. Ela foi introduzida para manter Plugins mais antigos baseados em hooks funcionando enquanto a
  nova arquitetura de Plugin estava sendo criada.
- **`openclaw/plugin-sdk/infra-runtime`** - um barrel amplo de auxiliares de runtime que
  misturava eventos do sistema, estado de Heartbeat, filas de entrega, auxiliares de fetch/proxy,
  auxiliares de arquivo, tipos de aprovação e utilitários não relacionados.
- **`openclaw/plugin-sdk/config-runtime`** - um barrel amplo de compatibilidade de configuração
  que ainda carrega auxiliares diretos obsoletos de carregamento/gravação durante a janela de migração.
- **`openclaw/extension-api`** - uma ponte que dava aos Plugins acesso direto a
  auxiliares do lado do host, como o executor de agente incorporado.
- **`api.registerEmbeddedExtensionFactory(...)`** - um hook de extensão empacotada somente para executor incorporado
  removido, que podia observar eventos do executor incorporado, como
  `tool_result`.

As superfícies amplas de importação agora estão **obsoletas**. Elas ainda funcionam em runtime,
mas novos Plugins não devem usá-las, e Plugins existentes devem migrar antes que
a próxima versão principal as remova. A API de registro de fábrica de extensão
somente para executor incorporado foi removida; use middleware de resultado de ferramenta em vez disso.

OpenClaw não remove nem reinterpreta comportamento documentado de Plugin na mesma
alteração que introduz uma substituição. Alterações de contrato incompatíveis devem primeiro passar
por um adaptador de compatibilidade, diagnósticos, documentação e uma janela de obsolescência.
Isso se aplica a importações do SDK, campos de manifesto, APIs de configuração, hooks e comportamento
de registro em runtime.

<Warning>
  A camada de compatibilidade retroativa será removida em uma versão principal futura.
  Plugins que ainda importam dessas superfícies deixarão de funcionar quando isso acontecer.
  Registros legados de fábrica de extensão incorporada já não são mais carregados.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** - importar um auxiliar carregava dezenas de módulos não relacionados
- **Dependências circulares** - reexportações amplas facilitavam a criação de ciclos de importação
- **Superfície de API pouco clara** - não havia como saber quais exports eram estáveis versus internos

O SDK moderno de Plugin corrige isso: cada caminho de importação (`openclaw/plugin-sdk/\<subpath\>`)
é um módulo pequeno, autocontido, com uma finalidade clara e contrato documentado.

As camadas legadas de conveniência de provider para canais empacotados também foram removidas.
Camadas auxiliares com marca de canal eram atalhos privados de monorepo, não contratos estáveis
de Plugin. Use subcaminhos genéricos e estreitos do SDK em vez disso. Dentro do workspace do Plugin
empacotado, mantenha auxiliares de propriedade do provider no próprio `api.ts` ou
`runtime-api.ts` desse Plugin.

Exemplos atuais de providers empacotados:

- Anthropic mantém auxiliares de stream específicos do Claude em sua própria camada `api.ts` /
  `contract-api.ts`
- OpenAI mantém builders de provider, auxiliares de modelo padrão e builders de provider em tempo real
  em seu próprio `api.ts`
- OpenRouter mantém builder de provider e auxiliares de onboarding/configuração em seu próprio
  `api.ts`

## Plano de migração de Talk e voz em tempo real

Código de voz em tempo real, telefonia, reuniões e Talk no navegador está migrando de
controle de turno local à superfície para um controlador compartilhado de sessão Talk exportado por
`openclaw/plugin-sdk/realtime-voice`. O novo controlador é dono do envelope comum de eventos Talk,
do estado de turno ativo, estado de captura, estado de áudio de saída, histórico recente de
eventos e rejeição de turnos obsoletos. Plugins de provider devem continuar sendo donos
de sessões em tempo real específicas do fornecedor; Plugins de superfície devem continuar sendo donos de captura,
reprodução, telefonia e particularidades de reunião.

Esta migração de Talk é intencionalmente incompatível e limpa:

1. Mantenha os primitivos compartilhados de controlador/runtime em
   `plugin-sdk/realtime-voice`.
2. Migre as superfícies empacotadas para o controlador compartilhado: retransmissão do navegador,
   transferência de sala gerenciada, tempo real de chamada de voz, STT por streaming de chamada de voz, Google
   Meet em tempo real e push-to-talk nativo.
3. Substitua as antigas famílias RPC de Talk pela API final `talk.session.*` e
   `talk.client.*`.
4. Anuncie um canal único de eventos Talk ao vivo em
   `hello-ok.features.events` do Gateway: `talk.event`.
5. Exclua o antigo endpoint HTTP em tempo real e qualquer caminho de substituição de instruções
   em tempo de requisição.

Código novo não deve chamar `createTalkEventSequencer(...)` diretamente, a menos que esteja
implementando um adaptador de baixo nível ou fixture de teste. Prefira o controlador compartilhado
para que eventos com escopo de turno não possam ser emitidos sem um id de turno, chamadas obsoletas de `turnEnd` /
`turnCancel` não possam limpar um turno ativo mais novo, e eventos de ciclo de vida
de áudio de saída permaneçam consistentes entre telefonia, reuniões, retransmissão do navegador, transferência de sala
gerenciada e clientes nativos de Talk.

O formato-alvo da API pública é:

```typescript
// Gateway-owned Talk session API.
await gateway.request("talk.session.create", {
  mode: "realtime",
  transport: "gateway-relay",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.session.appendAudio", { sessionId, audioBase64 });
await gateway.request("talk.session.cancelOutput", { sessionId, reason: "barge-in" });
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "working" },
  options: { willContinue: true },
});
await gateway.request("talk.session.submitToolResult", {
  sessionId,
  callId,
  result: { status: "already_delivered" },
  options: { suppressResponse: true },
});
await gateway.request("talk.session.submitToolResult", { sessionId, callId, result });
await gateway.request("talk.session.close", { sessionId });

// Client-owned provider session API.
await gateway.request("talk.client.create", {
  mode: "realtime",
  transport: "webrtc",
  brain: "agent-consult",
  sessionKey: "main",
});
await gateway.request("talk.client.toolCall", { sessionKey, callId, name, args });
await gateway.request("talk.client.steer", { sessionKey, text, mode: "steer" });
```

Sessões WebRTC/websocket de provider de propriedade do navegador usam `talk.client.create`,
porque o navegador é dono da negociação do provider e do transporte de mídia, enquanto o
Gateway é dono das credenciais, instruções e política de ferramentas. `talk.session.*` é a
superfície comum gerenciada pelo Gateway para tempo real via gateway-relay, transcrição via gateway-relay
e sessões nativas STT/TTS de sala gerenciada.

Configurações legadas que colocavam seletores em tempo real ao lado de `talk.provider` /
`talk.providers` devem ser reparadas com `openclaw doctor --fix`; o runtime Talk
não reinterpreta configuração de provider de fala/TTS como configuração de provider em tempo real.

As combinações compatíveis de `talk.session.create` são intencionalmente pequenas:

| Modo            | Transporte      | Cérebro         | Proprietário       | Observações                                                                                                        |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Áudio full-duplex do provider intermediado pelo Gateway; chamadas de ferramenta são roteadas pela ferramenta agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Apenas STT por streaming; chamadores enviam áudio de entrada e recebem eventos de transcrição.                      |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/cliente | Salas no estilo push-to-talk e walkie-talkie em que o cliente é dono de captura/reprodução e o Gateway é dono do estado do turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Sala nativa/cliente | Modo de sala somente para administradores em superfícies primárias confiáveis que executam ações de ferramenta do Gateway diretamente. |

Mapa de métodos removidos:

| Antigo                           | Novo                                                     |
| -------------------------------- | -------------------------------------------------------- |
| `talk.realtime.session`          | `talk.client.create`                                     |
| `talk.realtime.toolCall`         | `talk.client.toolCall`                                   |
| `talk.realtime.relayAudio`       | `talk.session.appendAudio`                               |
| `talk.realtime.relayCancel`      | `talk.session.cancelOutput` ou `talk.session.cancelTurn` |
| `talk.realtime.relayToolResult`  | `talk.session.submitToolResult`                          |
| `talk.realtime.relayStop`        | `talk.session.close`                                     |
| `talk.transcription.session`     | `talk.session.create({ mode: "transcription" })`         |
| `talk.transcription.relayAudio`  | `talk.session.appendAudio`                               |
| `talk.transcription.relayCancel` | `talk.session.cancelTurn`                                |
| `talk.transcription.relayStop`   | `talk.session.close`                                     |
| `talk.handoff.create`            | `talk.session.create({ transport: "managed-room" })`     |
| `talk.handoff.join`              | `talk.session.join`                                      |
| `talk.handoff.revoke`            | `talk.session.close`                                     |

O vocabulário unificado de controle também é deliberadamente estreito:

  | Método                          | Aplica-se a                                             | Contrato                                                                                                                                                                                                 |
  | ------------------------------- | ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Anexa um trecho de áudio PCM em base64 à sessão do provedor pertencente à mesma conexão do Gateway.                                                                                                       |
  | `talk.session.startTurn`        | `stt-tts/managed-room`                                  | Inicia um turno de usuário em managed-room.                                                                                                                                                              |
  | `talk.session.endTurn`          | `stt-tts/managed-room`                                  | Encerra o turno ativo após a validação de turno obsoleto.                                                                                                                                                |
  | `talk.session.cancelTurn`       | todas as sessões pertencentes ao Gateway                | Cancela o trabalho ativo de captura/provedor/agente/TTS de um turno.                                                                                                                                     |
  | `talk.session.cancelOutput`     | `realtime/gateway-relay`                                | Interrompe a saída de áudio do assistente sem necessariamente encerrar o turno do usuário.                                                                                                                |
  | `talk.session.submitToolResult` | `realtime/gateway-relay`                                | Conclui uma chamada de ferramenta do provedor emitida pelo relay; passe `options.willContinue` para saída intermediária ou `options.suppressResponse` para satisfazer a chamada sem outra resposta do assistente. |
  | `talk.session.steer`            | sessões Talk baseadas em agente                         | Envia controle falado `status`, `steer`, `cancel` ou `followup` para a execução incorporada ativa resolvida a partir da sessão Talk.                                                                      |
  | `talk.session.close`            | todas as sessões unificadas                             | Interrompe sessões relay ou revoga o estado de managed-room e então esquece o id da sessão unificada.                                                                                                     |

  Não introduza casos especiais de provedor ou plataforma no núcleo para fazer isso funcionar.
  O núcleo é responsável pela semântica das sessões Talk. Plugins de provedor são responsáveis pela configuração de sessão do fornecedor.
  Chamadas de voz e Google Meet são responsáveis pelos adaptadores de telefonia/reunião. Navegador e aplicativos nativos
  são responsáveis pela UX de captura/reprodução do dispositivo.

  ## Política de compatibilidade

  Para plugins externos, o trabalho de compatibilidade segue esta ordem:

  1. adicione o novo contrato
  2. mantenha o comportamento antigo conectado por meio de um adaptador de compatibilidade
  3. emita um diagnóstico ou aviso que nomeie o caminho antigo e o substituto
  4. cubra ambos os caminhos em testes
  5. documente a descontinuação e o caminho de migração
  6. remova somente após a janela de migração anunciada, geralmente em uma versão principal

  Mantenedores podem auditar a fila de migração atual com
  `pnpm plugins:boundary-report`. Use `pnpm plugins:boundary-report:summary` para
  contagens compactas, `--owner <id>` para um plugin ou responsável de compatibilidade, e
  `pnpm plugins:boundary-report:ci` quando um gate de CI deve falhar em registros
  de compatibilidade vencidos, importações reservadas do SDK entre responsáveis ou subcaminhos reservados do SDK
  não utilizados. O relatório agrupa registros de compatibilidade
  descontinuados por data de remoção, conta referências locais em código/docs,
  expõe importações reservadas do SDK entre responsáveis e resume a ponte privada
  do SDK do host de memória para que a limpeza de compatibilidade permaneça explícita em vez de
  depender de buscas ad hoc. Subcaminhos reservados do SDK devem ter uso rastreado por responsável;
  exports de auxiliares reservados não utilizados devem ser removidos do SDK público.

  Se um campo de manifesto ainda for aceito, autores de plugins podem continuar usando-o até que
  a documentação e os diagnósticos indiquem o contrário. Código novo deve preferir o substituto
  documentado, mas plugins existentes não devem quebrar durante versões menores
  comuns.

  ## Como migrar

  <Steps>
  <Step title="Migrar auxiliares de carregamento/gravação de configuração de runtime">
    Plugins incluídos devem parar de chamar
    `api.runtime.config.loadConfig()` e
    `api.runtime.config.writeConfigFile(...)` diretamente. Prefira a configuração que já foi
    passada para o caminho de chamada ativo. Handlers de longa duração que precisam do
    snapshot do processo atual podem usar `api.runtime.config.current()`. Ferramentas de agente
    de longa duração devem usar `ctx.getRuntimeConfig()` do contexto da ferramenta dentro de
    `execute` para que uma ferramenta criada antes de uma gravação de configuração ainda veja a
    configuração de runtime atualizada.

    Gravações de configuração devem passar pelos auxiliares transacionais e escolher uma
    política pós-gravação:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Use `afterWrite: { mode: "restart", reason: "..." }` quando o chamador souber que
    a alteração exige uma reinicialização limpa do gateway, e
    `afterWrite: { mode: "none", reason: "..." }` somente quando o chamador for responsável pelo
    acompanhamento e quiser deliberadamente suprimir o planejador de recarregamento.
    Resultados de mutação incluem um resumo tipado `followUp` para testes e logs;
    o gateway continua responsável por aplicar ou agendar a reinicialização.
    `loadConfig` e `writeConfigFile` permanecem como auxiliares de compatibilidade descontinuados
    para plugins externos durante a janela de migração e avisam uma vez com
    o código de compatibilidade `runtime-config-load-write`. Plugins incluídos e código de runtime
    do repositório são protegidos por guardrails de scanner em
    `pnpm check:deprecated-api-usage` e
    `pnpm check:no-runtime-action-load-config`: novo uso em plugin de produção
    falha diretamente, gravações diretas de configuração falham, métodos de servidor gateway devem usar
    o snapshot de runtime da solicitação, auxiliares de envio/ação/cliente de canal de runtime
    devem receber configuração de sua fronteira, e módulos de runtime de longa duração têm
    zero chamadas ambiente permitidas a `loadConfig()`.

    Código novo de plugin também deve evitar importar o barrel amplo de compatibilidade
    `openclaw/plugin-sdk/config-runtime`. Use o subcaminho estreito do SDK que corresponde
    ao trabalho:

    | Necessidade | Importação |
    | --- | --- |
    | Tipos de configuração como `OpenClawConfig` | `openclaw/plugin-sdk/config-contracts` |
    | Asserções de configuração já carregada e lookup de configuração de entrada de plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Leituras do snapshot de runtime atual | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Gravações de configuração | `openclaw/plugin-sdk/config-mutation` |
    | Auxiliares de armazenamento de sessão | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuração de tabela Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Auxiliares de runtime de política de grupo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolução de entrada secreta | `openclaw/plugin-sdk/secret-input-runtime` |
    | Substituições de modelo/sessão | `openclaw/plugin-sdk/model-session-runtime` |

    Plugins incluídos e seus testes são protegidos por scanner contra o barrel amplo
    para que importações e mocks permaneçam locais ao comportamento de que precisam. O barrel amplo
    ainda existe para compatibilidade externa, mas código novo não deve
    depender dele.

  </Step>

  <Step title="Migrar extensões de resultado de ferramenta incorporadas para middleware">
    Plugins incluídos devem substituir handlers de resultado de ferramenta
    `api.registerEmbeddedExtensionFactory(...)` exclusivos do executor incorporado por
    middleware neutro em relação a runtime.

    ```typescript
    // OpenClaw and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["openclaw", "codex"],
    });
    ```

    Atualize o manifesto do plugin ao mesmo tempo:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["openclaw", "codex"]
      }
    }
    ```

    Plugins instalados também podem registrar middleware de resultado de ferramenta quando estiverem
    explicitamente habilitados e declararem cada runtime de destino em
    `contracts.agentToolResultMiddleware`. Registros de middleware instalado não declarados
    são rejeitados.

  </Step>

  <Step title="Migrar handlers nativos de aprovação para fatos de capability">
    Plugins de canal com suporte a aprovação agora expõem comportamento de aprovação nativo por meio de
    `approvalCapability.nativeRuntime` mais o registro compartilhado de contexto de runtime.

    Principais alterações:

    - Substitua `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mova autenticação/entrega específicas de aprovação da fiação legada `plugin.auth` /
      `plugin.approvals` para `approvalCapability`
    - `ChannelPlugin.approvals` foi removido do contrato público de plugin de canal;
      mova campos de entrega/nativo/renderização para `approvalCapability`
    - `plugin.auth` permanece apenas para fluxos de login/logout de canal; hooks de autenticação
      de aprovação ali não são mais lidos pelo núcleo
    - Registre objetos de runtime pertencentes ao canal, como clientes, tokens ou apps Bolt,
      por meio de `openclaw/plugin-sdk/channel-runtime-context`
    - Não envie avisos de reroteamento pertencentes ao plugin a partir de handlers de aprovação nativos;
      o núcleo agora é responsável por avisos roteados para outro lugar a partir dos resultados reais de entrega
    - Ao passar `channelRuntime` para `createChannelManager(...)`, forneça uma
      superfície real `createPluginRuntime().channel`. Stubs parciais são rejeitados.

    Consulte `/plugins/sdk-channel-plugins` para o layout atual da capability de aprovação.

  </Step>

  <Step title="Auditar comportamento de fallback do wrapper do Windows">
    Se o seu plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers `.cmd`/`.bat`
    do Windows não resolvidos agora falham fechados, a menos que você passe explicitamente
    `allowShellFallback: true`.

    ```typescript
    // Before
    const program = applyWindowsSpawnProgramPolicy({ candidate });

    // After
    const program = applyWindowsSpawnProgramPolicy({
      candidate,
      // Only set this for trusted compatibility callers that intentionally
      // accept shell-mediated fallback.
      allowShellFallback: true,
    });
    ```

    Se o seu chamador não depende intencionalmente de fallback de shell, não defina
    `allowShellFallback` e trate o erro lançado em vez disso.

  </Step>

  <Step title="Encontrar importações descontinuadas">
    Pesquise no seu plugin importações de qualquer uma das superfícies descontinuadas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substituir por importações focadas">
    Cada export da superfície antiga mapeia para um caminho de importação moderno específico:

    ```typescript
    // Before (deprecated backwards-compatibility layer)
    import {
      createChannelReplyPipeline,
      createPluginRuntimeStore,
      resolveControlCommandGate,
    } from "openclaw/plugin-sdk/compat";

    // After (modern focused imports)
    import { createChannelReplyPipeline } from "openclaw/plugin-sdk/channel-reply-pipeline";
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import { resolveControlCommandGate } from "openclaw/plugin-sdk/command-auth";
    ```

    Para auxiliares do lado do host, use o runtime de plugin injetado em vez de importar
    diretamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedAgent } from "openclaw/extension-api";
    const result = await runEmbeddedAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros helpers de ponte legada:

    | Importação antiga | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | helpers de armazenamento de sessão | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Replace broad infra-runtime imports">
    `openclaw/plugin-sdk/infra-runtime` ainda existe para compatibilidade
    externa, mas o código novo deve importar a superfície focada de helpers de
    que ele realmente precisa:

    | Necessidade | Importação |
    | --- | --- |
    | Helpers de fila de eventos do sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Helpers de ativação, evento e visibilidade de Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Esvaziamento da fila de entregas pendentes | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria de atividade do canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Caches de desduplicação em memória | `openclaw/plugin-sdk/dedupe-runtime` |
    | Helpers seguros de caminho de arquivo local/mídia | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch ciente de dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Helpers de proxy e fetch protegido | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de política de dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitação/resolução de aprovação | `openclaw/plugin-sdk/approval-runtime` |
    | Payload de resposta de aprovação e helpers de comando | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Helpers de formatação de erros | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de prontidão de transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Helpers de token seguro | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concorrência limitada de tarefas assíncronas | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coerção numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueio assíncrono local ao processo | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueios de arquivo | `openclaw/plugin-sdk/file-lock` |

    Plugins incluídos são protegidos por scanner contra `infra-runtime`, então
    o código do repositório não pode regredir para o barrel amplo.

  </Step>

  <Step title="Migrate channel route helpers">
    O novo código de rota de canal deve usar `openclaw/plugin-sdk/channel-route`.
    Os nomes antigos de chave de rota e alvo comparável permanecem como aliases
    de compatibilidade durante a janela de migração, mas novos plugins devem usar
    os nomes de rota que descrevem o comportamento diretamente:

    | Helper antigo | Helper moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Os helpers de rota modernos normalizam `{ channel, to, accountId, threadId }`
    de forma consistente entre aprovações nativas, supressão de resposta,
    desduplicação de entrada, entrega por cron e roteamento de sessão.

    Não adicione novos usos de `ChannelMessagingAdapter.parseExplicitTarget` nem
    dos helpers de rota carregada baseados em parser (`parseExplicitTargetForLoadedChannel`
    ou `resolveRouteTargetForLoadedChannel`) nem de
    `resolveChannelRouteTargetWithParser(...)` de `plugin-sdk/channel-route`.
    Esses hooks estão obsoletos e permanecem apenas para plugins mais antigos
    durante a janela de migração. Novos plugins de canal devem usar
    `messaging.targetResolver.resolveTarget(...)` para normalização de ID de alvo
    e fallback de diretório ausente, `messaging.inferTargetChatType(...)` quando o core
    precisar de um tipo de par antecipado, e `messaging.resolveOutboundSessionRoute(...)`
    para sessão nativa do provedor e identidade de thread.

  </Step>

  <Step title="Build and test">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referência de caminhos de importação

  <Accordion title="Common import path table">
  | Caminho de importação | Finalidade | Exportações principais |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Auxiliar canônico de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportação guarda-chuva legada para definições/construtores de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportação do esquema de configuração raiz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Auxiliar de entrada de provedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições e construtores focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração | Tradutor de configuração, prompts de lista de permissões, construtores de status de configuração |
  | `plugin-sdk/setup-runtime` | Auxiliares de tempo de execução durante a configuração | `createSetupTranslator`, adaptadores de patch de configuração seguros para importação, auxiliares de notas de pesquisa, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuração delegada |
  | `plugin-sdk/setup-adapter-runtime` | Alias obsoleto de adaptador de configuração | Use `plugin-sdk/setup-runtime` |
  | `plugin-sdk/setup-tools` | Auxiliares de ferramentas de configuração | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Auxiliares de várias contas | Auxiliares de lista/configuração/controle de ação de contas |
  | `plugin-sdk/account-id` | Auxiliares de ID de conta | `DEFAULT_ACCOUNT_ID`, normalização de ID de conta |
  | `plugin-sdk/account-resolution` | Auxiliares de pesquisa de conta | Auxiliares de pesquisa de conta + alternativa padrão |
  | `plugin-sdk/account-helpers` | Auxiliares estreitos de conta | Auxiliares de lista de contas/ação de conta |
  | `plugin-sdk/channel-setup` | Adaptadores do assistente de configuração | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, mais `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de pareamento por DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Fiação de prefixo de resposta, digitação e entrega de origem | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuração e auxiliares de acesso por DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Construtores de esquema de configuração | Somente primitivas compartilhadas de esquema de configuração de canal e o construtor genérico |
  | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração agrupados | Somente plugins agrupados mantidos pelo OpenClaw; novos plugins devem definir esquemas locais do Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Esquemas de configuração agrupados obsoletos | Somente alias de compatibilidade; use `plugin-sdk/bundled-channel-config-schema` para plugins agrupados mantidos |
  | `plugin-sdk/telegram-command-config` | Auxiliares de configuração de comandos do Telegram | Normalização de nomes de comando, corte de descrições, validação de duplicatas/conflitos |
  | `plugin-sdk/channel-policy` | Resolução de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Fachada de compatibilidade obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/inbound-envelope` | Auxiliares de envelope de entrada | Auxiliares compartilhados de rota + construtor de envelope |
  | `plugin-sdk/channel-inbound` | Auxiliares de recebimento de entrada | Construção de contexto, formatação, raízes, executores, despacho de resposta preparada e predicados de despacho |
  | `plugin-sdk/messaging-targets` | Caminho obsoleto de importação de análise de destino | Use `plugin-sdk/channel-targets` para auxiliares genéricos de análise de destino, `plugin-sdk/channel-route` para comparação de rotas e `messaging.targetResolver` / `messaging.resolveOutboundSessionRoute` pertencentes ao Plugin para resolução de destino específica do provedor |
  | `plugin-sdk/outbound-media` | Auxiliares de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-send-deps` | Fachada de compatibilidade obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/channel-outbound` | Auxiliares do ciclo de vida de mensagens de saída | Adaptadores de mensagens, recibos, auxiliares de envio durável, auxiliares de pré-visualização/transmissão ao vivo, opções de resposta, auxiliares de ciclo de vida, identidade de saída e planejamento de carga útil |
  | `plugin-sdk/channel-streaming` | Fachada de compatibilidade obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/outbound-runtime` | Fachada de compatibilidade obsoleta | Use `plugin-sdk/channel-outbound` |
  | `plugin-sdk/thread-bindings-runtime` | Auxiliares de vinculação de thread | Ciclo de vida de vinculação de thread e auxiliares de adaptador |
  | `plugin-sdk/agent-media-payload` | Auxiliares legados de carga útil de mídia | Construtor de carga útil de mídia do agente para layouts de campos legados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidade obsoleto | Somente utilitários legados de tempo de execução de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Auxiliares amplos de tempo de execução | Auxiliares de tempo de execução/logging/backup/instalação de Plugin |
  | `plugin-sdk/runtime-env` | Auxiliares estreitos de ambiente de tempo de execução | Auxiliares de logger/ambiente de tempo de execução, tempo limite, repetição e backoff |
  | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de tempo de execução de Plugin | Auxiliares de comandos/hooks/http/interativos de Plugin |
  | `plugin-sdk/hook-runtime` | Auxiliares de pipeline de hooks | Auxiliares compartilhados de pipeline de Webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Auxiliares de tempo de execução lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Auxiliares de processo | Auxiliares compartilhados de exec |
  | `plugin-sdk/cli-runtime` | Auxiliares de tempo de execução da CLI | Formatação de comandos, esperas, auxiliares de versão |
  | `plugin-sdk/gateway-runtime` | Auxiliares do Gateway | Cliente do Gateway, auxiliar de início pronto para loop de eventos e auxiliares de patch de status de canal |
  | `plugin-sdk/config-runtime` | Shim obsoleto de compatibilidade de configuração | Prefira `config-contracts`, `plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Auxiliares de comandos do Telegram | Auxiliares de validação de comandos do Telegram com fallback estável quando a superfície de contrato agrupada do Telegram está indisponível |
  | `plugin-sdk/approval-runtime` | Auxiliares de prompt de aprovação | Carga útil de aprovação de exec/Plugin, auxiliares de capacidade/perfil de aprovação, auxiliares de roteamento/tempo de execução de aprovação nativa e formatação estruturada de caminho de exibição de aprovação |
  | `plugin-sdk/approval-auth-runtime` | Auxiliares de autenticação de aprovação | Resolução de aprovador, autenticação de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Auxiliares de cliente de aprovação | Auxiliares de perfil/filtro de aprovação nativa de exec |
  | `plugin-sdk/approval-delivery-runtime` | Auxiliares de entrega de aprovação | Adaptadores nativos de capacidade/entrega de aprovação |
  | `plugin-sdk/approval-gateway-runtime` | Auxiliares de Gateway de aprovação | Auxiliar compartilhado de resolução de Gateway de aprovação |
  | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares de adaptador de aprovação | Auxiliares leves de carregamento de adaptador de aprovação nativa para pontos de entrada quentes de canal |
  | `plugin-sdk/approval-handler-runtime` | Auxiliares de manipulador de aprovação | Auxiliares mais amplos de tempo de execução de manipulador de aprovação; prefira as interfaces mais estreitas de adaptador/Gateway quando forem suficientes |
  | `plugin-sdk/approval-native-runtime` | Auxiliares de destino de aprovação | Auxiliares nativos de vinculação de destino/conta de aprovação |
  | `plugin-sdk/approval-reply-runtime` | Auxiliares de resposta de aprovação | Auxiliares de carga útil de resposta de aprovação de exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Auxiliares de contexto de tempo de execução de canal | Auxiliares genéricos de registrar/obter/observar contexto de tempo de execução de canal |
  | `plugin-sdk/security-runtime` | Auxiliares de segurança | Auxiliares compartilhados de confiança, controle de DM, arquivos/caminhos limitados à raiz, conteúdo externo e coleta de segredos |
  | `plugin-sdk/ssrf-policy` | Auxiliares de política de SSRF | Auxiliares de lista de permissões de host e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Auxiliares de tempo de execução de SSRF | Dispatcher fixado, fetch protegido, auxiliares de política de SSRF |
  | `plugin-sdk/system-event-runtime` | Auxiliares de eventos do sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Auxiliares de Heartbeat | Auxiliares de despertar, evento e visibilidade de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Auxiliares de fila de entrega | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Auxiliares de atividade de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Auxiliares de deduplicação | Caches de deduplicação em memória |
  | `plugin-sdk/file-access-runtime` | Auxiliares de acesso a arquivos | Auxiliares seguros de caminho de arquivo/mídia local |
  | `plugin-sdk/transport-ready-runtime` | Auxiliares de prontidão de transporte | `waitForTransportReady` |
  | `plugin-sdk/exec-approvals-runtime` | Auxiliares de política de aprovação de exec | `loadExecApprovals`, `resolveExecApprovalsFromFile`, `ExecApprovalsFile` |
  | `plugin-sdk/collection-runtime` | Auxiliares de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Auxiliares de controle de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Auxiliares de formatação de erro | `formatUncaughtError`, `isApprovalNotFoundError`, auxiliares de grafo de erros |
  | `plugin-sdk/fetch-runtime` | Auxiliares de fetch/proxy encapsulado | `resolveFetch`, auxiliares de proxy, auxiliares de opções de EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Auxiliares de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Auxiliares de repetição | `RetryConfig`, `retryAsync`, executores de política |
  | `plugin-sdk/allow-from` | Formatação de lista de permissões e mapeamento de entrada | `formatAllowFromLowercase`, `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Auxiliares de controle de comandos e superfície de comandos | `resolveControlCommandGate`, auxiliares de autorização de remetente, auxiliares de registro de comandos incluindo formatação dinâmica de menu de argumentos |
  | `plugin-sdk/command-status` | Renderizadores de status/ajuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análise de entrada secreta | Auxiliares de entrada secreta |
  | `plugin-sdk/webhook-ingress` | Auxiliares de solicitação de Webhook | Utilitários de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Auxiliares de guarda de corpo de Webhook | Auxiliares de leitura/limite de corpo de solicitação |
  | `plugin-sdk/reply-runtime` | Tempo de execução compartilhado de resposta | Despacho de entrada, Heartbeat, planejador de resposta, divisão em partes |
  | `plugin-sdk/reply-dispatch-runtime` | Auxiliares estreitos de despacho de resposta | Finalização, despacho de provedor e auxiliares de rótulo de conversa |
  | `plugin-sdk/reply-history` | Auxiliares de histórico de respostas | `createChannelHistoryWindow`; exportações obsoletas de compatibilidade de auxiliares de mapa como `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry` e `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Auxiliares de partes de resposta | Auxiliares de divisão de texto/markdown em partes |
  | `plugin-sdk/session-store-runtime` | Auxiliares de armazenamento de sessão | Auxiliares de caminho de armazenamento + atualizado em |
  | `plugin-sdk/state-paths` | Auxiliares de caminho de estado | Auxiliares de diretório de estado e OAuth |
  | `plugin-sdk/routing` | Auxiliares de roteamento/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, auxiliares de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Auxiliares de status de canal | Construtores de resumo de status de canal/conta, padrões de estado de runtime, auxiliares de metadados de problema |
  | `plugin-sdk/target-resolver-runtime` | Auxiliares de resolução de destino | Auxiliares compartilhados de resolução de destino |
  | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de strings | Auxiliares de normalização de slug/string |
  | `plugin-sdk/request-url` | Auxiliares de URL de requisição | Extrair URLs em string de entradas semelhantes a requisições |
  | `plugin-sdk/run-command` | Auxiliares de comando temporizado | Executor de comando temporizado com stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetros | Leitores comuns de parâmetros de ferramenta/CLI |
  | `plugin-sdk/tool-payload` | Extração de payload de ferramenta | Extrair payloads normalizados de objetos de resultado de ferramenta |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extrair campos canônicos de destino de envio de args de ferramenta |
  | `plugin-sdk/temp-path` | Auxiliares de caminho temporário | Auxiliares compartilhados de caminho de download temporário |
  | `plugin-sdk/logging-core` | Auxiliares de logging | Logger de subsistema e auxiliares de redação |
  | `plugin-sdk/markdown-table-runtime` | Auxiliares de tabela Markdown | Auxiliares de modo de tabela Markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de payload de resposta |
  | `plugin-sdk/provider-setup` | Auxiliares selecionados de configuração de provedor local/auto-hospedado | Auxiliares de descoberta/configuração de provedor auto-hospedado |
  | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados de configuração de provedor auto-hospedado compatível com OpenAI | Os mesmos auxiliares de descoberta/configuração de provedor auto-hospedado |
  | `plugin-sdk/provider-auth-runtime` | Auxiliares de autenticação de runtime de provedor | Auxiliares de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Auxiliares de configuração de chave de API de provedor | Auxiliares de onboarding/gravação de perfil de chave de API |
  | `plugin-sdk/provider-auth-result` | Auxiliares de resultado de autenticação de provedor | Construtor padrão de resultado de autenticação OAuth |
  | `plugin-sdk/provider-selection-runtime` | Auxiliares de seleção de provedor | Seleção de provedor configurado ou automático e mesclagem de configuração bruta de provedor |
  | `plugin-sdk/provider-env-vars` | Auxiliares de variáveis de ambiente de provedor | Auxiliares de consulta de variável de ambiente de autenticação de provedor |
  | `plugin-sdk/provider-model-shared` | Auxiliares compartilhados de modelo/replay de provedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, auxiliares de endpoint de provedor e auxiliares de normalização de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Auxiliares compartilhados de catálogo de provedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de onboarding de provedor | Auxiliares de configuração de onboarding |
  | `plugin-sdk/provider-http` | Auxiliares HTTP de provedor | Auxiliares genéricos de capacidade HTTP/endpoint de provedor, incluindo auxiliares de formulário multipart para transcrição de áudio |
  | `plugin-sdk/provider-web-fetch` | Auxiliares de web-fetch de provedor | Auxiliares de registro/cache de provedor de web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Auxiliares de configuração de web-search de provedor | Auxiliares estreitos de configuração/credencial de web-search para provedores que não precisam de fiação de ativação de Plugin |
  | `plugin-sdk/provider-web-search-contract` | Auxiliares de contrato de web-search de provedor | Auxiliares estreitos de contrato de configuração/credencial de web-search, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
  | `plugin-sdk/provider-web-search` | Auxiliares de web-search de provedor | Auxiliares de registro/cache/runtime de provedor de web-search |
  | `plugin-sdk/provider-tools` | Auxiliares de compatibilidade de ferramenta/schema de provedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks` e limpeza de schema + diagnósticos de DeepSeek/Gemini/OpenAI |
  | `plugin-sdk/provider-usage` | Auxiliares de uso de provedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros auxiliares de uso de provedor |
  | `plugin-sdk/provider-stream` | Auxiliares de wrapper de stream de provedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e auxiliares compartilhados de wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte de provedor | Auxiliares de transporte nativo de provedor, como fetch protegido, extração de texto de resultado de ferramenta, transformações de mensagens de transporte e streams graváveis de eventos de transporte |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Auxiliares compartilhados de mídia | Auxiliares de busca/transformação/armazenamento de mídia, sondagem de dimensões de vídeo baseada em ffprobe e construtores de payload de mídia |
  | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de geração de mídia | Auxiliares compartilhados de failover, seleção de candidatos e mensagem de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Auxiliares de compreensão de mídia | Tipos de provedor de compreensão de mídia mais exports de auxiliares de imagem/áudio voltados para provedores |
  | `plugin-sdk/text-runtime` | Export amplo obsoleto de compatibilidade de texto | Use `string-coerce-runtime`, `text-chunking`, `text-utility-runtime` e `logging-core` |
  | `plugin-sdk/text-chunking` | Auxiliares de fragmentação de texto | Auxiliar de fragmentação de texto de saída |
  | `plugin-sdk/speech` | Auxiliares de fala | Tipos de provedor de fala mais auxiliares de diretiva, registro e validação voltados para provedores, além de construtor TTS compatível com OpenAI |
  | `plugin-sdk/speech-core` | Núcleo compartilhado de fala | Tipos de provedor de fala, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Auxiliares de transcrição em tempo real | Tipos de provedor, auxiliares de registro e auxiliar compartilhado de sessão WebSocket |
  | `plugin-sdk/realtime-voice` | Auxiliares de voz em tempo real | Tipos de provedor, auxiliares de registro/resolução, auxiliares de sessão de ponte, filas compartilhadas de resposta falada de agente, controle de voz de execução ativa, saúde de transcrição/evento, supressão de eco, correspondência de perguntas de consulta, coordenação de consulta forçada, rastreamento de contexto de turno, rastreamento de atividade de saída e auxiliares de consulta rápida de contexto |
  | `plugin-sdk/image-generation` | Auxiliares de geração de imagem | Tipos de provedor de geração de imagem mais auxiliares de URL de ativo/dados de imagem e o construtor de provedor de imagem compatível com OpenAI |
  | `plugin-sdk/image-generation-core` | Núcleo compartilhado de geração de imagem | Tipos de geração de imagem, failover, autenticação e auxiliares de registro |
  | `plugin-sdk/music-generation` | Auxiliares de geração de música | Tipos de provedor/requisição/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartilhado de geração de música | Tipos de geração de música, auxiliares de failover, lookup de provedor e parsing de ref de modelo |
  | `plugin-sdk/video-generation` | Auxiliares de geração de vídeo | Tipos de provedor/requisição/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Núcleo compartilhado de geração de vídeo | Tipos de geração de vídeo, auxiliares de failover, lookup de provedor e parsing de ref de modelo |
  | `plugin-sdk/interactive-runtime` | Auxiliares de resposta interativa | Normalização/redução de payload de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivos de configuração de canal | Primitivos estreitos de schema de configuração de canal |
  | `plugin-sdk/channel-config-writes` | Auxiliares de gravação de configuração de canal | Auxiliares de autorização de gravação de configuração de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exports compartilhados de prelúdio de Plugin de canal |
  | `plugin-sdk/channel-status` | Auxiliares de status de canal | Auxiliares compartilhados de snapshot/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Auxiliares de configuração de allowlist | Auxiliares de edição/leitura de configuração de allowlist |
  | `plugin-sdk/group-access` | Auxiliares de acesso a grupo | Auxiliares compartilhados de decisão de acesso a grupo |
  | `plugin-sdk/direct-dm`, `plugin-sdk/direct-dm-access` | Fachadas de compatibilidade obsoletas | Use `plugin-sdk/channel-inbound` |
  | `plugin-sdk/direct-dm-guard-policy` | Auxiliares de guarda de DM direto | Auxiliares estreitos de política de guarda pré-cripto |
  | `plugin-sdk/extension-shared` | Auxiliares compartilhados de extensão | Primitivos auxiliares de canal passivo/status e proxy ambiente |
  | `plugin-sdk/webhook-targets` | Auxiliares de destino de Webhook | Registro de destino de Webhook e auxiliares de instalação de rota |
  | `plugin-sdk/webhook-path` | Alias obsoleto de caminho de webhook | Use `plugin-sdk/webhook-ingress` |
  | `plugin-sdk/web-media` | Auxiliares compartilhados de mídia web | Auxiliares de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexportação obsoleta de compatibilidade Zod | Importe `zod` de `zod` diretamente |
  | `plugin-sdk/memory-core` | Auxiliares memory-core empacotados | Superfície de auxiliares de gerenciador/configuração/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime de mecanismo de memória | Fachada de runtime de índice/busca de memória |
  | `plugin-sdk/memory-core-host-embedding-registry` | Registro de embedding de memória | Auxiliares leves de registro de provedor de embedding de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mecanismo de fundação do host de memória | Exports de mecanismo de fundação do host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mecanismo de embedding do host de memória | Contratos de embedding de memória, acesso ao registro, provedor local e auxiliares genéricos de lote/remotos; provedores remotos concretos vivem em seus Plugins proprietários |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mecanismo QMD do host de memória | Exports de mecanismo QMD do host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Mecanismo de armazenamento do host de memória | Exports de mecanismo de armazenamento do host de memória |
  | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais do host de memória | Auxiliares multimodais do host de memória |
  | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta do host de memória | Auxiliares de consulta do host de memória |
  | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredo do host de memória | Auxiliares de segredo do host de memória |
  | `plugin-sdk/memory-core-host-events` | Alias obsoleto de evento de memória | Use `plugin-sdk/memory-host-events` |
  | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória | Auxiliares de status do host de memória |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime de CLI do host de memória | Auxiliares de runtime de CLI do host de memória |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime central do host de memória | Auxiliares de runtime central do host de memória |
  | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivo/runtime do host de memória | Auxiliares de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-core` | Alias de runtime central do host de memória | Alias neutro quanto a fornecedor para auxiliares de runtime central do host de memória |
  | `plugin-sdk/memory-host-events` | Alias de diário de eventos do host de memória | Alias neutro quanto a fornecedor para auxiliares de diário de eventos do host de memória |
  | `plugin-sdk/memory-host-files` | Alias obsoleto de arquivo/runtime de memória | Use `plugin-sdk/memory-core-host-runtime-files` |
  | `plugin-sdk/memory-host-markdown` | Auxiliares de markdown gerenciado | Auxiliares compartilhados de markdown gerenciado para Plugins adjacentes à memória |
  | `plugin-sdk/memory-host-search` | Fachada de busca de memória ativa | Fachada preguiçosa de runtime do gerenciador de busca de memória ativa |
  | `plugin-sdk/memory-host-status` | Alias obsoleto de status do host de memória | Use `plugin-sdk/memory-core-host-status` |
  | `plugin-sdk/testing` | Utilitários de teste | Barrel de compatibilidade obsoleto local ao repo; use subcaminhos de teste focados e locais ao repo, como `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` e `plugin-sdk/test-fixtures` |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não toda a
superfície do SDK. O inventário do ponto de entrada do compilador fica em
`scripts/lib/plugin-sdk-entrypoints.json`; as exportações de pacote são geradas a partir
do subconjunto público.

Os seams auxiliares reservados de plugins agrupados foram retirados do mapa de
exportação do SDK público, exceto facades de compatibilidade documentadas explicitamente, como o
shim obsoleto `plugin-sdk/discord` mantido para o pacote publicado
`@openclaw/discord@2026.3.13`. Auxiliares específicos do proprietário ficam dentro do
pacote do plugin proprietário; o comportamento compartilhado do host deve passar por contratos genéricos do SDK,
como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime`
e `plugin-sdk/plugin-config-runtime`.

Use a importação mais estreita que corresponda ao trabalho. Se você não encontrar uma exportação,
verifique o código-fonte em `src/plugin-sdk/` ou pergunte aos mantenedores qual contrato genérico
deve ser o proprietário dela.

## Depreciações ativas

Depreciações mais estreitas que se aplicam ao SDK de plugins, ao contrato de provedor,
à superfície de runtime e ao manifesto. Cada uma ainda funciona hoje, mas será removida
em uma futura versão major. A entrada abaixo de cada item mapeia a API antiga para sua
substituição canônica.

<AccordionGroup>
  <Accordion title="command-auth help builders → command-status">
    **Antigo (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Novo (`openclaw/plugin-sdk/command-status`)**: mesmas assinaturas, mesmas
    exportações - apenas importadas do subcaminho mais estreito. `command-auth`
    as reexporta como stubs de compatibilidade.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Mention gating helpers → resolveInboundMentionDecision">
    **Antigo**: `resolveInboundMentionRequirement({ facts, policy })` e
    `shouldDropInboundForMention(...)` de
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Novo**: `resolveInboundMentionDecision({ facts, policy })` - retorna um
    único objeto de decisão em vez de duas chamadas separadas.

    Plugins de canal downstream (Slack, Discord, Matrix, MS Teams) já
    migraram.

  </Accordion>

  <Accordion title="Channel runtime shim and channel actions helpers">
    `openclaw/plugin-sdk/channel-runtime` é um shim de compatibilidade para plugins de canal
    mais antigos. Não o importe em código novo; use
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    runtime.

    Os auxiliares `channelActions*` em `openclaw/plugin-sdk/channel-actions` estão
    obsoletos junto com exportações de canal de "actions" brutas. Exponha capacidades
    pela superfície semântica `presentation` em vez disso - plugins de canal
    declaram o que renderizam (cards, botões, seletores), não quais nomes de ação brutos
    aceitam.

  </Accordion>

  <Accordion title="Web search provider tool() helper → createTool() on the plugin">
    **Antigo**: fábrica `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Novo**: implemente `createTool(...)` diretamente no plugin de provedor.
    O OpenClaw não precisa mais do auxiliar do SDK para registrar o wrapper da ferramenta.

  </Accordion>

  <Accordion title="Plaintext channel envelopes → BodyForAgent">
    **Antigo**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) para criar um envelope de prompt em texto simples
    a partir de mensagens de canal recebidas.

    **Novo**: `BodyForAgent` mais blocos estruturados de contexto do usuário. Plugins de canal
    anexam metadados de roteamento (thread, tópico, responder a, reações) como
    campos tipados em vez de concatená-los em uma string de prompt. O auxiliar
    `formatAgentEnvelope(...)` ainda é compatível para envelopes sintetizados
    voltados ao assistente, mas envelopes de entrada em texto simples estão sendo
    descontinuados.

    Áreas afetadas: `inbound_claim`, `message_received` e qualquer plugin de
    canal personalizado que pós-processava o texto de `channelEnvelope`.

  </Accordion>

  <Accordion title="deactivate hook → gateway_stop">
    **Antigo**: `api.on("deactivate", handler)`.

    **Novo**: `api.on("gateway_stop", handler)`. O evento e o contexto são o
    mesmo contrato de limpeza de desligamento; apenas o nome do hook muda.

    ```typescript
    // Before
    api.on("deactivate", async (event, ctx) => {
      await stopPluginService(ctx);
    });

    // After
    api.on("gateway_stop", async (event, ctx) => {
      await stopPluginService(ctx);
    });
    ```

    `deactivate` permanece conectado como alias de compatibilidade obsoleto até depois de
    2026-08-16.

  </Accordion>

  <Accordion title="subagent_spawning hook → core thread binding">
    **Antigo**: `api.on("subagent_spawning", handler)` retornando
    `threadBindingReady` ou `deliveryOrigin`.

    **Novo**: deixe o core preparar associações de subagente `thread: true` por meio do
    adaptador de associação de sessão de canal. Use `api.on("subagent_spawned", handler)`
    apenas para observação pós-lançamento.

    ```typescript
    // Before
    api.on("subagent_spawning", async () => ({
      status: "ok",
      threadBindingReady: true,
      deliveryOrigin: { channel: "discord", to: "channel:123", threadId: "456" },
    }));

    // After
    api.on("subagent_spawned", async (event) => {
      await observeSubagentLaunch(event);
    });
    ```

    `subagent_spawning`, `PluginHookSubagentSpawningEvent`,
    `PluginHookSubagentSpawningResult` e
    `SubagentLifecycleHookRunner.runSubagentSpawning(...)` permanecem apenas como
    superfícies de compatibilidade obsoletas enquanto plugins externos migram.

  </Accordion>

  <Accordion title="Provider discovery types → provider catalog types">
    Quatro aliases de tipo de descoberta agora são wrappers finos sobre os
    tipos da era de catálogo:

    | Alias antigo              | Novo tipo                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Além do bag estático legado `ProviderCapabilities` - plugins de provedor
    devem usar hooks explícitos de provedor, como `buildReplayPolicy`,
    `normalizeToolSchemas` e `wrapStreamFn`, em vez de um objeto estático.

  </Accordion>

  <Accordion title="Thinking policy hooks → resolveThinkingProfile">
    **Antigo** (três hooks separados em `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Novo**: um único `resolveThinkingProfile(ctx)` que retorna um
    `ProviderThinkingProfile` com o `id` canônico, `label` opcional e
    lista ranqueada de níveis. O OpenClaw rebaixa automaticamente valores armazenados obsoletos
    pela classificação do perfil.

    O contexto inclui `provider`, `modelId`, `reasoning` mesclado opcional
    e fatos `compat` de modelo mesclados opcionais. Plugins de provedor podem usar esses
    fatos de catálogo para expor um perfil específico do modelo apenas quando o contrato de
    solicitação configurado tiver suporte a ele.

    Implemente um hook em vez de três. Os hooks legados continuam funcionando durante
    a janela de depreciação, mas não são compostos com o resultado do perfil.

  </Accordion>

  <Accordion title="External auth providers → contracts.externalAuthProviders">
    **Antigo**: implementar hooks de autenticação externa sem declarar o provedor
    no manifesto do plugin.

    **Novo**: declare `contracts.externalAuthProviders` no manifesto do plugin
    **e** implemente `resolveExternalAuthProfiles(...)`.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Provider env-var lookup → setup.providers[].envVars">
    **Campo de manifesto antigo**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Novo**: espelhe a mesma busca de variável de ambiente em `setup.providers[].envVars`
    no manifesto. Isso consolida metadados de ambiente de configuração/status em um só
    lugar e evita iniciar o runtime do plugin apenas para responder a buscas de
    variáveis de ambiente.

    `providerAuthEnvVars` permanece compatível por meio de um adaptador de compatibilidade
    até a janela de depreciação fechar.

  </Accordion>

  <Accordion title="Memory plugin registration → registerMemoryCapability">
    **Antigo**: três chamadas separadas -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Novo**: uma chamada na API de estado de memória -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mesmos slots, uma única chamada de registro. Auxiliares aditivos de prompt e corpus
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`) não são
    afetados.

  </Accordion>

  <Accordion title="Memory embedding provider API">
    **Antigo**: `api.registerMemoryEmbeddingProvider(...)` mais
    `contracts.memoryEmbeddingProviders`.

    **Novo**: `api.registerEmbeddingProvider(...)` mais
    `contracts.embeddingProviders`.

    O contrato genérico de provedor de embeddings é reutilizável fora da memória e é
    o caminho compatível para novos provedores. A API de registro específica de memória
    permanece conectada como compatibilidade obsoleta enquanto provedores existentes migram.
    Relatórios de inspeção de plugins sinalizam o uso não agrupado como dívida de compatibilidade.

  </Accordion>

  <Accordion title="Subagent session messages types renamed">
    Dois aliases de tipo legados ainda exportados de `src/plugins/runtime/types.ts`:

    | Antigo                        | Novo                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    O método de runtime `readSession` está obsoleto em favor de
    `getSessionMessages`. Mesma assinatura; o método antigo chama o
    novo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Antigo**: `runtime.tasks.flow` (singular) retornava um acessador de fluxo de tarefas ao vivo.

    **Novo**: `runtime.tasks.managedFlows` mantém o runtime de mutação de TaskFlow
    gerenciado para plugins que criam, atualizam, cancelam ou executam tarefas filhas a partir de um
    fluxo. Use `runtime.tasks.flows` quando o plugin precisar apenas de leituras baseadas em DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Embedded extension factories → agent tool-result middleware">
    Coberto em "Como migrar → Migrar extensões embutidas de resultado de ferramenta para
    middleware" acima. Incluído aqui por completude: o caminho removido exclusivo do executor embutido
    `api.registerEmbeddedExtensionFactory(...)` é substituído por
    `api.registerAgentToolResultMiddleware(...)` com uma lista explícita de runtime
    em `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="OpenClawSchemaType alias → OpenClawConfig">
    `OpenClawSchemaType` reexportado de `openclaw/plugin-sdk` agora é um
    alias de uma linha para `OpenClawConfig`. Prefira o nome canônico.

    ```typescript
    // Before
    import type { OpenClawSchemaType } from "openclaw/plugin-sdk";
    // After
    import type { OpenClawConfig } from "openclaw/plugin-sdk/config-schema";
    ```

  </Accordion>
</AccordionGroup>

<Note>
Depreciações no nível de extensão (dentro de plugins agrupados de canal/provedor em
`extensions/`) são rastreadas dentro de seus próprios barrels `api.ts` e `runtime-api.ts`.
Elas não afetam contratos de plugins de terceiros e não estão listadas
aqui. Se você consumir diretamente o barrel local de um plugin agrupado, leia os
comentários de depreciação nesse barrel antes de fazer upgrade.
</Note>

## Cronograma de remoção

| Quando                 | O que acontece                                                                  |
| ---------------------- | ------------------------------------------------------------------------------- |
| **Agora**              | Superfícies obsoletas emitem avisos em tempo de execução                        |
| **Próxima versão principal** | Superfícies obsoletas serão removidas; plugins que ainda as usam falharão |

Todos os plugins principais já foram migrados. Plugins externos devem migrar
antes da próxima versão principal.

## Suprimindo os avisos temporariamente

Defina estas variáveis de ambiente enquanto você trabalha na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta é uma saída temporária, não uma solução permanente.

## Relacionado

- [Primeiros passos](/pt-BR/plugins/building-plugins) - crie seu primeiro plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - referência completa de importação por subcaminho
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) - criando plugins de canal
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) - criando plugins de provedor
- [Internos de Plugin](/pt-BR/plugins/architecture) - análise aprofundada da arquitetura
- [Manifesto do Plugin](/pt-BR/plugins/manifest) - referência do esquema do manifesto
