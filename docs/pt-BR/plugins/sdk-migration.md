---
read_when:
    - Você vê o aviso OPENCLAW_PLUGIN_SDK_COMPAT_DEPRECATED
    - Você vê o aviso OPENCLAW_EXTENSION_API_DEPRECATED
    - Você usou api.registerEmbeddedExtensionFactory antes do OpenClaw 2026.4.25
    - Você está atualizando um plugin para a arquitetura moderna de plugins
    - Você mantém um Plugin externo do OpenClaw
sidebarTitle: Migrate to SDK
summary: Migrar da camada legada de retrocompatibilidade para o SDK moderno de Plugin
title: Migração do SDK de Plugin
x-i18n:
    generated_at: "2026-05-06T09:08:33Z"
    model: gpt-5.5
    provider: openai
    source_hash: f629f6e3f9a0c122f3065d9b0b6b418e1c1ba29d42aff9ed025d61189be3e42a
    source_path: plugins/sdk-migration.md
    workflow: 16
---

O OpenClaw passou de uma ampla camada de compatibilidade retroativa para uma arquitetura moderna de plugins
com importações focadas e documentadas. Se seu plugin foi criado antes
da nova arquitetura, este guia ajuda você a migrar.

## O que está mudando

O sistema antigo de plugins fornecia duas superfícies amplamente abertas que permitiam aos plugins importar
tudo de que precisavam a partir de um único ponto de entrada:

- **`openclaw/plugin-sdk/compat`** - uma única importação que reexportava dezenas de
  auxiliares. Ela foi introduzida para manter plugins antigos baseados em hooks funcionando enquanto a
  nova arquitetura de plugins estava sendo criada.
- **`openclaw/plugin-sdk/infra-runtime`** - um amplo barrel de auxiliares de runtime que
  misturava eventos do sistema, estado de heartbeat, filas de entrega, auxiliares de fetch/proxy,
  auxiliares de arquivos, tipos de aprovação e utilitários não relacionados.
- **`openclaw/plugin-sdk/config-runtime`** - um amplo barrel de compatibilidade de configuração
  que ainda carrega auxiliares diretos obsoletos de carregamento/gravação durante a janela de migração.
- **`openclaw/extension-api`** - uma ponte que dava aos plugins acesso direto a
  auxiliares do lado do host, como o executor de agente incorporado.
- **`api.registerEmbeddedExtensionFactory(...)`** - um hook removido de extensão empacotada exclusiva do Pi
  que podia observar eventos do executor incorporado, como
  `tool_result`.

As superfícies amplas de importação agora estão **obsoletas**. Elas ainda funcionam em runtime,
mas novos plugins não devem usá-las, e plugins existentes devem migrar antes
que a próxima versão principal as remova. A API de registro de fábrica de extensão incorporada exclusiva do Pi
foi removida; use middleware de resultado de ferramenta em vez disso.

O OpenClaw não remove nem reinterpreta comportamento documentado de plugins na mesma
alteração que introduz uma substituição. Alterações incompatíveis de contrato devem primeiro passar
por um adaptador de compatibilidade, diagnósticos, documentação e uma janela de descontinuação.
Isso se aplica a importações do SDK, campos de manifesto, APIs de configuração, hooks e comportamento
de registro em runtime.

<Warning>
  A camada de compatibilidade retroativa será removida em uma versão principal futura.
  Plugins que ainda importarem dessas superfícies deixarão de funcionar quando isso acontecer.
  Registros de fábrica de extensão incorporada exclusiva do Pi já não são mais carregados.
</Warning>

## Por que isso mudou

A abordagem antiga causava problemas:

- **Inicialização lenta** - importar um auxiliar carregava dezenas de módulos não relacionados
- **Dependências circulares** - reexportações amplas facilitavam a criação de ciclos de importação
- **Superfície de API pouco clara** - não havia como saber quais exportações eram estáveis vs. internas

O SDK moderno de plugins corrige isso: cada caminho de importação (`openclaw/plugin-sdk/\<subpath\>`)
é um módulo pequeno e autocontido, com um propósito claro e contrato documentado.

Seams legados de conveniência de provedor para canais empacotados também foram removidos.
Seams auxiliares com marca de canal eram atalhos privados do monorepo, não contratos estáveis
de plugins. Use subcaminhos genéricos e restritos do SDK em vez disso. Dentro do workspace de plugins
empacotados, mantenha auxiliares de propriedade do provedor no próprio `api.ts` ou
`runtime-api.ts` desse plugin.

Exemplos atuais de provedores empacotados:

- Anthropic mantém auxiliares de stream específicos do Claude em seu próprio seam `api.ts` /
  `contract-api.ts`
- OpenAI mantém builders de provedor, auxiliares de modelo padrão e builders de provedor em tempo real
  em seu próprio `api.ts`
- OpenRouter mantém builder de provedor e auxiliares de onboarding/configuração em seu próprio
  `api.ts`

## Plano de migração do Talk e voz em tempo real

O código de voz em tempo real, telefonia, reuniões e Talk no navegador está migrando de
controle de turnos local à superfície para um controlador compartilhado de sessão do Talk exportado por
`openclaw/plugin-sdk/realtime-voice`. O novo controlador é responsável pelo envelope comum de eventos do Talk,
estado de turno ativo, estado de captura, estado de áudio de saída, histórico recente
de eventos e rejeição de turnos obsoletos. Plugins de provedor devem continuar sendo responsáveis por
sessões em tempo real específicas do fornecedor; plugins de superfície devem continuar sendo responsáveis por captura,
reprodução, telefonia e particularidades de reunião.

Esta migração do Talk é intencionalmente incompatível e limpa:

1. Mantenha o controlador compartilhado/primitivos de runtime em
   `plugin-sdk/realtime-voice`.
2. Migre superfícies empacotadas para o controlador compartilhado: relay do navegador,
   handoff de sala gerenciada, chamada de voz em tempo real, STT por streaming em chamada de voz, Google
   Meet em tempo real e push-to-talk nativo.
3. Substitua as famílias antigas de RPC do Talk pela API final `talk.session.*` e
   `talk.client.*`.
4. Anuncie um único canal de eventos ao vivo do Talk em
   `hello-ok.features.events` do Gateway: `talk.event`.
5. Exclua o endpoint HTTP antigo de tempo real e qualquer caminho de substituição de instruções
   em tempo de requisição.

Código novo não deve chamar `createTalkEventSequencer(...)` diretamente, a menos que esteja
implementando um adaptador de baixo nível ou fixture de teste. Prefira o controlador compartilhado
para que eventos com escopo de turno não possam ser emitidos sem um id de turno, chamadas obsoletas de `turnEnd` /
`turnCancel` não possam limpar um turno ativo mais novo, e eventos de ciclo de vida
de áudio de saída permaneçam consistentes entre telefonia, reuniões, relay do navegador, handoff de sala gerenciada
e clientes nativos do Talk.

O formato alvo da API pública é:

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
```

Sessões WebRTC/websocket de provedor pertencentes ao navegador usam `talk.client.create`,
porque o navegador é responsável pela negociação do provedor e pelo transporte de mídia, enquanto o
Gateway é responsável por credenciais, instruções e política de ferramentas. `talk.session.*` é a
superfície comum gerenciada pelo Gateway para tempo real via gateway-relay, transcrição via gateway-relay
e sessões nativas gerenciadas de STT/TTS em sala.

Configurações legadas que colocavam seletores em tempo real ao lado de `talk.provider` /
`talk.providers` devem ser reparadas com `openclaw doctor --fix`; o Talk em runtime
não reinterpreta configuração de provedor de fala/TTS como configuração de provedor em tempo real.

As combinações compatíveis de `talk.session.create` são intencionalmente pequenas:

| Modo            | Transporte      | Cérebro         | Responsável        | Observações                                                                                                        |
| --------------- | --------------- | --------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| `realtime`      | `gateway-relay` | `agent-consult` | Gateway            | Áudio full-duplex do provedor encaminhado pelo Gateway; chamadas de ferramentas são roteadas pela ferramenta agent-consult. |
| `transcription` | `gateway-relay` | `none`          | Gateway            | Apenas STT por streaming; chamadores enviam áudio de entrada e recebem eventos de transcrição.                     |
| `stt-tts`       | `managed-room`  | `agent-consult` | Sala nativa/cliente | Salas no estilo push-to-talk e walkie-talkie em que o cliente é responsável por captura/reprodução e o Gateway pelo estado do turno. |
| `stt-tts`       | `managed-room`  | `direct-tools`  | Sala nativa/cliente | Modo de sala somente para administradores em superfícies first-party confiáveis que executam ações de ferramenta do Gateway diretamente. |

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

O vocabulário unificado de controle também é deliberadamente restrito:

| Método                          | Aplica-se a                                            | Contrato                                                                                      |
| ------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| `talk.session.appendAudio`      | `realtime/gateway-relay`, `transcription/gateway-relay` | Acrescenta um chunk de áudio PCM em base64 à sessão de provedor pertencente à mesma conexão do Gateway. |
| `talk.session.startTurn`        | `stt-tts/managed-room`                                 | Inicia um turno de usuário em sala gerenciada.                                                |
| `talk.session.endTurn`          | `stt-tts/managed-room`                                 | Encerra o turno ativo após validação de turno obsoleto.                                      |
| `talk.session.cancelTurn`       | todas as sessões pertencentes ao Gateway               | Cancela trabalho ativo de captura/provedor/agente/TTS para um turno.                         |
| `talk.session.cancelOutput`     | `realtime/gateway-relay`                               | Interrompe a saída de áudio do assistente sem necessariamente encerrar o turno do usuário.    |
| `talk.session.submitToolResult` | `realtime/gateway-relay`                               | Conclui uma chamada de ferramenta do provedor emitida pelo relay.                            |
| `talk.session.close`            | todas as sessões unificadas                            | Interrompe sessões de relay ou revoga o estado de sala gerenciada e depois esquece o id de sessão unificada. |

Não introduza casos especiais de provedor ou plataforma no core para fazer isso funcionar.
O core é responsável pela semântica de sessão do Talk. Plugins de provedor são responsáveis pela configuração de sessão do fornecedor.
Chamada de voz e Google Meet são responsáveis por adaptadores de telefonia/reunião. Navegador e apps nativos
são responsáveis pela UX de captura/reprodução do dispositivo.

## Política de compatibilidade

Para plugins externos, o trabalho de compatibilidade segue esta ordem:

1. adicione o novo contrato
2. mantenha o comportamento antigo conectado por meio de um adaptador de compatibilidade
3. emita um diagnóstico ou aviso que nomeie o caminho antigo e a substituição
4. cubra ambos os caminhos em testes
5. documente a descontinuação e o caminho de migração
6. remova somente após a janela de migração anunciada, geralmente em uma versão principal

  Os mantenedores podem auditar a fila de migração atual com
  `pnpm plugins:boundary-report`. Use `pnpm plugins:boundary-report:summary` para
  contagens compactas, `--owner <id>` para um Plugin ou proprietário de
  compatibilidade, e `pnpm plugins:boundary-report:ci` quando um gate de CI deve
  falhar em registros de compatibilidade vencidos, importações reservadas do SDK
  entre proprietários ou subcaminhos reservados do SDK não utilizados. O relatório
  agrupa registros de compatibilidade obsoletos por data de remoção, conta
  referências locais em código/docs, expõe importações reservadas do SDK entre
  proprietários e resume a ponte privada do SDK de host de memória para que a
  limpeza de compatibilidade permaneça explícita em vez de depender de buscas ad
  hoc. Subcaminhos reservados do SDK precisam ter uso de proprietário rastreado;
  exports auxiliares reservados não utilizados devem ser removidos do SDK público.

  Se um campo de manifesto ainda é aceito, os autores de plugins podem continuar
  usando-o até que a documentação e os diagnósticos digam o contrário. Código novo
  deve preferir a substituição documentada, mas plugins existentes não devem
  quebrar durante versões minor comuns.

  ## Como migrar

  <Steps>
  <Step title="Migrar auxiliares de carregamento/gravação de configuração de runtime">
    Plugins integrados devem parar de chamar
    `api.runtime.config.loadConfig()` e
    `api.runtime.config.writeConfigFile(...)` diretamente. Prefira a configuração
    que já foi passada para o caminho de chamada ativo. Handlers de longa duração
    que precisam do snapshot do processo atual podem usar `api.runtime.config.current()`.
    Ferramentas de agente de longa duração devem usar `ctx.getRuntimeConfig()` do
    contexto da ferramenta dentro de `execute`, para que uma ferramenta criada
    antes de uma gravação de configuração ainda veja a configuração de runtime
    atualizada.

    Gravações de configuração devem passar pelos auxiliares transacionais e
    escolher uma política pós-gravação:

    ```typescript
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    Use `afterWrite: { mode: "restart", reason: "..." }` quando o chamador sabe
    que a mudança exige uma reinicialização limpa do Gateway, e
    `afterWrite: { mode: "none", reason: "..." }` somente quando o chamador é dono
    do acompanhamento e quer deliberadamente suprimir o planejador de recarregamento.
    Os resultados de mutação incluem um resumo `followUp` tipado para testes e logs;
    o Gateway continua responsável por aplicar ou agendar a reinicialização.
    `loadConfig` e `writeConfigFile` permanecem como auxiliares de compatibilidade
    obsoletos para plugins externos durante a janela de migração e avisam uma vez
    com o código de compatibilidade `runtime-config-load-write`. Plugins integrados
    e código de runtime do repositório são protegidos por barreiras de scanner em
    `pnpm check:deprecated-internal-config-api` e
    `pnpm check:no-runtime-action-load-config`: novo uso de Plugin de produção
    falha diretamente, gravações diretas de configuração falham, métodos do servidor
    Gateway devem usar o snapshot de runtime da solicitação, auxiliares de envio/
    ação/cliente de canais de runtime devem receber configuração de sua fronteira,
    e módulos de runtime de longa duração têm zero chamadas ambiente `loadConfig()`
    permitidas.

    Código novo de Plugin também deve evitar importar o barrel amplo de
    compatibilidade `openclaw/plugin-sdk/config-runtime`. Use o subcaminho estreito
    do SDK que corresponde à tarefa:

    | Necessidade | Importação |
    | --- | --- |
    | Tipos de configuração como `OpenClawConfig` | `openclaw/plugin-sdk/config-types` |
    | Asserções de configuração já carregada e busca de configuração de entrada de Plugin | `openclaw/plugin-sdk/plugin-config-runtime` |
    | Leituras do snapshot de runtime atual | `openclaw/plugin-sdk/runtime-config-snapshot` |
    | Gravações de configuração | `openclaw/plugin-sdk/config-mutation` |
    | Auxiliares de armazenamento de sessão | `openclaw/plugin-sdk/session-store-runtime` |
    | Configuração de tabela Markdown | `openclaw/plugin-sdk/markdown-table-runtime` |
    | Auxiliares de runtime de política de grupo | `openclaw/plugin-sdk/runtime-group-policy` |
    | Resolução de entrada secreta | `openclaw/plugin-sdk/secret-input-runtime` |
    | Sobrescritas de modelo/sessão | `openclaw/plugin-sdk/model-session-runtime` |

    Plugins integrados e seus testes são protegidos por scanner contra o barrel
    amplo para que imports e mocks permaneçam locais ao comportamento de que
    precisam. O barrel amplo ainda existe para compatibilidade externa, mas código
    novo não deve depender dele.

  </Step>

  <Step title="Migrar extensões de resultado de ferramenta do Pi para middleware">
    Plugins integrados devem substituir handlers de resultado de ferramenta
    exclusivos do Pi em `api.registerEmbeddedExtensionFactory(...)` por middleware
    neutro em relação ao runtime.

    ```typescript
    // Pi and Codex runtime dynamic tools
    api.registerAgentToolResultMiddleware(async (event) => {
      return compactToolResult(event);
    }, {
      runtimes: ["pi", "codex"],
    });
    ```

    Atualize o manifesto do Plugin ao mesmo tempo:

    ```json
    {
      "contracts": {
        "agentToolResultMiddleware": ["pi", "codex"]
      }
    }
    ```

    Plugins externos não podem registrar middleware de resultado de ferramenta
    porque ele pode reescrever saída de ferramenta de alta confiança antes que o
    modelo a veja.

  </Step>

  <Step title="Migrar handlers nativos de aprovação para fatos de capacidade">
    Plugins de canal com suporte a aprovação agora expõem comportamento de
    aprovação nativo por meio de `approvalCapability.nativeRuntime` mais o registro
    compartilhado de contexto de runtime.

    Principais mudanças:

    - Substitua `approvalCapability.handler.loadRuntime(...)` por
      `approvalCapability.nativeRuntime`
    - Mova auth/entrega específicos de aprovação da fiação legada `plugin.auth` /
      `plugin.approvals` para `approvalCapability`
    - `ChannelPlugin.approvals` foi removido do contrato público de Plugin de
      canal; mova campos de entrega/nativo/renderização para `approvalCapability`
    - `plugin.auth` permanece apenas para fluxos de login/logout de canal; hooks
      de auth de aprovação ali não são mais lidos pelo core
    - Registre objetos de runtime pertencentes ao canal, como clientes, tokens ou
      apps Bolt, por meio de `openclaw/plugin-sdk/channel-runtime-context`
    - Não envie avisos de redirecionamento pertencentes ao Plugin a partir de
      handlers nativos de aprovação; o core agora é dono dos avisos roteados para
      outro lugar a partir dos resultados reais de entrega
    - Ao passar `channelRuntime` para `createChannelManager(...)`, forneça uma
      superfície real `createPluginRuntime().channel`. Stubs parciais são rejeitados.

    Consulte `/plugins/sdk-channel-plugins` para o layout atual de capacidade de
    aprovação.

  </Step>

  <Step title="Auditar comportamento de fallback de wrapper no Windows">
    Se seu Plugin usa `openclaw/plugin-sdk/windows-spawn`, wrappers Windows
    `.cmd`/`.bat` não resolvidos agora falham fechados, a menos que você passe
    explicitamente `allowShellFallback: true`.

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

    Se seu chamador não depende intencionalmente de fallback via shell, não defina
    `allowShellFallback` e trate o erro lançado em vez disso.

  </Step>

  <Step title="Encontrar imports obsoletos">
    Procure no seu Plugin imports de qualquer uma das superfícies obsoletas:

    ```bash
    grep -r "plugin-sdk/compat" my-plugin/
    grep -r "plugin-sdk/infra-runtime" my-plugin/
    grep -r "plugin-sdk/config-runtime" my-plugin/
    grep -r "openclaw/extension-api" my-plugin/
    ```

  </Step>

  <Step title="Substituir por imports focados">
    Cada export da superfície antiga mapeia para um caminho de import moderno
    específico:

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

    Para auxiliares do lado do host, use o runtime de Plugin injetado em vez de
    importar diretamente:

    ```typescript
    // Before (deprecated extension-api bridge)
    import { runEmbeddedPiAgent } from "openclaw/extension-api";
    const result = await runEmbeddedPiAgent({ sessionId, prompt });

    // After (injected runtime)
    const result = await api.runtime.agent.runEmbeddedPiAgent({ sessionId, prompt });
    ```

    O mesmo padrão se aplica a outros auxiliares de ponte legados:

    | Import antigo | Equivalente moderno |
    | --- | --- |
    | `resolveAgentDir` | `api.runtime.agent.resolveAgentDir` |
    | `resolveAgentWorkspaceDir` | `api.runtime.agent.resolveAgentWorkspaceDir` |
    | `resolveAgentIdentity` | `api.runtime.agent.resolveAgentIdentity` |
    | `resolveThinkingDefault` | `api.runtime.agent.resolveThinkingDefault` |
    | `resolveAgentTimeoutMs` | `api.runtime.agent.resolveAgentTimeoutMs` |
    | `ensureAgentWorkspace` | `api.runtime.agent.ensureAgentWorkspace` |
    | auxiliares de armazenamento de sessão | `api.runtime.agent.session.*` |

  </Step>

  <Step title="Substituir imports amplos de infra-runtime">
    `openclaw/plugin-sdk/infra-runtime` ainda existe para compatibilidade externa,
    mas código novo deve importar a superfície de auxiliares focada de que ele
    realmente precisa:

    | Necessidade | Importação |
    | --- | --- |
    | Auxiliares de fila de eventos do sistema | `openclaw/plugin-sdk/system-event-runtime` |
    | Auxiliares de evento e visibilidade de Heartbeat | `openclaw/plugin-sdk/heartbeat-runtime` |
    | Esvaziamento de fila de entrega pendente | `openclaw/plugin-sdk/delivery-queue-runtime` |
    | Telemetria de atividade de canal | `openclaw/plugin-sdk/channel-activity-runtime` |
    | Caches de deduplicação em memória | `openclaw/plugin-sdk/dedupe-runtime` |
    | Auxiliares seguros de caminho de arquivo local/mídia | `openclaw/plugin-sdk/file-access-runtime` |
    | Fetch ciente de dispatcher | `openclaw/plugin-sdk/runtime-fetch` |
    | Auxiliares de proxy e fetch protegido | `openclaw/plugin-sdk/fetch-runtime` |
    | Tipos de política de dispatcher SSRF | `openclaw/plugin-sdk/ssrf-dispatcher` |
    | Tipos de solicitação/resolução de aprovação | `openclaw/plugin-sdk/approval-runtime` |
    | Payload de resposta de aprovação e auxiliares de comando | `openclaw/plugin-sdk/approval-reply-runtime` |
    | Auxiliares de formatação de erro | `openclaw/plugin-sdk/error-runtime` |
    | Esperas de prontidão de transporte | `openclaw/plugin-sdk/transport-ready-runtime` |
    | Auxiliares de token seguro | `openclaw/plugin-sdk/secure-random-runtime` |
    | Concorrência limitada de tarefa assíncrona | `openclaw/plugin-sdk/concurrency-runtime` |
    | Coerção numérica | `openclaw/plugin-sdk/number-runtime` |
    | Bloqueio assíncrono local ao processo | `openclaw/plugin-sdk/async-lock-runtime` |
    | Bloqueios de arquivo | `openclaw/plugin-sdk/file-lock` |

    Plugins integrados são protegidos por scanner contra `infra-runtime`, então o
    código do repositório não pode regredir para o barrel amplo.

  </Step>

  <Step title="Migrar auxiliares de rota de canal">
    Novo código de rota de canal deve usar `openclaw/plugin-sdk/channel-route`.
    Os nomes mais antigos de chave de rota e alvo comparável permanecem como
    aliases de compatibilidade durante a janela de migração, mas novos plugins
    devem usar os nomes de rota que descrevem o comportamento diretamente:

    | Auxiliar antigo | Auxiliar moderno |
    | --- | --- |
    | `channelRouteIdentityKey(...)` | `channelRouteDedupeKey(...)` |
    | `channelRouteKey(...)` | `channelRouteCompactKey(...)` |
    | `ComparableChannelTarget` | `ChannelRouteParsedTarget` |
    | `resolveComparableTargetForChannel(...)` | `resolveRouteTargetForChannel(...)` |
    | `resolveComparableTargetForLoadedChannel(...)` | `resolveRouteTargetForLoadedChannel(...)` |
    | `comparableChannelTargetsMatch(...)` | `channelRouteTargetsMatchExact(...)` |
    | `comparableChannelTargetsShareRoute(...)` | `channelRouteTargetsShareConversation(...)` |

    Os helpers de rota modernos normalizam `{ channel, to, accountId, threadId }`
    de forma consistente entre aprovações nativas, supressão de respostas, desduplicação de entrada,
    entrega cron e roteamento de sessões. Se o seu plugin possui gramática de destino
    personalizada, use `resolveChannelRouteTargetWithParser(...)` para adaptar esse
    parser ao mesmo contrato de destino de rota.

  </Step>

  <Step title="Compilar e testar">
    ```bash
    pnpm build
    pnpm test -- my-plugin/
    ```
  </Step>
</Steps>

## Referência de caminho de importação

  <Accordion title="Tabela comum de caminhos de importação">
  | Caminho de importação | Finalidade | Exportações principais |
  | --- | --- | --- |
  | `plugin-sdk/plugin-entry` | Auxiliar canônico de entrada de Plugin | `definePluginEntry` |
  | `plugin-sdk/core` | Reexportação guarda-chuva legada para definições/construtores de entrada de canal | `defineChannelPluginEntry`, `createChatChannelPlugin` |
  | `plugin-sdk/config-schema` | Exportação do esquema de configuração raiz | `OpenClawSchema` |
  | `plugin-sdk/provider-entry` | Auxiliar de entrada de provedor único | `defineSingleProviderPluginEntry` |
  | `plugin-sdk/channel-core` | Definições e construtores focados de entrada de canal | `defineChannelPluginEntry`, `defineSetupPluginEntry`, `createChatChannelPlugin`, `createChannelPluginBase` |
  | `plugin-sdk/setup` | Auxiliares compartilhados do assistente de configuração | Prompts de lista de permissões, construtores de status de configuração |
  | `plugin-sdk/setup-runtime` | Auxiliares de runtime em tempo de configuração | Adaptadores de patch de configuração seguros para importação, auxiliares de nota de consulta, `promptResolvedAllowFrom`, `splitSetupEntries`, proxies de configuração delegados |
  | `plugin-sdk/setup-adapter-runtime` | Auxiliares de adaptador de configuração | `createEnvPatchedAccountSetupAdapter` |
  | `plugin-sdk/setup-tools` | Auxiliares de ferramentas de configuração | `formatCliCommand`, `detectBinary`, `extractArchive`, `resolveBrewExecutable`, `formatDocsLink`, `CONFIG_DIR` |
  | `plugin-sdk/account-core` | Auxiliares de várias contas | Auxiliares de lista/configuração/controle de ações de contas |
  | `plugin-sdk/account-id` | Auxiliares de ID de conta | `DEFAULT_ACCOUNT_ID`, normalização de ID de conta |
  | `plugin-sdk/account-resolution` | Auxiliares de consulta de conta | Auxiliares de consulta de conta + fallback padrão |
  | `plugin-sdk/account-helpers` | Auxiliares restritos de conta | Auxiliares de lista de contas/ações de conta |
  | `plugin-sdk/channel-setup` | Adaptadores do assistente de configuração | `createOptionalChannelSetupSurface`, `createOptionalChannelSetupAdapter`, `createOptionalChannelSetupWizard`, além de `DEFAULT_ACCOUNT_ID`, `createTopLevelChannelDmPolicy`, `setSetupChannelEnabled`, `splitSetupEntries` |
  | `plugin-sdk/channel-pairing` | Primitivas de pareamento de DM | `createChannelPairingController` |
  | `plugin-sdk/channel-reply-pipeline` | Cabeamento de prefixo de resposta, digitação e entrega de origem | `createChannelReplyPipeline`, `resolveChannelSourceReplyDeliveryMode` |
  | `plugin-sdk/channel-config-helpers` | Fábricas de adaptadores de configuração e auxiliares de acesso a DM | `createHybridChannelConfigAdapter`, `resolveChannelDmAccess`, `resolveChannelDmAllowFrom`, `resolveChannelDmPolicy`, `normalizeChannelDmPolicy`, `normalizeLegacyDmAliases` |
  | `plugin-sdk/channel-config-schema` | Construtores de esquema de configuração | Primitivas compartilhadas de esquema de configuração de canal e apenas o construtor genérico |
  | `plugin-sdk/bundled-channel-config-schema` | Esquemas de configuração incluídos | Apenas plugins incluídos mantidos pela OpenClaw; novos plugins devem definir esquemas locais ao Plugin |
  | `plugin-sdk/channel-config-schema-legacy` | Esquemas de configuração incluídos obsoletos | Apenas alias de compatibilidade; use `plugin-sdk/bundled-channel-config-schema` para plugins incluídos mantidos |
  | `plugin-sdk/telegram-command-config` | Auxiliares de configuração de comandos do Telegram | Normalização de nomes de comando, remoção de espaços da descrição, validação de duplicatas/conflitos |
  | `plugin-sdk/channel-policy` | Resolução de política de grupo/DM | `resolveChannelGroupRequireMention` |
  | `plugin-sdk/channel-lifecycle` | Auxiliares de status de conta e ciclo de vida de fluxo de rascunho | `createAccountStatusSink`, auxiliares de finalização de prévia de rascunho |
  | `plugin-sdk/inbound-envelope` | Auxiliares de envelope de entrada | Auxiliares compartilhados de rota + construtor de envelope |
  | `plugin-sdk/inbound-reply-dispatch` | Auxiliares de resposta de entrada | Auxiliares compartilhados de registro e despacho |
  | `plugin-sdk/messaging-targets` | Análise de destinos de mensagens | Auxiliares de análise/correspondência de destino |
  | `plugin-sdk/outbound-media` | Auxiliares de mídia de saída | Carregamento compartilhado de mídia de saída |
  | `plugin-sdk/outbound-send-deps` | Auxiliares de dependência de envio de saída | Consulta leve de `resolveOutboundSendDep` sem importar o runtime completo de saída |
  | `plugin-sdk/outbound-runtime` | Auxiliares de runtime de saída | Auxiliares de entrega de saída, delegado de identidade/envio, sessão, formatação e planejamento de payload |
  | `plugin-sdk/thread-bindings-runtime` | Auxiliares de vinculação de threads | Auxiliares de ciclo de vida e adaptador de vinculação de threads |
  | `plugin-sdk/agent-media-payload` | Auxiliares legados de payload de mídia | Construtor de payload de mídia do agente para layouts de campos legados |
  | `plugin-sdk/channel-runtime` | Shim de compatibilidade obsoleto | Apenas utilitários legados de runtime de canal |
  | `plugin-sdk/channel-send-result` | Tipos de resultado de envio | Tipos de resultado de resposta |
  | `plugin-sdk/runtime-store` | Armazenamento persistente de Plugin | `createPluginRuntimeStore` |
  | `plugin-sdk/runtime` | Auxiliares amplos de runtime | Auxiliares de runtime/logging/backup/instalação de Plugin |
  | `plugin-sdk/runtime-env` | Auxiliares restritos de ambiente de runtime | Ambiente de logger/runtime, auxiliares de timeout, retry e backoff |
  | `plugin-sdk/plugin-runtime` | Auxiliares compartilhados de runtime de Plugin | Auxiliares de comandos/hooks/http/interativos de Plugin |
  | `plugin-sdk/hook-runtime` | Auxiliares de pipeline de hook | Auxiliares compartilhados de pipeline de Webhook/hook interno |
  | `plugin-sdk/lazy-runtime` | Auxiliares de runtime lazy | `createLazyRuntimeModule`, `createLazyRuntimeMethod`, `createLazyRuntimeMethodBinder`, `createLazyRuntimeNamedExport`, `createLazyRuntimeSurface` |
  | `plugin-sdk/process-runtime` | Auxiliares de processo | Auxiliares compartilhados de exec |
  | `plugin-sdk/cli-runtime` | Auxiliares de runtime da CLI | Formatação de comandos, esperas, auxiliares de versão |
  | `plugin-sdk/gateway-runtime` | Auxiliares de Gateway | Cliente de Gateway, auxiliar de inicialização pronta para loop de eventos e auxiliares de patch de status de canal |
  | `plugin-sdk/config-runtime` | Shim de compatibilidade de configuração obsoleto | Prefira `config-types`, `plugin-config-runtime`, `runtime-config-snapshot` e `config-mutation` |
  | `plugin-sdk/telegram-command-config` | Auxiliares de comandos do Telegram | Auxiliares de validação de comandos do Telegram estáveis com fallback quando a superfície de contrato incluída do Telegram está indisponível |
  | `plugin-sdk/approval-runtime` | Auxiliares de prompt de aprovação | Payload de aprovação de exec/Plugin, auxiliares de capacidade/perfil de aprovação, roteamento/runtime de aprovação nativa e formatação de caminho de exibição de aprovação estruturada |
  | `plugin-sdk/approval-auth-runtime` | Auxiliares de autenticação de aprovação | Resolução de aprovador, autenticação de ação no mesmo chat |
  | `plugin-sdk/approval-client-runtime` | Auxiliares de cliente de aprovação | Auxiliares de perfil/filtro de aprovação nativa de exec |
  | `plugin-sdk/approval-delivery-runtime` | Auxiliares de entrega de aprovação | Adaptadores de capacidade/entrega de aprovação nativa |
  | `plugin-sdk/approval-gateway-runtime` | Auxiliares de Gateway de aprovação | Auxiliar compartilhado de resolução de Gateway de aprovação |
  | `plugin-sdk/approval-handler-adapter-runtime` | Auxiliares de adaptador de aprovação | Auxiliares leves de carregamento de adaptador de aprovação nativa para pontos de entrada de canal quentes |
  | `plugin-sdk/approval-handler-runtime` | Auxiliares de manipulador de aprovação | Auxiliares mais amplos de runtime de manipulador de aprovação; prefira as interfaces mais restritas de adaptador/Gateway quando forem suficientes |
  | `plugin-sdk/approval-native-runtime` | Auxiliares de destino de aprovação | Auxiliares de vinculação de destino/conta de aprovação nativa |
  | `plugin-sdk/approval-reply-runtime` | Auxiliares de resposta de aprovação | Auxiliares de payload de resposta de aprovação de exec/Plugin |
  | `plugin-sdk/channel-runtime-context` | Auxiliares de contexto de runtime de canal | Auxiliares genéricos de registrar/obter/observar contexto de runtime de canal |
  | `plugin-sdk/security-runtime` | Auxiliares de segurança | Auxiliares compartilhados de confiança, controle de DM, arquivo/caminho delimitados à raiz, conteúdo externo e coleta de segredos |
  | `plugin-sdk/ssrf-policy` | Auxiliares de política de SSRF | Auxiliares de lista de permissões de hosts e política de rede privada |
  | `plugin-sdk/ssrf-runtime` | Auxiliares de runtime de SSRF | Dispatcher fixado, fetch protegido, auxiliares de política de SSRF |
  | `plugin-sdk/system-event-runtime` | Auxiliares de eventos do sistema | `enqueueSystemEvent`, `peekSystemEventEntries` |
  | `plugin-sdk/heartbeat-runtime` | Auxiliares de Heartbeat | Auxiliares de evento e visibilidade de Heartbeat |
  | `plugin-sdk/delivery-queue-runtime` | Auxiliares de fila de entrega | `drainPendingDeliveries` |
  | `plugin-sdk/channel-activity-runtime` | Auxiliares de atividade de canal | `recordChannelActivity` |
  | `plugin-sdk/dedupe-runtime` | Auxiliares de desduplicação | Caches de desduplicação em memória |
  | `plugin-sdk/file-access-runtime` | Auxiliares de acesso a arquivos | Auxiliares seguros de caminho de arquivo/mídia local |
  | `plugin-sdk/transport-ready-runtime` | Auxiliares de prontidão de transporte | `waitForTransportReady` |
  | `plugin-sdk/collection-runtime` | Auxiliares de cache limitado | `pruneMapToMaxSize` |
  | `plugin-sdk/diagnostic-runtime` | Auxiliares de controle de diagnóstico | `isDiagnosticFlagEnabled`, `isDiagnosticsEnabled` |
  | `plugin-sdk/error-runtime` | Auxiliares de formatação de erro | `formatUncaughtError`, `isApprovalNotFoundError`, auxiliares de grafo de erro |
  | `plugin-sdk/fetch-runtime` | Auxiliares de fetch/proxy encapsulados | `resolveFetch`, auxiliares de proxy, auxiliares de opção de EnvHttpProxyAgent |
  | `plugin-sdk/host-runtime` | Auxiliares de normalização de host | `normalizeHostname`, `normalizeScpRemoteHost` |
  | `plugin-sdk/retry-runtime` | Auxiliares de retry | `RetryConfig`, `retryAsync`, executores de política |
  | `plugin-sdk/allow-from` | Formatação de lista de permissões | `formatAllowFromLowercase` |
  | `plugin-sdk/allowlist-resolution` | Mapeamento de entrada de lista de permissões | `mapAllowlistResolutionInputs` |
  | `plugin-sdk/command-auth` | Auxiliares de controle de comandos e superfície de comandos | `resolveControlCommandGate`, auxiliares de autorização de remetente, auxiliares de registro de comandos incluindo formatação de menu de argumentos dinâmicos |
  | `plugin-sdk/command-status` | Renderizadores de status/ajuda de comandos | `buildCommandsMessage`, `buildCommandsMessagePaginated`, `buildHelpMessage` |
  | `plugin-sdk/secret-input` | Análise de entrada de segredos | Auxiliares de entrada de segredos |
  | `plugin-sdk/webhook-ingress` | Auxiliares de solicitação de Webhook | Utilitários de destino de Webhook |
  | `plugin-sdk/webhook-request-guards` | Auxiliares de proteção de corpo de Webhook | Auxiliares de leitura/limite do corpo da solicitação |
  | `plugin-sdk/reply-runtime` | Runtime compartilhado de resposta | Despacho de entrada, Heartbeat, planejador de resposta, divisão em partes |
  | `plugin-sdk/reply-dispatch-runtime` | Auxiliares restritos de despacho de resposta | Finalização, despacho de provedor e auxiliares de rótulo de conversa |
  | `plugin-sdk/reply-history` | Auxiliares de histórico de respostas | `buildHistoryContext`, `buildPendingHistoryContextFromMap`, `recordPendingHistoryEntry`, `clearHistoryEntriesIfEnabled` |
  | `plugin-sdk/reply-reference` | Planejamento de referência de resposta | `createReplyReferencePlanner` |
  | `plugin-sdk/reply-chunking` | Auxiliares de partes de resposta | Auxiliares de divisão de texto/markdown em partes |
  | `plugin-sdk/session-store-runtime` | Auxiliares de armazenamento de sessão | Auxiliares de caminho de armazenamento + atualizado em |
  | `plugin-sdk/state-paths` | Auxiliares de caminhos de estado | Auxiliares de diretório de estado e OAuth |
  | `plugin-sdk/routing` | Auxiliares de roteamento/chave de sessão | `resolveAgentRoute`, `buildAgentSessionKey`, `resolveDefaultAgentBoundAccountId`, auxiliares de normalização de chave de sessão |
  | `plugin-sdk/status-helpers` | Auxiliares de status de canal | Construtores de resumo de status de canal/conta, padrões de estado de runtime, auxiliares de metadados de problema |
  | `plugin-sdk/target-resolver-runtime` | Auxiliares de resolvedor de destino | Auxiliares compartilhados de resolvedor de destino |
  | `plugin-sdk/string-normalization-runtime` | Auxiliares de normalização de strings | Auxiliares de normalização de slug/string |
  | `plugin-sdk/request-url` | Auxiliares de URL de solicitação | Extrai URLs em string de entradas semelhantes a solicitação |
  | `plugin-sdk/run-command` | Auxiliares de comando temporizado | Executor de comando temporizado com stdout/stderr normalizados |
  | `plugin-sdk/param-readers` | Leitores de parâmetros | Leitores comuns de parâmetros de ferramenta/CLI |
  | `plugin-sdk/tool-payload` | Extração de carga útil de ferramenta | Extrai cargas úteis normalizadas de objetos de resultado de ferramenta |
  | `plugin-sdk/tool-send` | Extração de envio de ferramenta | Extrai campos canônicos de destino de envio dos argumentos da ferramenta |
  | `plugin-sdk/temp-path` | Auxiliares de caminho temporário | Auxiliares compartilhados de caminho de download temporário |
  | `plugin-sdk/logging-core` | Auxiliares de registro | Auxiliares de registrador de subsistema e redação |
  | `plugin-sdk/markdown-table-runtime` | Auxiliares de tabela Markdown | Auxiliares de modo de tabela Markdown |
  | `plugin-sdk/reply-payload` | Tipos de resposta de mensagem | Tipos de carga útil de resposta |
  | `plugin-sdk/provider-setup` | Auxiliares selecionados de configuração de provedor local/auto-hospedado | Auxiliares de descoberta/configuração de provedor auto-hospedado |
  | `plugin-sdk/self-hosted-provider-setup` | Auxiliares focados de configuração de provedor auto-hospedado compatível com OpenAI | Os mesmos auxiliares de descoberta/configuração de provedor auto-hospedado |
  | `plugin-sdk/provider-auth-runtime` | Auxiliares de autenticação de runtime de provedor | Auxiliares de resolução de chave de API em runtime |
  | `plugin-sdk/provider-auth-api-key` | Auxiliares de configuração de chave de API de provedor | Auxiliares de onboarding/gravação de perfil de chave de API |
  | `plugin-sdk/provider-auth-result` | Auxiliares de resultado de autenticação de provedor | Construtor padrão de resultado de autenticação OAuth |
  | `plugin-sdk/provider-auth-login` | Auxiliares de login interativo de provedor | Auxiliares compartilhados de login interativo |
  | `plugin-sdk/provider-selection-runtime` | Auxiliares de seleção de provedor | Seleção de provedor configurado ou automática e mesclagem de configuração bruta de provedor |
  | `plugin-sdk/provider-env-vars` | Auxiliares de variáveis de ambiente de provedor | Auxiliares de consulta de variáveis de ambiente de autenticação de provedor |
  | `plugin-sdk/provider-model-shared` | Auxiliares compartilhados de modelo/replay de provedor | `ProviderReplayFamily`, `buildProviderReplayFamilyHooks`, `normalizeModelCompat`, construtores compartilhados de política de replay, auxiliares de endpoint de provedor e auxiliares de normalização de ID de modelo |
  | `plugin-sdk/provider-catalog-shared` | Auxiliares compartilhados de catálogo de provedor | `findCatalogTemplate`, `buildSingleProviderApiKeyCatalog`, `buildManifestModelProviderConfig`, `supportsNativeStreamingUsageCompat`, `applyProviderNativeStreamingUsageCompat` |
  | `plugin-sdk/provider-onboard` | Patches de onboarding de provedor | Auxiliares de configuração de onboarding |
  | `plugin-sdk/provider-http` | Auxiliares HTTP de provedor | Auxiliares genéricos de HTTP/capacidade de endpoint de provedor, incluindo auxiliares de formulário multipart para transcrição de áudio |
  | `plugin-sdk/provider-web-fetch` | Auxiliares de web-fetch de provedor | Auxiliares de registro/cache de provedor de web-fetch |
  | `plugin-sdk/provider-web-search-config-contract` | Auxiliares de configuração de pesquisa web de provedor | Auxiliares restritos de configuração/credenciais de pesquisa web para provedores que não precisam de fiação de habilitação de plugin |
  | `plugin-sdk/provider-web-search-contract` | Auxiliares de contrato de pesquisa web de provedor | Auxiliares restritos de contrato de configuração/credenciais de pesquisa web, como `createWebSearchProviderContractFields`, `enablePluginInConfig`, `resolveProviderWebSearchPluginConfig` e setters/getters de credenciais com escopo |
  | `plugin-sdk/provider-web-search` | Auxiliares de pesquisa web de provedor | Auxiliares de registro/cache/runtime de provedor de pesquisa web |
  | `plugin-sdk/provider-tools` | Auxiliares de compatibilidade de ferramentas/esquema de provedor | `ProviderToolCompatFamily`, `buildProviderToolCompatFamilyHooks`, limpeza de esquema Gemini + diagnósticos e auxiliares de compatibilidade xAI, como `resolveXaiModelCompatPatch` / `applyXaiModelCompat` |
  | `plugin-sdk/provider-usage` | Auxiliares de uso de provedor | `fetchClaudeUsage`, `fetchGeminiUsage`, `fetchGithubCopilotUsage` e outros auxiliares de uso de provedor |
  | `plugin-sdk/provider-stream` | Auxiliares de wrapper de stream de provedor | `ProviderStreamFamily`, `buildProviderStreamFamilyHooks`, `composeProviderStreamWrappers`, tipos de wrapper de stream e auxiliares compartilhados de wrapper Anthropic/Bedrock/DeepSeek V4/Google/Kilocode/Moonshot/OpenAI/OpenRouter/Z.A.I/MiniMax/Copilot |
  | `plugin-sdk/provider-transport-runtime` | Auxiliares de transporte de provedor | Auxiliares de transporte nativo de provedor, como fetch protegido, transformações de mensagem de transporte e streams graváveis de eventos de transporte |
  | `plugin-sdk/keyed-async-queue` | Fila assíncrona ordenada | `KeyedAsyncQueue` |
  | `plugin-sdk/media-runtime` | Auxiliares compartilhados de mídia | Auxiliares de busca/transformação/armazenamento de mídia, sondagem de dimensões de vídeo baseada em ffprobe e construtores de carga útil de mídia |
  | `plugin-sdk/media-generation-runtime` | Auxiliares compartilhados de geração de mídia | Auxiliares compartilhados de failover, seleção de candidatos e mensagens de modelo ausente para geração de imagem/vídeo/música |
  | `plugin-sdk/media-understanding` | Auxiliares de compreensão de mídia | Tipos de provedor de compreensão de mídia mais exportações de auxiliares de imagem/áudio voltadas a provedores |
  | `plugin-sdk/text-runtime` | Auxiliares compartilhados de texto | Remoção de texto visível ao assistente, auxiliares de renderização/segmentação/tabela Markdown, auxiliares de redação, auxiliares de tags de diretiva, utilitários de texto seguro e auxiliares relacionados de texto/registro |
  | `plugin-sdk/text-chunking` | Auxiliares de segmentação de texto | Auxiliar de segmentação de texto de saída |
  | `plugin-sdk/speech` | Auxiliares de fala | Tipos de provedor de fala mais auxiliares de diretiva, registro e validação voltados a provedores, e construtor de TTS compatível com OpenAI |
  | `plugin-sdk/speech-core` | Núcleo compartilhado de fala | Tipos de provedor de fala, registro, diretivas, normalização |
  | `plugin-sdk/realtime-transcription` | Auxiliares de transcrição em tempo real | Tipos de provedor, auxiliares de registro e auxiliar compartilhado de sessão WebSocket |
  | `plugin-sdk/realtime-voice` | Auxiliares de voz em tempo real | Tipos de provedor, auxiliares de registro/resolução, auxiliares de sessão de ponte, filas compartilhadas de resposta de voz do agente, integridade de transcrição/evento, supressão de eco e auxiliares rápidos de consulta de contexto |
  | `plugin-sdk/image-generation` | Auxiliares de geração de imagem | Tipos de provedor de geração de imagem mais auxiliares de asset de imagem/URL de dados e o construtor de provedor de imagem compatível com OpenAI |
  | `plugin-sdk/image-generation-core` | Núcleo compartilhado de geração de imagem | Tipos de geração de imagem, failover, autenticação e auxiliares de registro |
  | `plugin-sdk/music-generation` | Auxiliares de geração de música | Tipos de provedor/solicitação/resultado de geração de música |
  | `plugin-sdk/music-generation-core` | Núcleo compartilhado de geração de música | Tipos de geração de música, auxiliares de failover, consulta de provedor e análise de ref de modelo |
  | `plugin-sdk/video-generation` | Auxiliares de geração de vídeo | Tipos de provedor/solicitação/resultado de geração de vídeo |
  | `plugin-sdk/video-generation-core` | Núcleo compartilhado de geração de vídeo | Tipos de geração de vídeo, auxiliares de failover, consulta de provedor e análise de ref de modelo |
  | `plugin-sdk/interactive-runtime` | Auxiliares de resposta interativa | Normalização/redução de carga útil de resposta interativa |
  | `plugin-sdk/channel-config-primitives` | Primitivas de configuração de canal | Primitivas restritas de esquema de configuração de canal |
  | `plugin-sdk/channel-config-writes` | Auxiliares de gravação de configuração de canal | Auxiliares de autorização de gravação de configuração de canal |
  | `plugin-sdk/channel-plugin-common` | Prelúdio compartilhado de canal | Exportações compartilhadas de prelúdio de plugin de canal |
  | `plugin-sdk/channel-status` | Auxiliares de status de canal | Auxiliares compartilhados de instantâneo/resumo de status de canal |
  | `plugin-sdk/allowlist-config-edit` | Auxiliares de configuração de lista de permissões | Auxiliares de edição/leitura de configuração de lista de permissões |
  | `plugin-sdk/group-access` | Auxiliares de acesso a grupos | Auxiliares compartilhados de decisão de acesso a grupos |
  | `plugin-sdk/direct-dm` | Auxiliares de DM direta | Auxiliares compartilhados de autenticação/proteção de DM direta |
  | `plugin-sdk/extension-shared` | Auxiliares compartilhados de extensão | Primitivas de auxiliares de canal/status passivos e proxy ambiente |
  | `plugin-sdk/webhook-targets` | Auxiliares de destino de Webhook | Registro de destinos de Webhook e auxiliares de instalação de rotas |
  | `plugin-sdk/webhook-path` | Auxiliares de caminho de Webhook | Auxiliares de normalização de caminho de Webhook |
  | `plugin-sdk/web-media` | Auxiliares compartilhados de mídia web | Auxiliares de carregamento de mídia remota/local |
  | `plugin-sdk/zod` | Reexportação do Zod | `zod` reexportado para consumidores do SDK de plugin |
  | `plugin-sdk/memory-core` | Auxiliares memory-core empacotados | Superfície de auxiliares de gerenciador/configuração/arquivo/CLI de memória |
  | `plugin-sdk/memory-core-engine-runtime` | Fachada de runtime do mecanismo de memória | Fachada de runtime de índice/pesquisa de memória |
  | `plugin-sdk/memory-core-host-engine-foundation` | Mecanismo de fundação do host de memória | Exportações do mecanismo de fundação do host de memória |
  | `plugin-sdk/memory-core-host-engine-embeddings` | Mecanismo de embeddings do host de memória | Contratos de embedding de memória, acesso ao registro, provedor local e auxiliares genéricos de lote/remotos; provedores remotos concretos ficam em seus plugins proprietários |
  | `plugin-sdk/memory-core-host-engine-qmd` | Mecanismo QMD do host de memória | Exportações do mecanismo QMD do host de memória |
  | `plugin-sdk/memory-core-host-engine-storage` | Mecanismo de armazenamento do host de memória | Exportações do mecanismo de armazenamento do host de memória |
  | `plugin-sdk/memory-core-host-multimodal` | Auxiliares multimodais do host de memória | Auxiliares multimodais do host de memória |
  | `plugin-sdk/memory-core-host-query` | Auxiliares de consulta do host de memória | Auxiliares de consulta do host de memória |
  | `plugin-sdk/memory-core-host-secret` | Auxiliares de segredo do host de memória | Auxiliares de segredo do host de memória |
  | `plugin-sdk/memory-core-host-events` | Auxiliares de diário de eventos do host de memória | Auxiliares de diário de eventos do host de memória |
  | `plugin-sdk/memory-core-host-status` | Auxiliares de status do host de memória | Auxiliares de status do host de memória |
  | `plugin-sdk/memory-core-host-runtime-cli` | Runtime de CLI do host de memória | Auxiliares de runtime de CLI do host de memória |
  | `plugin-sdk/memory-core-host-runtime-core` | Runtime central do host de memória | Auxiliares de runtime central do host de memória |
  | `plugin-sdk/memory-core-host-runtime-files` | Auxiliares de arquivo/runtime do host de memória | Auxiliares de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-core` | Alias de runtime central do host de memória | Alias neutro em relação a fornecedor para auxiliares de runtime central do host de memória |
  | `plugin-sdk/memory-host-events` | Alias de diário de eventos do host de memória | Alias neutro em relação a fornecedor para auxiliares de diário de eventos do host de memória |
  | `plugin-sdk/memory-host-files` | Alias de arquivo/runtime do host de memória | Alias neutro em relação a fornecedor para auxiliares de arquivo/runtime do host de memória |
  | `plugin-sdk/memory-host-markdown` | Auxiliares de Markdown gerenciado | Auxiliares compartilhados de Markdown gerenciado para plugins adjacentes à memória |
  | `plugin-sdk/memory-host-search` | Fachada de pesquisa de memória ativa | Fachada preguiçosa de runtime do gerenciador de pesquisa de memória ativa |
  | `plugin-sdk/memory-host-status` | Alias de status do host de memória | Alias neutro em relação a fornecedor para auxiliares de status do host de memória |
  | `plugin-sdk/testing` | Utilitários de teste | Barrel legado de compatibilidade ampla; prefira subcaminhos de teste focados, como `plugin-sdk/plugin-test-runtime`, `plugin-sdk/channel-test-helpers`, `plugin-sdk/channel-target-testing`, `plugin-sdk/test-env` e `plugin-sdk/test-fixtures` |
</Accordion>

Esta tabela é intencionalmente o subconjunto comum de migração, não a superfície completa do SDK. A lista completa de mais de 200 pontos de entrada fica em `scripts/lib/plugin-sdk-entrypoints.json`.

As interfaces auxiliares reservadas de plugins incluídos foram removidas do mapa de exportação público do SDK, exceto facades de compatibilidade explicitamente documentadas, como o shim obsoleto `plugin-sdk/discord` mantido para o pacote publicado `@openclaw/discord@2026.3.13`. Auxiliares específicos do proprietário ficam dentro do pacote do plugin proprietário; o comportamento compartilhado do host deve passar por contratos genéricos do SDK, como `plugin-sdk/gateway-runtime`, `plugin-sdk/security-runtime` e `plugin-sdk/plugin-config-runtime`.

Use a importação mais restrita que corresponda ao trabalho. Se você não encontrar uma exportação, verifique o código-fonte em `src/plugin-sdk/` ou pergunte aos mantenedores qual contrato genérico deve possuí-la.

## Descontinuações ativas

Descontinuações mais restritas que se aplicam ao SDK de plugins, ao contrato de provedor, à superfície de runtime e ao manifesto. Cada uma ainda funciona hoje, mas será removida em uma futura versão principal. A entrada abaixo de cada item mapeia a API antiga para sua substituição canônica.

<AccordionGroup>
  <Accordion title="Construtores de ajuda command-auth → command-status">
    **Antigo (`openclaw/plugin-sdk/command-auth`)**: `buildCommandsMessage`,
    `buildCommandsMessagePaginated`, `buildHelpMessage`.

    **Novo (`openclaw/plugin-sdk/command-status`)**: mesmas assinaturas, mesmas
    exportações - apenas importadas do subcaminho mais restrito. `command-auth`
    as reexporta como stubs de compatibilidade.

    ```typescript
    // Before
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-auth";

    // After
    import { buildHelpMessage } from "openclaw/plugin-sdk/command-status";
    ```

  </Accordion>

  <Accordion title="Auxiliares de controle de menções → resolveInboundMentionDecision">
    **Antigo**: `resolveInboundMentionRequirement({ facts, policy })` e
    `shouldDropInboundForMention(...)` de
    `openclaw/plugin-sdk/channel-inbound` ou
    `openclaw/plugin-sdk/channel-mention-gating`.

    **Novo**: `resolveInboundMentionDecision({ facts, policy })` - retorna um
    único objeto de decisão em vez de duas chamadas separadas.

    Plugins de canal downstream (Slack, Discord, Matrix, MS Teams) já fizeram
    a troca.

  </Accordion>

  <Accordion title="Shim de runtime de canal e auxiliares de ações de canal">
    `openclaw/plugin-sdk/channel-runtime` é um shim de compatibilidade para
    plugins de canal mais antigos. Não o importe em código novo; use
    `openclaw/plugin-sdk/channel-runtime-context` para registrar objetos de
    runtime.

    Auxiliares `channelActions*` em `openclaw/plugin-sdk/channel-actions` estão
    obsoletos junto com exportações brutas de canal "actions". Exponha
    capacidades por meio da superfície semântica `presentation` em vez disso -
    plugins de canal declaram o que renderizam (cards, botões, seletores) em
    vez de quais nomes brutos de ação aceitam.

  </Accordion>

  <Accordion title="Auxiliar tool() de provedor de pesquisa na web → createTool() no plugin">
    **Antigo**: fábrica `tool()` de `openclaw/plugin-sdk/provider-web-search`.

    **Novo**: implemente `createTool(...)` diretamente no plugin de provedor.
    O OpenClaw não precisa mais do auxiliar do SDK para registrar o wrapper da ferramenta.

  </Accordion>

  <Accordion title="Envelopes de canal em texto simples → BodyForAgent">
    **Antigo**: `formatInboundEnvelope(...)` (e
    `ChannelMessageForAgent.channelEnvelope`) para criar um envelope de prompt
    plano em texto simples a partir de mensagens de canal recebidas.

    **Novo**: `BodyForAgent` mais blocos estruturados de contexto do usuário.
    Plugins de canal anexam metadados de roteamento (thread, tópico, responder a, reações) como
    campos tipados em vez de concatená-los em uma string de prompt. O auxiliar
    `formatAgentEnvelope(...)` ainda é compatível para envelopes sintetizados
    voltados ao assistente, mas envelopes recebidos em texto simples estão
    sendo eliminados.

    Áreas afetadas: `inbound_claim`, `message_received` e qualquer plugin de
    canal personalizado que pós-processava o texto de `channelEnvelope`.

  </Accordion>

  <Accordion title="Tipos de descoberta de provedor → tipos de catálogo de provedor">
    Quatro aliases de tipo de descoberta agora são wrappers leves sobre os
    tipos da era de catálogo:

    | Alias antigo              | Novo tipo                 |
    | ------------------------- | ------------------------- |
    | `ProviderDiscoveryOrder`  | `ProviderCatalogOrder`    |
    | `ProviderDiscoveryContext`| `ProviderCatalogContext`  |
    | `ProviderDiscoveryResult` | `ProviderCatalogResult`   |
    | `ProviderPluginDiscovery` | `ProviderPluginCatalog`   |

    Além do pacote estático legado `ProviderCapabilities` - plugins de
    provedor devem usar hooks explícitos de provedor, como `buildReplayPolicy`,
    `normalizeToolSchemas` e `wrapStreamFn`, em vez de um objeto estático.

  </Accordion>

  <Accordion title="Hooks de política de thinking → resolveThinkingProfile">
    **Antigo** (três hooks separados em `ProviderThinkingPolicy`):
    `isBinaryThinking(ctx)`, `supportsXHighThinking(ctx)` e
    `resolveDefaultThinkingLevel(ctx)`.

    **Novo**: um único `resolveThinkingProfile(ctx)` que retorna um
    `ProviderThinkingProfile` com o `id` canônico, `label` opcional e
    lista ranqueada de níveis. O OpenClaw rebaixa automaticamente valores
    armazenados obsoletos pela classificação do perfil.

    Implemente um hook em vez de três. Os hooks legados continuam funcionando
    durante a janela de descontinuação, mas não são compostos com o resultado
    do perfil.

  </Accordion>

  <Accordion title="Fallback de provedor OAuth externo → contracts.externalAuthProviders">
    **Antigo**: implementar `resolveExternalOAuthProfiles(...)` sem
    declarar o provedor no manifesto do plugin.

    **Novo**: declare `contracts.externalAuthProviders` no manifesto do plugin
    **e** implemente `resolveExternalAuthProfiles(...)`. O caminho antigo de "auth
    fallback" emite um aviso em runtime e será removido.

    ```json
    {
      "contracts": {
        "externalAuthProviders": ["anthropic", "openai"]
      }
    }
    ```

  </Accordion>

  <Accordion title="Busca de variável de ambiente do provedor → setup.providers[].envVars">
    Campo de manifesto **antigo**: `providerAuthEnvVars: { anthropic: ["ANTHROPIC_API_KEY"] }`.

    **Novo**: espelhe a mesma busca de variável de ambiente em `setup.providers[].envVars`
    no manifesto. Isso consolida metadados de ambiente de configuração/status em um
    só lugar e evita iniciar o runtime do plugin apenas para responder a consultas
    de variáveis de ambiente.

    `providerAuthEnvVars` permanece compatível por meio de um adaptador de compatibilidade
    até a janela de descontinuação fechar.

  </Accordion>

  <Accordion title="Registro de plugin de memória → registerMemoryCapability">
    **Antigo**: três chamadas separadas -
    `api.registerMemoryPromptSection(...)`,
    `api.registerMemoryFlushPlan(...)`,
    `api.registerMemoryRuntime(...)`.

    **Novo**: uma chamada na API memory-state -
    `registerMemoryCapability(pluginId, { promptBuilder, flushPlanResolver, runtime })`.

    Mesmos slots, uma única chamada de registro. Auxiliares aditivos de memória
    (`registerMemoryPromptSupplement`, `registerMemoryCorpusSupplement`,
    `registerMemoryEmbeddingProvider`) não são afetados.

  </Accordion>

  <Accordion title="Tipos de mensagens de sessão de subagente renomeados">
    Dois aliases de tipo legados ainda exportados de `src/plugins/runtime/types.ts`:

    | Antigo                        | Novo                            |
    | ----------------------------- | ------------------------------- |
    | `SubagentReadSessionParams`   | `SubagentGetSessionMessagesParams` |
    | `SubagentReadSessionResult`   | `SubagentGetSessionMessagesResult` |

    O método de runtime `readSession` está obsoleto em favor de
    `getSessionMessages`. Mesma assinatura; o método antigo repassa a chamada
    para o novo.

  </Accordion>

  <Accordion title="runtime.tasks.flow → runtime.tasks.managedFlows">
    **Antigo**: `runtime.tasks.flow` (singular) retornava um acessador de task-flow ativo.

    **Novo**: `runtime.tasks.managedFlows` mantém o runtime de mutação gerenciada do TaskFlow
    para plugins que criam, atualizam, cancelam ou executam tarefas-filhas a partir de um
    fluxo. Use `runtime.tasks.flows` quando o plugin precisar apenas de leituras baseadas em DTO.

    ```typescript
    // Before
    const flow = api.runtime.tasks.flow.fromToolContext(ctx);
    // After
    const flow = api.runtime.tasks.managedFlows.fromToolContext(ctx);
    ```

  </Accordion>

  <Accordion title="Fábricas de extensão embutidas → middleware de resultado de ferramenta do agente">
    Abordado em "Como migrar → Migrar extensões de resultado de ferramenta do Pi para
    middleware" acima. Incluído aqui para completude: o caminho removido exclusivo do Pi
    `api.registerEmbeddedExtensionFactory(...)` é substituído por
    `api.registerAgentToolResultMiddleware(...)` com uma lista explícita de runtime
    em `contracts.agentToolResultMiddleware`.
  </Accordion>

  <Accordion title="Alias OpenClawSchemaType → OpenClawConfig">
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
Descontinuações em nível de extensão (dentro de plugins de canal/provedor incluídos em
`extensions/`) são rastreadas dentro de seus próprios barrels `api.ts` e `runtime-api.ts`.
Elas não afetam contratos de plugins de terceiros e não estão listadas aqui.
Se você consumir diretamente o barrel local de um plugin incluído, leia os
comentários de descontinuação nesse barrel antes de atualizar.
</Note>

## Cronograma de remoção

| Quando                 | O que acontece                                                          |
| ---------------------- | ----------------------------------------------------------------------- |
| **Agora**              | Superfícies obsoletas emitem avisos em runtime                          |
| **Próxima versão principal** | Superfícies obsoletas serão removidas; plugins que ainda as usarem falharão |

Todos os plugins principais já foram migrados. Plugins externos devem migrar
antes da próxima versão principal.

## Suprimindo temporariamente os avisos

Defina estas variáveis de ambiente enquanto trabalha na migração:

```bash
OPENCLAW_SUPPRESS_PLUGIN_SDK_COMPAT_WARNING=1 openclaw gateway run
OPENCLAW_SUPPRESS_EXTENSION_API_WARNING=1 openclaw gateway run
```

Esta é uma saída temporária, não uma solução permanente.

## Relacionado

- [Primeiros passos](/pt-BR/plugins/building-plugins) - crie seu primeiro plugin
- [Visão geral do SDK](/pt-BR/plugins/sdk-overview) - referência completa de importação por subcaminho
- [Plugins de canal](/pt-BR/plugins/sdk-channel-plugins) - criação de plugins de canal
- [Plugins de provedor](/pt-BR/plugins/sdk-provider-plugins) - criação de plugins de provedor
- [Internos de plugins](/pt-BR/plugins/architecture) - análise detalhada da arquitetura
- [Manifesto de plugin](/pt-BR/plugins/manifest) - referência do esquema de manifesto
