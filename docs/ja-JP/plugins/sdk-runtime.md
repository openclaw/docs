---
read_when:
    - Pluginからcore helper（TTS、STT、image generation、web search、subagent、Node）を呼び出す必要があります
    - '`api.runtime` が何を公開しているかを理解したい場合'
    - Plugin codeからconfig、agent、またはmedia helperにアクセスしています
sidebarTitle: Runtime helpers
summary: api.runtime -- Pluginで利用可能な注入済みruntime helper
title: Plugin runtime helper
x-i18n:
  refreshed_at: '2026-04-28T04:45:00Z'
    generated_at: "2026-04-26T11:37:05Z"
    model: gpt-5.4
    provider: openai
    source_hash: db9e57f3129b33bd05a58949a4090a97014472d9c984af82c6aa3b4e16faa1b3
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

registration中にすべてのPluginへ注入される `api.runtime` objectのリファレンスです。host internalを直接importする代わりに、これらのhelperを使ってください。

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/ja-JP/plugins/sdk-channel-plugins">
    これらのhelperをchannel Pluginの文脈で使う、段階的なガイド。
  </Card>
  <Card title="Provider plugins" href="/ja-JP/plugins/sdk-provider-plugins">
    これらのhelperをprovider Pluginの文脈で使う、段階的なガイド。
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## runtime namespace

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    agent identity、directory、session管理。

    ```typescript
    // agentのworking directoryを解決
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // agent workspaceを解決
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // agent identityを取得
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // default thinking levelを取得
    const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

    // agent timeoutを取得
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // workspaceの存在を保証
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // 埋め込みagent turnを実行
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

    `runEmbeddedAgent(...)` は、Plugin codeから通常のOpenClaw agent turnを開始するための中立helperです。channelトリガーのreplyと同じprovider/model解決およびagent-harness選択を使用します。

    `runEmbeddedPiAgent(...)` は互換aliasとして残っています。

    **session store helper** は `api.runtime.agent.session` 配下にあります。

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    default modelおよびprovider定数:

    ```typescript
    const model = api.runtime.agent.defaults.model; // 例: "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // 例: "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    バックグラウンドsubagent runを起動して管理します。

    ```typescript
    // subagent runを開始
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Expand this query into focused follow-up searches.",
      provider: "openai", // 任意のoverride
      model: "gpt-4.1-mini", // 任意のoverride
      deliver: false,
    });

    // 完了を待つ
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // session messageを読む
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // sessionを削除
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    model override（`provider` / `model`）には、configで `plugins.entries.<id>.subagent.allowModelOverride: true` によるoperatorのopt-inが必要です。信頼されていないPluginでもsubagentは実行できますが、override requestは拒否されます。
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.nodes">
    接続中Nodeを一覧し、Gateway読み込み済みPlugin codeまたはPlugin CLI commandからNode host commandを呼び出します。別のMac上のbrowserやaudio bridgeなど、paired device上のローカル作業をPluginが所有している場合に使ってください。

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Gateway内では、このruntimeはin-processです。Plugin CLI commandでは、設定済みGatewayをRPC経由で呼び出すため、`openclaw googlemeet recover-tab` のようなcommandがterminalからpaired Nodeを検査できます。Node commandは引き続き通常のGateway Node pairing、command allowlist、Nodeローカルcommand handlingを通過します。

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    TaskFlow runtimeを既存のOpenClaw session keyまたは信頼済みtool contextにbindし、毎回ownerを渡さずにTaskFlowを作成・管理します。

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

    自前のbinding layerから信頼済みのOpenClaw session keyをすでに持っている場合は、`bindSession({ sessionKey, requesterOrigin })` を使ってください。生のuser inputからbindしないでください。

  </Accordion>
  <Accordion title="api.runtime.tts">
    text-to-speech合成。

    ```typescript
    // 標準TTS
    const clip = await api.runtime.tts.textToSpeech({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // telephony最適化TTS
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Hello from OpenClaw",
      cfg: api.config,
    });

    // 利用可能なvoiceを一覧
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    coreの `messages.tts` 設定とprovider選択を使用します。PCM audio buffer + sample rateを返します。

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    image、audio、video解析。

    ```typescript
    // imageを説明
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // audioを文字起こし
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // 任意。MIMEを推測できない場合用
    });

    // videoを説明
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // 汎用file解析
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });
    ```

    出力が生成されない場合（例: 入力をスキップした場合）は `{ text: undefined }` を返します。

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` は、`api.runtime.mediaUnderstanding.transcribeAudioFile(...)` の互換aliasとして残っています。
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    image生成。

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "A robot painting a sunset",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    web検索。

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    低レベルmedia utility。

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
    config読み込みと書き込み。

    ```typescript
    const cfg = await api.runtime.config.loadConfig();
    await api.runtime.config.writeConfigFile(cfg);
    ```

  </Accordion>
  <Accordion title="api.runtime.system">
    systemレベルutility。

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

  </Accordion>
  <Accordion title="api.runtime.events">
    event subscription。

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
    logging。

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    modelおよびprovider auth解決。

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    state directory解決。

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir();
    ```

  </Accordion>
  <Accordion title="api.runtime.tools">
    memory tool factoryとCLI。

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    channel固有runtime helper（channel Pluginが読み込まれているときに利用可能）。

    `api.runtime.channel.mentions` は、runtime injectionを使う同梱channel Plugin向けの共有inbound mention-policy surfaceです:

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

    利用可能なmention helper:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` は、意図的に旧 `resolveMentionGating*` 互換helperを公開していません。正規化された `{ facts, policy }` 経路を優先してください。

  </Accordion>
</AccordionGroup>

## runtime参照の保存

`register` callbackの外で使うためにruntime参照を保存するには `createPluginRuntimeStore` を使ってください。

<Steps>
  <Step title="storeを作成する">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "my-plugin runtime not initialized",
    });
    ```

  </Step>
  <Step title="entry pointに接続する">
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
  <Step title="他のfileからアクセスする">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // 未初期化ならthrowする
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // 未初期化ならnullを返す
    }
    ```

  </Step>
</Steps>

<Note>
runtime-storeの識別には `pluginId` を推奨します。より低レベルの `key` 形式は、1つのPluginが意図的に複数のruntime slotを必要とする珍しいケース向けです。
</Note>

## その他のトップレベル `api` field

`api.runtime` に加えて、API objectは次も提供します。

<ParamField path="api.id" type="string">
  Plugin id。
</ParamField>
<ParamField path="api.name" type="string">
  Plugin表示名。
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  現在のconfig snapshot（利用可能な場合はアクティブなin-memory runtime snapshot）。
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  `plugins.entries.<id>.config` からのPlugin固有config。
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  scope付きlogger（`debug`, `info`, `warn`, `error`）。
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  現在のload mode。`"setup-runtime"` は、完全entry前の軽量な起動 / setup windowです。
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Plugin root基準でpathを解決します。
</ParamField>

## 関連

- [Plugin internals](/ja-JP/plugins/architecture) — capability modelとregistry
- [SDK entry points](/ja-JP/plugins/sdk-entrypoints) — `definePluginEntry` option
- [SDK overview](/ja-JP/plugins/sdk-overview) — subpathリファレンス
