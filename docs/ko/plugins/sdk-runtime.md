---
read_when:
    - Plugin에서 core 도우미(TTS, STT, 이미지 생성, 웹 검색, 서브에이전트, Nodes)를 호출해야 합니다
    - '`api.runtime`가 무엇을 노출하는지 이해하려고 합니다'
    - Plugin 코드에서 config, 에이전트 또는 미디어 도우미에 접근하고 있습니다
sidebarTitle: Runtime helpers
summary: '`api.runtime` -- Plugins에서 사용할 수 있는 주입된 런타임 도우미'
title: Plugin 런타임 도우미
x-i18n:
    generated_at: "2026-04-26T11:36:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: db9e57f3129b33bd05a58949a4090a97014472d9c984af82c6aa3b4e16faa1b3
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

모든 Plugin에 등록 시 주입되는 `api.runtime` 객체에 대한 참조입니다. 호스트 내부를 직접 import하는 대신 이 도우미를 사용하세요.

<CardGroup cols={2}>
  <Card title="채널 Plugins" href="/ko/plugins/sdk-channel-plugins">
    채널 Plugins 맥락에서 이 도우미들을 사용하는 단계별 가이드입니다.
  </Card>
  <Card title="공급자 Plugins" href="/ko/plugins/sdk-provider-plugins">
    공급자 Plugins 맥락에서 이 도우미들을 사용하는 단계별 가이드입니다.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## 런타임 네임스페이스

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    에이전트 identity, 디렉터리, 세션 관리입니다.

    ```typescript
    // 에이전트 작업 디렉터리 확인
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // 에이전트 workspace 확인
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // 에이전트 identity 가져오기
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // 기본 thinking 수준 가져오기
    const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

    // 에이전트 시간 초과 가져오기
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // workspace 존재 보장
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // 임베디드 에이전트 턴 실행
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Summarize the latest changes",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)`는 Plugin 코드에서 일반 OpenClaw 에이전트 턴을 시작하기 위한 중립적인 도우미입니다. 채널 트리거 응답과 동일한 공급자/모델 확인 및 에이전트 harness 선택을 사용합니다.

    `runEmbeddedPiAgent(...)`는 호환성 별칭으로 남아 있습니다.

    **세션 저장소 도우미**는 `api.runtime.agent.session` 아래에 있습니다.

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    기본 모델 및 공급자 상수입니다.

    ```typescript
    const model = api.runtime.agent.defaults.model; // 예: "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // 예: "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    백그라운드 서브에이전트 실행을 시작하고 관리합니다.

    ```typescript
    // 서브에이전트 실행 시작
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // 선택적 재정의
      model: "gpt-4.1-mini", // 선택적 재정의
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
    모델 재정의(`provider`/`model`)는 config의 `plugins.entries.<id>.subagent.allowModelOverride: true`를 통해 운영자가 명시적으로 opt-in해야 합니다. 신뢰되지 않는 Plugins도 여전히 서브에이전트를 실행할 수 있지만, 재정의 요청은 거부됩니다.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.nodes">
    연결된 Nodes를 나열하고 Gateway에 로드된 Plugin 코드 또는 Plugin CLI 명령에서 Node 호스트 명령을 호출합니다. 다른 Mac의 브라우저나 오디오 브리지처럼 페어링된 기기에서 Plugin이 로컬 작업을 소유할 때 사용하세요.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway 내부에서는 이 런타임이 프로세스 내부에서 실행됩니다. Plugin CLI 명령에서는 구성된 Gateway를 RPC로 호출하므로, `openclaw googlemeet recover-tab` 같은 명령이 터미널에서 페어링된 Nodes를 검사할 수 있습니다. Node 명령은 여전히 일반 Gateway Node 페어링, 명령 허용 목록, Node 로컬 명령 처리를 거칩니다.

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    TaskFlow 런타임을 기존 OpenClaw 세션 키 또는 신뢰된 도구 컨텍스트에 바인드한 다음, 매 호출마다 소유자를 전달하지 않고 TaskFlow를 만들고 관리합니다.

    ```typescript
    const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Review new pull requests",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Review PR #123",
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

    자체 바인딩 계층에서 이미 신뢰된 OpenClaw 세션 키를 가지고 있다면 `bindSession({ sessionKey, requesterOrigin })`를 사용하세요. 원시 사용자 입력에서 바인드하지 마세요.

  </Accordion>
  <Accordion title="api.runtime.tts">
    텍스트 음성 변환입니다.

    ```typescript
    // 표준 TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // 전화용 최적화 TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // 사용 가능한 음성 목록
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    core `messages.tts` 구성과 공급자 선택을 사용합니다. PCM 오디오 버퍼 + 샘플 레이트를 반환합니다.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    이미지, 오디오, 비디오 분석입니다.

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
      mime: "audio/ogg", // 선택 사항, MIME을 추론할 수 없을 때
    });

    // 비디오 설명
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // 일반 파일 분석
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });
    ```

    출력이 생성되지 않으면(예: 입력 건너뜀) `{ text: undefined }`를 반환합니다.

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)`는 `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`의 호환성 별칭으로 남아 있습니다.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    이미지 생성입니다.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Web 검색입니다.

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
    const kind = api.runtime.media.mediaKindFromMime("image/jpeg"); // "image"
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
    Config 로드 및 쓰기입니다.

    ```typescript
    const cfg = await api.runtime.config.loadConfig();
    await api.runtime.config.writeConfigFile(cfg);
    ```

  </Accordion>
  <Accordion title="api.runtime.system">
    시스템 수준 유틸리티입니다.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

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
    모델 및 공급자 인증 확인입니다.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    상태 디렉터리 확인입니다.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir();
    ```

  </Accordion>
  <Accordion title="api.runtime.tools">
    메모리 도구 팩토리와 CLI입니다.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    채널별 런타임 도우미입니다(채널 Plugin이 로드된 경우 사용 가능).

    `api.runtime.channel.mentions`는 런타임 주입을 사용하는 번들 채널 Plugins를 위한 공용 수신 멘션 정책 표면입니다:

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

    사용 가능한 멘션 도우미:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions`는 의도적으로 이전 `resolveMentionGating*` 호환성 도우미를 노출하지 않습니다. 정규화된 `{ facts, policy }` 경로를 선호하세요.

  </Accordion>
</AccordionGroup>

## 런타임 참조 저장

`register` 콜백 외부에서 사용할 런타임 참조를 저장하려면 `createPluginRuntimeStore`를 사용하세요.

<Steps>
  <Step title="저장소 생성">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="엔트리 포인트에 연결">
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
      return store.getRuntime(); // 초기화되지 않았으면 throw
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // 초기화되지 않았으면 null 반환
    }
    ```

  </Step>
</Steps>

<Note>
런타임 저장소 식별자에는 `pluginId`를 선호하세요. 더 낮은 수준의 `key` 형식은 하나의 Plugin이 의도적으로 둘 이상의 런타임 슬롯을 필요로 하는 드문 경우를 위한 것입니다.
</Note>

## 기타 최상위 `api` 필드

`api.runtime` 외에도 API 객체는 다음을 제공합니다.

<ParamField path="api.id" type="string">
  Plugin ID.
</ParamField>
<ParamField path="api.name" type="string">
  Plugin 표시 이름.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  현재 config 스냅샷(가능한 경우 활성 메모리 내 런타임 스냅샷).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config`의 Plugin별 config.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  범위가 지정된 로거(`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  현재 로드 모드. `"setup-runtime"`은 전체 엔트리 이전의 경량 시작/설정 창입니다.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin 루트를 기준으로 한 경로 확인.
</ParamField>

## 관련 항목

- [Plugin 내부](/ko/plugins/architecture) — 기능 모델 및 레지스트리
- [SDK 엔트리 포인트](/ko/plugins/sdk-entrypoints) — `definePluginEntry` 옵션
- [SDK 개요](/ko/plugins/sdk-overview) — 하위 경로 참조
