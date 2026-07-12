---
read_when:
    - Plugin에서 코어 헬퍼(TTS, STT, 이미지 생성, 웹 검색, Gateway, 하위 에이전트, 노드)를 호출해야 합니다.
    - api.runtime이 무엇을 노출하는지 이해하려고 합니다
    - Plugin 코드에서 구성, 에이전트 또는 미디어 헬퍼에 접근하고 있습니다.
sidebarTitle: Runtime helpers
summary: api.runtime -- Plugin에서 사용할 수 있는 주입된 런타임 헬퍼
title: Plugin 런타임 헬퍼
x-i18n:
    generated_at: "2026-07-12T15:31:58Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 9e43a2a56d15f970df68380a1b34776936777f667615bda51515b993e5bf3369
    source_path: plugins/sdk-runtime.md
    workflow: 16
---

등록 중 모든 Plugin에 주입되는 `api.runtime` 객체의 참조 문서입니다. 호스트 내부 모듈을 직접 가져오는 대신 이러한 헬퍼를 사용하십시오.

<CardGroup cols={2}>
  <Card title="채널 Plugin" href="/ko/plugins/sdk-channel-plugins">
    채널 Plugin에서 이러한 헬퍼를 맥락에 맞게 사용하는 단계별 가이드입니다.
  </Card>
  <Card title="프로바이더 Plugin" href="/ko/plugins/sdk-provider-plugins">
    프로바이더 Plugin에서 이러한 헬퍼를 맥락에 맞게 사용하는 단계별 가이드입니다.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

`api.runtime.version`은 현재 OpenClaw 제품 버전이며, 공유 버전 리졸버에서 가져오므로 Plugin에는 CLI가 보고하는 값과 동일한 값이 표시됩니다.

## 구성 로드 및 쓰기

활성 호출 경로에 이미 전달된 구성을 우선 사용하십시오. 예를 들어 등록 중에는 `api.config`를 사용하고, 채널/프로바이더 콜백에서는 `cfg` 인수를 사용합니다. 이렇게 하면 핫 경로에서 구성을 다시 파싱하는 대신 하나의 프로세스 스냅샷이 작업 전체에 전달됩니다.

수명이 긴 핸들러에 현재 프로세스 스냅샷이 필요하지만 해당 함수에 구성이 전달되지 않은 경우에만 `api.runtime.config.current()`를 사용하십시오. 반환된 값은 읽기 전용이므로 편집하기 전에 복제하거나 변경 헬퍼를 사용하십시오.

도구 팩토리는 `ctx.runtimeConfig`와 `ctx.getRuntimeConfig()`를 받습니다. 도구 정의를 만든 후 구성이 변경될 수 있는 경우 수명이 긴 도구의 `execute` 콜백 내부에서 getter를 사용하십시오.

변경 사항은 `api.runtime.config.mutateConfigFile(...)` 또는 `api.runtime.config.replaceConfigFile(...)`을 사용하여 영구 저장하십시오. 각 쓰기에서는 명시적인 `afterWrite` 정책을 선택해야 합니다.

- `afterWrite: { mode: "auto" }`를 사용하면 Gateway 다시 로드 플래너가 결정합니다.
- `afterWrite: { mode: "restart", reason: "..." }`는 작성자가 핫 다시 로드가 안전하지 않음을 아는 경우 완전한 재시작을 강제합니다.
- `afterWrite: { mode: "none", reason: "..." }`은 호출자가 후속 작업을 담당하는 경우에만 자동 다시 로드/재시작을 억제합니다.

변경 헬퍼는 `afterWrite`와 형식이 지정된 `followUp` 요약을 반환하므로 호출자는 재시작을 요청했는지 기록하거나 테스트할 수 있습니다. 해당 재시작이 실제로 언제 발생하는지는 여전히 Gateway가 관리합니다.

<Warning>
`api.runtime.config.loadConfig()`와 `api.runtime.config.writeConfigFile(...)`은 더 이상 사용되지 않습니다. 런타임에서 Plugin별로 한 번 경고하며, 마이그레이션 기간에는 이전 외부 Plugin을 위해서만 계속 사용할 수 있습니다. 번들 Plugin에서는 이를 사용해서는 안 됩니다. Plugin 코드가 이를 호출하거나 Plugin SDK 하위 경로에서 해당 헬퍼를 가져오면 내부 구성 경계 가드가 빌드를 실패시킵니다. 대신 `current()`, 전달받은 `cfg`, `mutateConfigFile(...)` 또는 `replaceConfigFile(...)`을 사용하십시오.
</Warning>

SDK에서 직접 가져올 때는 광범위한 `openclaw/plugin-sdk/config-runtime` 호환성 배럴보다 용도별 구성 하위 경로를 우선 사용하십시오. 타입에는 `config-contracts`, 이미 로드된 구성 어설션과 Plugin 항목 조회에는 `plugin-config-runtime`, 현재 프로세스 스냅샷에는 `runtime-config-snapshot`, 쓰기에는 `config-mutation`을 사용합니다. 번들 Plugin 테스트에서는 광범위한 호환성 배럴을 모킹하는 대신 이러한 용도별 하위 경로를 직접 모킹해야 합니다.

내부 OpenClaw 런타임 코드도 같은 방향을 따릅니다. CLI, Gateway 또는 프로세스 경계에서 구성을 한 번 로드한 다음 해당 값을 계속 전달합니다. 변경 쓰기가 성공하면 프로세스 런타임 스냅샷이 새로 고쳐지고 내부 리비전이 증가합니다. 수명이 긴 캐시는 구성을 로컬에서 직렬화하는 대신 런타임이 소유한 캐시 키를 기준으로 삼아야 합니다. 수명이 긴 런타임 모듈에는 주변 `loadConfig()` 호출을 허용하지 않는 무관용 스캐너가 있습니다. 전달받은 `cfg`, 요청의 `context.getRuntimeConfig()` 또는 명시적인 프로세스 경계의 `getRuntimeConfig()`를 사용하십시오.

프로바이더 및 채널 실행 경로에서는 구성 읽기 반환이나 편집을 위해 반환된 파일 스냅샷이 아니라 활성 런타임 구성 스냅샷을 사용해야 합니다. 파일 스냅샷은 UI와 쓰기를 위해 SecretRef 마커 같은 소스 값을 보존하지만, 프로바이더 콜백에는 해석된 런타임 뷰가 필요합니다. 헬퍼가 활성 소스 스냅샷 또는 활성 런타임 스냅샷 중 하나로 호출될 수 있는 경우 자격 증명을 읽기 전에 `selectApplicableRuntimeConfig()`를 거치도록 하십시오.

## 재사용 가능한 런타임 유틸리티

봇이 작성한 인바운드 메시지에는 인바운드 `botLoopProtection` 정보를 사용하십시오. 코어는 정책을 특정 채널에 결합하지 않고 세션 기록 및 디스패치 전에 공유 인메모리 슬라이딩 윈도 가드를 적용합니다. 가드는 `(scopeId, conversationId, participant pair)` 키를 추적하고, 쌍의 양방향을 함께 계산하며, 윈도 예산을 초과하면 쿨다운을 적용하고, 비활성 항목을 적절한 시점에 정리합니다.

운영자에게 이 동작을 노출하는 채널 Plugin은 기본 예산에 공유 `channels.defaults.botLoopProtection` 구조를 우선 사용한 다음, 그 위에 채널/제공자별 재정의를 적용해야 합니다. 공유 설정은 사용자에게 표시되므로 초 단위를 사용합니다.

```typescript
type ChannelBotLoopProtectionConfig = {
  enabled?: boolean;
  maxEventsPerWindow?: number;
  windowSeconds?: number;
  cooldownSeconds?: number;
};
```

확정된 턴과 함께 정규화된 봇 쌍 정보를 전달합니다. 코어는 기본값, 단위 변환, `enabled` 의미 체계를 결정합니다.

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

공유 수신 답장 실행기를 거치지 않는 사용자 정의 양자 간 이벤트 루프에만
`openclaw/plugin-sdk/pair-loop-guard-runtime`을 직접 사용하십시오.

## 런타임 네임스페이스

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    에이전트 ID, 디렉터리 및 세션 관리입니다.

    ```typescript
    // 에이전트의 작업 디렉터리를 확인합니다(agentId는 필수).
    const agentDir = api.runtime.agent.resolveAgentDir(cfg, agentId);

    // 에이전트 워크스페이스를 확인합니다.
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId);

    // 에이전트 ID를 가져옵니다.
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // 기본 사고 수준을 가져옵니다.
    const thinking = api.runtime.agent.resolveThinkingDefault({
      cfg,
      provider,
      model,
    });

    // 사용자가 제공한 사고 수준이 활성 제공자 프로필에 유효한지 검사합니다.
    const policy = api.runtime.agent.resolveThinkingPolicy({ provider, model });
    const level = api.runtime.agent.normalizeThinkingLevel("extra high");
    if (level && policy.levels.some((entry) => entry.id === level)) {
      // 임베디드 실행에 수준을 전달합니다.
    }

    // 에이전트 제한 시간을 가져옵니다.
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // 워크스페이스가 존재하도록 보장합니다.
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // 임베디드 에이전트 턴을 실행합니다.
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg, agentId),
      prompt: "최신 변경 사항을 요약해 주세요",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)`는 Plugin 코드에서 일반적인 OpenClaw 에이전트 턴을 시작하기 위한 중립적인 도우미입니다. 채널에서 트리거된 답장과 동일한 제공자/모델 결정 및 에이전트 하네스 선택을 사용합니다.

    `runEmbeddedPiAgent(...)`는 기존 Plugin을 위한 사용 중단 예정 호환성 별칭으로 유지됩니다. 새 코드는 `runEmbeddedAgent(...)`를 사용해야 합니다.

    `resolveThinkingPolicy(...)`는 제공자/모델이 지원하는 사고 수준과 선택적 기본값을 반환합니다. 제공자 Plugin은 사고 훅을 통해 모델별 프로필을 소유하므로, 도구 Plugin은 제공자 목록을 가져오거나 복제하는 대신 이 런타임 도우미를 호출해야 합니다.

    `normalizeThinkingLevel(...)`은 `on`, `x-high`, `extra high` 같은 사용자 텍스트를 확정된 정책과 비교하기 전에 정규 저장 수준으로 변환합니다.

    **세션 저장소 도우미**는 `api.runtime.agent.session` 아래에 있습니다.

    ```typescript
    const entry = api.runtime.agent.session.getSessionEntry({ agentId, sessionKey });
    for (const { sessionKey, entry } of api.runtime.agent.session.listSessionEntries({ agentId })) {
      // 레거시 sessions.json 구조에 의존하지 않고 세션 행을 순회합니다.
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
        // 세션을 생성하거나 업데이트한 다음 허용된 에이전트 실행에 signal을 전달합니다.
      },
    );
    ```

    세션 워크플로에는 `getSessionEntry(...)`, `listSessionEntries(...)`, `patchSessionEntry(...)` 또는 `upsertSessionEntry(...)`를 우선 사용하십시오. 이러한 도우미는 에이전트/세션 ID로 세션을 지정하므로 Plugin이 레거시 `sessions.json` 저장소 구조에 의존하지 않습니다. 세션 활동을 갱신하지 않아야 하는 메타데이터 전용 패치에는 `preserveActivity: true`를 사용하고, 콜백이 완전한 항목을 반환하며 삭제된 필드가 삭제된 상태로 유지되어야 할 때만 `replaceEntry: true`를 사용하십시오. Doctor 및 마이그레이션 경로에서는 `fallbackEntry`, `skipMaintenance`, `requireWriteSuccess`를 결합하여 하나의 원자적 정규 저장소 복구를 수행할 수 있습니다.

    `createSessionEntry(...)`는 새 정규 세션 행과 트랜스크립트를 생성합니다. 신뢰할 수 있는 `initialEntry` 표면은 의도적으로 제한되어 있습니다. 즉, 비어 있지 않은 `agentHarnessId`, 선택적 `modelSelectionLocked: true`, 선택적 `pluginExtensions`만 허용합니다. 주입된 런타임은 호출 Plugin이 `registerAgentHarness(...)`를 통해 소유하는 하네스 ID만 허용합니다. 이는 프로세스 내 Plugin 간의 샌드박스가 아니라 소유권 불변 조건입니다. 기존 행이 있으면 거부합니다. `label`과 `spawnedCwd`는 신뢰할 수 있는 항목 패치가 아니라 별도의 생성 필드입니다.

    생성 작업은 `afterCreate`가 완료될 때까지 세션 수명 주기 변경 펜스를 유지하므로 Plugin 소유 초기화가 끝날 때까지 새 작업이 대기하며, 기존에 허용된 작업이 있으면 생성에 실패합니다. 콜백은 생성된 상태의 복제본을 받습니다. 패치를 반환하는 경우 해당 패치에는 `pluginExtensions`만 포함할 수 있으며, 그 값은 완전한 최종 `pluginExtensions` 필드입니다. 콜백 또는 최종 영속화에 실패하면 변경되지 않은 새 행과 트랜스크립트를 롤백합니다. 보호된 롤백은 동시에 변경되거나 점유된 행을 보존합니다. `recoverMatchingInitialEntry: true`는 영속화된 신뢰 필드가 정확히 일치할 때 중단된 초기화를 재시도하는 용도로만 사용하며, 복구하려면 `afterCreate`가 최종 패치를 반환해야 합니다.

    Plugin이 영속 세션에서 작업을 시작할 때 `runWithWorkAdmission(...)`을 사용하십시오. 콜백은 보관되었거나 동시에 교체된 세션을 거부하고, 보관/재설정/삭제 변경이 완료될 때까지 조정된 상태로 유지하며, 에이전트 실행에 전달해야 하는 `AbortSignal`을 받습니다. 하네스는 실험적 `delegatedExecutionPluginIds` 등록 필드를 통해 신뢰할 수 있는 실행 위임자를 명시적으로 지정할 수 있습니다. 위임자는 정확히 일치하는 기존 모델 잠금 세션만 허용하고 실행할 수 있으며, 모든 세션 변경은 계속해서 하네스 소유자로 제한됩니다. [에이전트 하네스 Plugin](/ko/plugins/sdk-agent-harness#delegated-execution)을 참조하십시오.

    유지관리 및 복구 Plugin은 범위가 지정된 단일 세션 항목에 `deleteSessionEntry(...)`를, 수명 주기가 소유하는 임시 세션에 `cleanupSessionLifecycleArtifacts(...)`를, 저장소를 변경하기 전에 `resolveSessionStoreBackupPaths(...)`를 사용할 수 있습니다. 이러한 도우미는 제한된 복구/수명 주기 표면이며, 범용 저장소 삭제 API가 아닙니다.

    `resolveStorePath(...)`와 `updateSessionStoreEntry(...)`는 세션 도우미를 보완합니다. `resolveStorePath`는 주어진 범위의 세션 저장소 경로를 확인하며, `updateSessionStoreEntry({ storePath, sessionKey, update })`는 호출자가 이미 저장소 경로를 알고 있을 때 해당 경로를 기준으로 항목 하나를 직접 패치합니다.

    `loadTranscriptEventsSync(...)`는 비동기 트랜스크립트 런타임을 사용할 수 없는 동기식 doctor 및 복구 경로에서 사용할 수 있습니다. 원시 `SessionStoreTranscriptEvent` 레코드를 반환합니다. 일반적인 Plugin 런타임 코드는 `openclaw/plugin-sdk/session-transcript-runtime`을 우선 사용해야 합니다.

    `formatSqliteSessionFileMarker(...)`, `parseSqliteSessionFileMarker(...)`, `sqliteSessionFileMarkerMatchesSession(...)`은 여전히 `sessionFile`이라는 레거시 필드를 받는 코드를 위한 전환용 도우미입니다. 파싱된 SQLite 마커는 활성 SQLite 트랜스크립트 대상을 식별하며, 파일 시스템 경로가 아닙니다. 새 API는 마커 문자열 대신 형식화된 세션 ID 정보를 전달해야 합니다.

    트랜스크립트를 읽고 쓸 때는 `openclaw/plugin-sdk/session-transcript-runtime`을 가져오고 `{ agentId, sessionKey, sessionId }`와 함께 `resolveSessionTranscriptIdentity(...)`, `resolveSessionTranscriptTarget(...)`, `readSessionTranscriptEvents(...)`, `readVisibleSessionTranscriptMessageEntries(...)`, `appendSessionTranscriptMessageByIdentity(...)`, `publishSessionTranscriptUpdateByIdentity(...)` 또는 `withSessionTranscriptWriteLock(...)`을 사용하십시오. 이러한 API를 통해 Plugin은 활성 트랜스크립트 파일 경로에 의존하지 않고 트랜스크립트를 식별하고, 원시 이벤트 또는 분기 안전성이 보장되는 표시 메시지 항목을 읽고, 메시지를 추가하고, 업데이트를 게시하며, 동일한 트랜스크립트 쓰기 잠금 아래에서 관련 작업을 실행할 수 있습니다. `readVisibleSessionTranscriptMessageEntries(...)`는 정렬된 읽기 메타데이터를 반환합니다. 이 메타데이터의 `seq` 필드는 재개 가능한 커서가 아닙니다.

    레거시 전체 저장소 및 활성 트랜스크립트 파일 도우미는 더 이상 Plugin SDK에서 내보내지 않습니다. 세션 메타데이터에는 범위 지정 항목 도우미를 사용하고, 활성 트랜스크립트 작업에는 트랜스크립트 ID 도우미를 사용하십시오. 파일 아티팩트가 필요한 보관/지원 워크플로는 활성 세션 런타임 API 대신 전용 보관 표면을 사용해야 합니다.

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    기본 모델 및 공급자 상수:

    ```typescript
    const model = api.runtime.agent.defaults.model; // 예: "gpt-5.6-sol"
    const provider = api.runtime.agent.defaults.provider; // 예: "openai"
    ```

  </Accordion>

  <Accordion title="api.runtime.llm">
    공급자 내부 구현을 가져오거나 OpenClaw 모델/인증/기본 URL 준비를
    중복하지 않고 호스트가 소유하는 텍스트 완성을 실행합니다.

    ```typescript
    const result = await api.runtime.llm.complete({
      messages: [{ role: "user", content: "이 트랜스크립트를 요약하십시오." }],
      purpose: "my-plugin.summary",
      maxTokens: 512,
      temperature: 0.2,
    });
    ```

    공급자 오케스트레이션은 HTTP 요청을 실행하기 전에 구성된 로컬 서비스의
    수명 주기도 확보할 수 있습니다.

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
      // 공급자 요청을 전송하고 완전히 소비합니다.
    } finally {
      await lease?.release();
    }
    ```

    `acquireLocalService(...)`는 안정적인 범용 공급자 서비스 SDK
    계약입니다. 호스트는 `models.providers.<providerId>.localService`에서
    프로세스 구성을 확인합니다. 호출자는 명령, 인수, 환경 또는 수명 주기 정책을
    제공할 수 없습니다. 프로세스 생성, 준비 상태, 진단 및 유휴 중지 정책은 호스트 내부에 유지됩니다.

    구성된 공급자 ID와 확인된 요청 기본 URL을 정확히 전달하십시오. 별칭을
    어댑터 ID로 바꾸지 마십시오. 별도의 별칭이 서로 다른 로컬 GPU 호스트를 가리킬 수
    있습니다. 호스트는 Ollama 및 LM Studio 어댑터에서 사용하는 `/v1` 정규화를
    제외하고, 구성된 공급자 기본 URL과 일치하지 않는 엔드포인트를 거부합니다.
    호스트가 시작 직렬화, 준비 상태 프로브, 요청 임대, 중단 처리 및 유휴 종료를 소유합니다.

    이 도우미는 OpenClaw의 기본 제공 런타임과 동일한 단순 완성 준비 경로 및
    호스트가 소유하는 런타임 구성 스냅샷을 사용합니다. 컨텍스트 엔진은 세션에
    바인딩된 `llm.complete` 기능을 받으므로 모델 호출은 활성 세션의 에이전트를
    사용하며 기본 에이전트로 자동 대체되지 않습니다. 결과에는 공급자/모델/에이전트
    귀속 정보와, 가능한 경우 정규화된 토큰, 캐시 및 예상 비용 사용량이 포함됩니다.

    <Warning>
    모델 재정의에는 구성에서 `plugins.entries.<id>.llm.allowModelOverride: true`를 통한 운영자의 명시적 동의가 필요합니다. 신뢰할 수 있는 Plugin을 특정 정규 `provider/model` 대상으로 제한하려면 `plugins.entries.<id>.llm.allowedModels`를 사용하십시오. 에이전트 간 완성에는 `plugins.entries.<id>.llm.allowAgentIdOverride: true`가 필요합니다.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.gateway">
    현재 Plugin의 신뢰할 수 있는 런타임 ID를 유지하면서 프로세스 내에서 다른 Gateway 메서드를
    호출합니다. 이는 루프백 WebSocket 연결을 열지 않고 Plugin 소유의 Gateway 기능을 조합하는
    번들 또는 신뢰할 수 있는 공식 Plugin을 위한 것입니다.

    ```typescript
    if (await api.runtime.gateway.isAvailable()) {
      const result = await api.runtime.gateway.request<{ callId: string }>(
        "voicecall.start",
        { to: "+15550001234", mode: "conversation" },
        { timeoutMs: 60_000 },
      );
    }
    ```

    요청은 `operator.write` 범위를 사용하며 관리자 범위를 부여하지 않습니다. 임의의 외부
    Plugin에서 보낸 호출은 거부됩니다. 실패한 메서드는 `GatewayClientRequestError`를 발생시키며,
    복구 흐름을 위해 구조화된 `details`, 재시도 메타데이터 및 Gateway 오류 코드를 보존합니다.
    독립 실행형 에이전트 프로세스에서도 실행할 수 있는 도구에서 이 경로를 선택하기 전에 `isAvailable()`을
    사용하십시오.

  </Accordion>
  <Accordion title="api.runtime.subagent">
    백그라운드 하위 에이전트 실행을 시작하고 관리합니다.

    ```typescript
    // 하위 에이전트 실행 시작
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "이 쿼리를 구체적인 후속 검색으로 확장하십시오.",
      provider: "openai", // 선택적 재정의
      model: "gpt-5.6-sol", // 선택적 재정의
      deliver: false,
    });

    // 완료 대기
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // 세션 메시지 읽기
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // 세션 삭제
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    모델 재정의(`provider`/`model`)에는 구성에서 `plugins.entries.<id>.subagent.allowModelOverride: true`를 통한 운영자의 명시적 동의가 필요합니다. 신뢰할 수 없는 Plugin도 하위 에이전트를 실행할 수 있지만 재정의 요청은 거부됩니다.
    </Warning>

    `deleteSession(...)`은 동일한 Plugin이 `api.runtime.subagent.run(...)`을 통해 생성한 세션을 삭제할 수 있습니다. 임의의 사용자 또는 운영자 세션을 삭제하려면 여전히 관리자 범위의 Gateway 요청이 필요합니다.

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Gateway에서 로드된 Plugin 코드 또는 Plugin CLI 명령에서 연결된 Node를 나열하고 Node 호스트 명령을 호출합니다. 다른 Mac의 브라우저 또는 오디오 브리지처럼, 페어링된 장치의 로컬 작업을 Plugin이 소유할 때 사용하십시오.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    `nodes.list(...)`는 각 연결된 Node가 Plugin 또는 MCP 기반 도구를
    에이전트에 노출할 때 해당 Node가 알리는 `nodePluginTools` 설명자를
    포함합니다. 이러한 설명자는 활성 연결 상태입니다. Node의 연결이 끊기면 Gateway가
    이를 제거하며, 로컬 Plugin/MCP 인벤토리가 변경된 후 Node는
    `node.pluginTools.update`로 이를 교체할 수 있습니다.

    Gateway 내부에서 이 런타임은 인프로세스로 작동합니다. Plugin CLI 명령에서는 구성된 Gateway를 RPC로 호출하므로 `openclaw googlemeet recover-tab` 같은 명령으로 터미널에서 페어링된 Node를 검사할 수 있습니다. Node 명령에는 여전히 일반적인 Gateway Node 페어링, 명령 허용 목록, Plugin Node 호출 정책 및 Node 로컬 명령 처리가 적용됩니다.

    Node에서 호스팅되는 에이전트 도구를 노출하는 Plugin은 기본적으로 허용 목록에 포함해야 하는 위험하지 않은 명령에 `agentTool.defaultPlatforms`를 설정할 수 있습니다. 운영자가 `gateway.nodes.allowCommands`로 명시적으로 허용해야 하는 경우에는 생략하십시오. 위험한 Node 호스트 명령은 `api.registerNodeInvokePolicy(...)`로 Node 호출 정책을 등록해야 합니다. 이 정책은 명령 허용 목록 검사 후 명령이 Node로 전달되기 전에 Gateway에서 실행되므로, 직접 `node.invoke` 호출, Node 호스팅 Plugin 도구 및 상위 수준 Plugin 도구에 동일한 적용 경로가 사용됩니다.

    <Warning>
    선택적 `scopes` 필드는 호출에 필요한 Gateway 운영자 범위를 요청합니다. OpenClaw는 번들 Plugin 및 신뢰할 수 있는 공식 Plugin 설치에만 이를 적용하며, 다른 Plugin의 요청은 호출 권한을 상승시키지 않습니다. 신뢰할 수 있는 Plugin이 `operator.admin`처럼 더 엄격한 Gateway 범위로 Node 명령을 호출해야 할 때만 사용하십시오.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.tasks">
    Task Flow 및 Task Run 상태를 기존 OpenClaw 세션 키 또는 신뢰할 수 있는 도구 컨텍스트에 바인딩합니다.

    - `api.runtime.tasks.managedFlows`는 변경 작업을 지원합니다. Task Flow를 생성하고, 진행하고, 취소할 수 있습니다.
    - `api.runtime.tasks.flows`와 `api.runtime.tasks.runs`는 목록 조회와 상태 확인을 위한 읽기 전용 DTO 뷰입니다. 둘 다 `bindSession(...)` / `fromToolContext(...)`와 `get`, `list`, `findLatest`, `resolve`를 노출합니다.
    - `api.runtime.tasks.flow`는 `managedFlows`의 사용 중단된 별칭입니다.

    Task Flow는 지속적인 다단계 워크플로 상태를 추적합니다. 스케줄러가 아닙니다.
    이후의 깨우기에는 Cron 또는 `api.session.workflow.scheduleSessionTurn(...)`을
    사용한 다음, 해당 작업에 흐름 상태, 하위 작업, 대기 또는 취소가 필요한 경우
    예약된 턴에서 `managedFlows`를 사용하십시오.

    ```typescript
    const taskFlow = api.runtime.tasks.managedFlows.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "새로운 풀 리퀘스트 검토",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "PR #123 검토",
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

    자체 바인딩 계층에서 신뢰할 수 있는 OpenClaw 세션 키를 이미 보유하고 있다면 `bindSession({ sessionKey, requesterOrigin })`을 사용하십시오. 원시 사용자 입력으로 바인딩하지 마십시오.

  </Accordion>
  <Accordion title="api.runtime.tts">
    텍스트 음성 변환 합성.

    ```typescript
    // 표준 TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "OpenClaw에서 안녕하세요",
      cfg: api.config,
    });

    // 전화 통신에 최적화된 TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "OpenClaw에서 안녕하세요",
      cfg: api.config,
    });

    // 사용 가능한 음성 목록 조회
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    코어 `messages.tts` 구성과 제공자 선택을 사용합니다. PCM 오디오 버퍼와 샘플 레이트를 반환합니다. 스트리밍 합성에는 `textToSpeechStream`도 사용할 수 있습니다.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    이미지, 오디오 및 동영상 분석입니다.

    ```typescript
    // 이미지 설명
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // 오디오 전사
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // 선택 사항이며, MIME을 추론할 수 없을 때 사용합니다
    });

    // 동영상 설명
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // 범용 파일 분석
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });

    // 특정 제공자/모델을 통한 구조화된 이미지 추출입니다.
    // 이미지를 하나 이상 포함하십시오. 텍스트 입력은 보충 컨텍스트입니다.
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
        { type: "text", text: "손으로 쓴 메모보다 인쇄된 합계를 우선하십시오." },
      ],
      instructions: "판매자, 합계 및 검색 가능한 태그를 추출하십시오.",
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

    출력이 생성되지 않으면(예: 입력을 건너뛴 경우) `{ text: undefined }`를 반환합니다.

    `describeImageFileWithModel(...)`은 이미 이미지로 확인된 파일을 특정 제공자/모델을 통해 설명하며, `describeImageFile(...)`이 사용하는 기본 활성 모델 결정을 우회합니다.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)`은 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`의 호환성 별칭으로 유지됩니다.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    이미지 생성입니다.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "노을을 그리는 로봇",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.videoGeneration">
    이미지 생성과 동일한 형태의 동영상 생성입니다.

    ```typescript
    const result = await api.runtime.videoGeneration.generate({
      prompt: "일출 때 해안선 위를 비행하는 드론 촬영 영상",
      cfg: api.config,
    });

    const providers = api.runtime.videoGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.musicGeneration">
    이미지 생성과 동일한 형태의 음악 생성입니다.

    ```typescript
    const result = await api.runtime.musicGeneration.generate({
      prompt: "코딩 세션을 위한 경쾌한 로파이 트랙",
      cfg: api.config,
    });

    const providers = api.runtime.musicGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    웹 검색입니다.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    저수준 미디어 유틸리티입니다.

    ```typescript
    const webMedia = await api.runtime.media.loadWebMedia(url);
    const mime = await api.runtime.media.detectMime(buffer);
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "이미지"
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
    현재 런타임 구성 스냅샷과 트랜잭션 방식의 구성 쓰기입니다. 활성 호출 경로에
    이미 전달된 구성을 우선 사용하고, 핸들러가 프로세스 스냅샷을 직접 필요로 할
    때만 `current()`를 사용하십시오.

    ```typescript
    const cfg = api.runtime.config.current();
    await api.runtime.config.mutateConfigFile({
      afterWrite: { mode: "auto" },
      mutate(draft) {
        draft.plugins ??= {};
      },
    });
    ```

    `mutateConfigFile(...)`과 `replaceConfigFile(...)`은 `followUp`
    값을 반환합니다. 예를 들면 `{ mode: "restart", requiresRestart: true, reason }`이며,
    이는 Gateway에서 재시작 제어 권한을 가져오지 않으면서 작성자의 의도를
    기록합니다.

  </Accordion>
  <Accordion title="api.runtime.system">
    시스템 수준 유틸리티입니다.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeat({
      source: "other",
      intent: "event",
      reason: "plugin-event",
    });
    api.runtime.system.requestHeartbeatNow({ reason: "plugin-event" }); // 더 이상 사용되지 않는 호환성 별칭입니다.
    const heartbeatResult = await api.runtime.system.runHeartbeatOnce({
      reason: "plugin-triggered-check",
    });
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

    `runHeartbeatOnce(...)`는 일반적인 병합 타이머를 우회하여 단일 Heartbeat 주기를 즉시 실행합니다. 기본 `target: "none"` 억제 대신 마지막 활성 채널로 강제 전달하려면 `{ heartbeat: { target: "last" } }`를 전달하십시오.

    `runCommandWithTimeout(...)`은 캡처된 `stdout`과 `stderr`, 선택적
    잘림 횟수, `code`, `signal`, `killed`, `termination` 및
    `noOutputTimedOut`을 반환합니다. 자식 프로세스가 0이 아닌 종료 코드를 제공하지
    않는 경우 시간 초과 및 무출력 시간 초과 결과는 `code: 124`를 보고합니다. 시간
    초과가 아닌 신호 종료에서도 `code: null`을 반환할 수 있으므로 시간 초과 원인을
    구분하려면 `termination`과 `noOutputTimedOut`을 사용하십시오.

  </Accordion>
  <Accordion title="api.runtime.events">
    이벤트 구독입니다.

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
    로깅입니다.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    모델 및 제공자 인증 결정입니다.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });

    // 제공자 런타임 교환(예: OAuth 갱신)을 포함한 요청 준비 완료 인증
    const runtimeAuth = await api.runtime.modelAuth.getRuntimeAuthForModel({ model, cfg });

    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    상태 디렉터리 결정과 SQLite 기반 키 저장소입니다.

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

    키 저장소는 재시작 후에도 유지되며 런타임에 바인딩된 plugin ID별로 격리됩니다. 원자적 중복 제거 선점에는 `registerIfAbsent(...)`를 사용하십시오. 키가 없거나 만료되어 등록된 경우 `true`를 반환하고, 활성 값이 이미 존재하는 경우 해당 값, 생성 시간 또는 TTL을 덮어쓰지 않고 `false`를 반환합니다. 제한 사항: 네임스페이스당 `maxEntries`, plugin당 활성 행 50,000개, 64KB 미만의 JSON 값 및 선택적 TTL 만료입니다. 기본적으로 두 행 제한 중 하나에 도달한 상태에서 쓰기를 수행하면 쓰기 대상 네임스페이스에서 가장 오래된 활성 행을 제거합니다. 해당 쓰기로 인해 형제 네임스페이스의 항목은 제거되지 않으며, 네임스페이스에서 충분한 행을 확보하지 못하면 쓰기는 여전히 실패합니다. 절대 제거되어서는 안 되는 영구 소유권 레코드에는 `overflowPolicy: "reject-new"`를 설정하십시오. 새 키는 두 제한 중 하나에 도달하면 실패하지만 기존 키는 계속 업데이트할 수 있습니다.

    `openSyncKeyedStore<T>(...)`는 대기할 수 없는 호출자를 위해 동기 메서드를 사용하는 동일한 저장소 형태를 반환합니다(`register`, `registerIfAbsent`, `lookup`, `consume`, `clear`는 모두 프로미스 대신 값을 직접 반환합니다).

    `openChannelIngressQueue<TPayload>(...)`는 재시작 간 최소 1회 처리가 필요한 수신 이벤트를 버퍼링하기 위해 호출 plugin 범위의 영구 인그레스 큐를 엽니다. 오래된 선점 복구에 `shouldRecover`를 사용하는 경우, 손상된 선점 페이로드를 격리해야 한다면 `shouldRecoverCorrupt`도 제공하십시오. 페이로드와 독립적인 선점 식별자를 사용하면 큐가 행을 툼스톤 처리하기 전에 plugin이 활성 소유자 및 레인 정책을 보존할 수 있습니다.

    <Warning>
    이 릴리스에서 `openKeyedStore`, `openSyncKeyedStore` 및 `openChannelIngressQueue`는 번들 plugin과 신뢰할 수 있는 공식 plugin 설치에서만 사용할 수 있습니다.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.channel">
    채널별 런타임 도우미입니다(채널 plugin이 로드되었을 때 사용할 수 있음). 관심사별로 그룹화됩니다:

    | 그룹 | 목적 |
    | --- | --- |
    | `text` | 청킹(`chunkText`, `chunkMarkdownText`, `resolveChunkMode`), 제어 명령 감지, Markdown 표 변환. |
    | `reply` | 버퍼링된 블록 응답 디스패치, 엔벌로프 형식 지정, 유효 메시지/사람 지연 구성 확인. |
    | `routing` | `buildAgentSessionKey`, `resolveAgentRoute`. |
    | `pairing` | `buildPairingReply`, 허용 목록 읽기, 페어링 요청 업서트. |
    | `media` | 원격 미디어 다운로드/저장(아래 참조). |
    | `activity` | 마지막 채널 활동 기록/읽기. |
    | `session` | 인바운드 이벤트의 세션 메타데이터, 마지막 경로 업데이트. |
    | `mentions` | 멘션 정책 헬퍼(아래 참조). |
    | `reactions` | 진행 중인 처리 표시기를 위한 확인 반응 핸들. |
    | `groups` | 그룹 정책 및 멘션 요구 여부 확인. |
    | `debounce` | 인바운드 메시지 디바운싱. |
    | `commands` | 명령 권한 부여 및 텍스트 명령 게이팅. |
    | `outbound` | 채널의 아웃바운드 어댑터 로드. |
    | `inbound` | 인바운드 이벤트 컨텍스트를 구성하고 공유 인바운드 이벤트/응답 커널을 실행. |
    | `threadBindings` | 바인딩된 세션 스레드의 유휴 제한 시간/최대 수명 조정. |
    | `runtimeContexts` | 프로세스 로컬 채널별/계정별/기능별 컨텍스트 등록, 읽기 및 감시. |

    `api.runtime.channel.media`는 채널 미디어 다운로드 및 저장에 권장되는 표면입니다.

    ```typescript
    const saved = await api.runtime.channel.media.saveRemoteMedia({
      url,
      subdir: "inbound",
      maxBytes,
      filePathHint: fileName,
    });
    ```

    원격 URL을 OpenClaw 미디어로 변환해야 할 때 `saveRemoteMedia(...)`를 사용하십시오. Plugin 소유 인증, 리디렉션 또는 허용 목록 처리를 통해 Plugin이 이미 `Response`를 가져온 경우에는 `saveResponseMedia(...)`를 사용하십시오. Plugin이 검사, 변환, 복호화 또는 재업로드를 위해 원시 바이트가 필요한 경우에만 `readRemoteMediaBuffer(...)`를 사용하십시오. `fetchRemoteMedia(...)`는 `readRemoteMediaBuffer(...)`의 사용 중단된 호환성 별칭으로 유지됩니다.

    `api.runtime.channel.mentions`는 런타임 주입을 사용하는 번들 채널 Plugin을 위한 공유 인바운드 멘션 정책 표면입니다.

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

    사용 가능한 멘션 헬퍼:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions`는 의도적으로 이전 `resolveMentionGating*` 호환성 헬퍼를 노출하지 않습니다. 정규화된 `{ facts, policy }` 경로를 사용하십시오.

    `reply`, `session`, `inbound` 아래의 여러 필드에는 현재 채널 턴 커널 또는 채널 아웃바운드 어댑터를 가리키는 필드별 `@deprecated` 참고 사항이 있습니다. 특정 헬퍼를 기반으로 새 코드를 작성하기 전에 인라인 JSDoc을 확인하십시오.

  </Accordion>
</AccordionGroup>

## 런타임 참조 저장

`register` 콜백 외부에서 사용할 런타임 참조를 저장하려면 `createPluginRuntimeStore`를 사용하십시오.

<Steps>
  <Step title="스토어 생성">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="진입점에 연결">
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
  <Step title="다른 파일에서 접근">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // 초기화되지 않은 경우 예외 발생
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // 초기화되지 않은 경우 null 반환
    }
    ```

  </Step>
</Steps>

<Note>
런타임 스토어 식별에는 `pluginId`를 사용하는 것이 좋습니다. 하위 수준의 `key` 형식은 하나의 Plugin에 의도적으로 둘 이상의 런타임 슬롯이 필요한 드문 경우에 사용합니다.
</Note>

## 기타 최상위 `api` 필드

API 객체는 `api.runtime` 외에도 다음을 제공합니다.

<ParamField path="api.id" type="string">
  Plugin ID.
</ParamField>
<ParamField path="api.name" type="string">
  Plugin 표시 이름.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  현재 구성 스냅샷(사용 가능한 경우 활성 인메모리 런타임 스냅샷).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config`의 Plugin별 구성.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  범위가 지정된 로거(`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  현재 로드 모드: `"full"`(실시간 활성화), `"discovery"` / `"tool-discovery"`(읽기 전용 기능 검색), `"setup-only"`(경량 설정 진입점), `"setup-runtime"`(런타임 채널 진입점도 필요한 설정 흐름) 또는 `"cli-metadata"`(CLI 명령 메타데이터 수집).
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin 루트를 기준으로 상대 경로를 확인합니다.
</ParamField>

## 관련 문서

- [Plugin 내부 구조](/ko/plugins/architecture) — 기능 모델 및 레지스트리
- [SDK 진입점](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 옵션
- [SDK 개요](/ko/plugins/sdk-overview) — 하위 경로 참조
