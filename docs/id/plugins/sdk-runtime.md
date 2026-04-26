---
read_when:
    - Anda perlu memanggil helper core dari sebuah Plugin (TTS, STT, pembuatan gambar, pencarian web, subagent, nodes)
    - Anda ingin memahami apa yang diekspos oleh `api.runtime`
    - Anda sedang mengakses helper config, agen, atau media dari kode Plugin
sidebarTitle: Runtime helpers
summary: '`api.runtime` -- helper runtime yang disuntikkan dan tersedia untuk Plugin'
title: Helper runtime Plugin
x-i18n:
    generated_at: "2026-04-26T11:35:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: db9e57f3129b33bd05a58949a4090a97014472d9c984af82c6aa3b4e16faa1b3
    source_path: plugins/sdk-runtime.md
    workflow: 15
---

Referensi untuk objek `api.runtime` yang disuntikkan ke setiap Plugin selama pendaftaran. Gunakan helper ini alih-alih mengimpor internal host secara langsung.

<CardGroup cols={2}>
  <Card title="Channel plugins" href="/id/plugins/sdk-channel-plugins">
    Panduan langkah demi langkah yang menggunakan helper ini dalam konteks untuk Plugin channel.
  </Card>
  <Card title="Provider plugins" href="/id/plugins/sdk-provider-plugins">
    Panduan langkah demi langkah yang menggunakan helper ini dalam konteks untuk Plugin provider.
  </Card>
</CardGroup>

```typescript
register(api) {
  const runtime = api.runtime;
}
```

## Namespace runtime

<AccordionGroup>
  <Accordion title="api.runtime.agent">
    Identitas agen, direktori, dan manajemen sesi.

    ```typescript
    // Resolve direktori kerja agen
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);

    // Resolve workspace agen
    const workspaceDir = api.runtime.agent.resolveAgentWorkspaceDir(cfg);

    // Dapatkan identitas agen
    const identity = api.runtime.agent.resolveAgentIdentity(cfg);

    // Dapatkan level thinking default
    const thinking = api.runtime.agent.resolveThinkingDefault(cfg, provider, model);

    // Dapatkan timeout agen
    const timeoutMs = api.runtime.agent.resolveAgentTimeoutMs(cfg);

    // Pastikan workspace ada
    await api.runtime.agent.ensureAgentWorkspace(cfg);

    // Jalankan giliran agen embedded
    const agentDir = api.runtime.agent.resolveAgentDir(cfg);
    const result = await api.runtime.agent.runEmbeddedAgent({
      sessionId: "my-plugin:task-1",
      runId: crypto.randomUUID(),
      sessionFile: path.join(agentDir, "sessions", "my-plugin-task-1.jsonl"),
      workspaceDir: api.runtime.agent.resolveAgentWorkspaceDir(cfg),
      prompt: "Ringkas perubahan terbaru",
      timeoutMs: api.runtime.agent.resolveAgentTimeoutMs(cfg),
    });
    ```

    `runEmbeddedAgent(...)` adalah helper netral untuk memulai giliran agen OpenClaw normal dari kode Plugin. Ini menggunakan resolusi provider/model dan pemilihan agent-harness yang sama seperti balasan yang dipicu channel.

    `runEmbeddedPiAgent(...)` tetap ada sebagai alias kompatibilitas.

    **Helper penyimpanan sesi** berada di bawah `api.runtime.agent.session`:

    ```typescript
    const storePath = api.runtime.agent.session.resolveStorePath(cfg);
    const store = api.runtime.agent.session.loadSessionStore(cfg);
    await api.runtime.agent.session.saveSessionStore(cfg, store);
    const filePath = api.runtime.agent.session.resolveSessionFilePath(cfg, sessionId);
    ```

  </Accordion>
  <Accordion title="api.runtime.agent.defaults">
    Konstanta model dan provider default:

    ```typescript
    const model = api.runtime.agent.defaults.model; // mis. "anthropic/claude-sonnet-4-6"
    const provider = api.runtime.agent.defaults.provider; // mis. "anthropic"
    ```

  </Accordion>
  <Accordion title="api.runtime.subagent">
    Luncurkan dan kelola run subagen latar belakang.

    ```typescript
    // Mulai run subagen
    const { runId } = await api.runtime.subagent.run({
      sessionKey: "agent:main:subagent:search-helper",
      message: "Perluas kueri ini menjadi pencarian lanjutan yang terfokus.",
      provider: "openai", // override opsional
      model: "gpt-4.1-mini", // override opsional
      deliver: false,
    });

    // Tunggu hingga selesai
    const result = await api.runtime.subagent.waitForRun({ runId, timeoutMs: 30000 });

    // Baca pesan sesi
    const { messages } = await api.runtime.subagent.getSessionMessages({
      sessionKey: "agent:main:subagent:search-helper",
      limit: 10,
    });

    // Hapus sesi
    await api.runtime.subagent.deleteSession({
      sessionKey: "agent:main:subagent:search-helper",
    });
    ```

    <Warning>
    Override model (`provider`/`model`) memerlukan opt-in operator melalui `plugins.entries.<id>.subagent.allowModelOverride: true` di config. Plugin tak tepercaya tetap dapat menjalankan subagen, tetapi permintaan override ditolak.
    </Warning>

  </Accordion>
  <Accordion title="api.runtime.nodes">
    Cantumkan Node yang terhubung dan panggil perintah host-Node dari kode Plugin yang dimuat Gateway atau dari perintah CLI Plugin. Gunakan ini saat sebuah Plugin memiliki pekerjaan lokal pada perangkat yang paired, misalnya bridge browser atau audio di Mac lain.

    ```typescript
    const { nodes } = await api.runtime.nodes.list({ connected: true });

    const result = await api.runtime.nodes.invoke({
      nodeId: "mac-studio",
      command: "my-plugin.command",
      params: { action: "start" },
      timeoutMs: 30000,
    });
    ```

    Di dalam Gateway runtime ini bersifat in-process. Dalam perintah CLI Plugin, ini memanggil Gateway yang dikonfigurasi melalui RPC, sehingga perintah seperti `openclaw googlemeet recover-tab` dapat memeriksa Node yang paired dari terminal. Perintah Node tetap melalui node pairing Gateway normal, allowlist perintah, dan penanganan perintah lokal Node.

  </Accordion>
  <Accordion title="api.runtime.taskFlow">
    Ikat runtime TaskFlow ke key sesi OpenClaw yang ada atau konteks tool tepercaya, lalu buat dan kelola TaskFlow tanpa memberikan owner pada setiap pemanggilan.

    ```typescript
    const taskFlow = api.runtime.taskFlow.fromToolContext(ctx);

    const created = taskFlow.createManaged({
      controllerId: "my-plugin/review-batch",
      goal: "Tinjau pull request baru",
    });

    const child = taskFlow.runTask({
      flowId: created.flowId,
      runtime: "acp",
      childSessionKey: "agent:main:subagent:reviewer",
      task: "Tinjau PR #123",
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

    Gunakan `bindSession({ sessionKey, requesterOrigin })` saat Anda sudah memiliki key sesi OpenClaw tepercaya dari lapisan binding Anda sendiri. Jangan melakukan bind dari input pengguna mentah.

  </Accordion>
  <Accordion title="api.runtime.tts">
    Sintesis text-to-speech.

    ```typescript
    // TTS standar
    const clip = await api.runtime.tts.textToSpeech({
      text: "Halo dari OpenClaw",
      cfg: api.config,
    });

    // TTS yang dioptimalkan untuk telepon
    const telephonyClip = await api.runtime.tts.textToSpeechTelephony({
      text: "Halo dari OpenClaw",
      cfg: api.config,
    });

    // Daftar suara yang tersedia
    const voices = await api.runtime.tts.listVoices({
      provider: "elevenlabs",
      cfg: api.config,
    });
    ```

    Menggunakan konfigurasi core `messages.tts` dan pemilihan provider. Mengembalikan buffer audio PCM + sample rate.

  </Accordion>
  <Accordion title="api.runtime.mediaUnderstanding">
    Analisis gambar, audio, dan video.

    ```typescript
    // Deskripsikan gambar
    const image = await api.runtime.mediaUnderstanding.describeImageFile({
      filePath: "/tmp/inbound-photo.jpg",
      cfg: api.config,
      agentDir: "/tmp/agent",
    });

    // Transkripsikan audio
    const { text } = await api.runtime.mediaUnderstanding.transcribeAudioFile({
      filePath: "/tmp/inbound-audio.ogg",
      cfg: api.config,
      mime: "audio/ogg", // opsional, saat MIME tidak dapat diinferensikan
    });

    // Deskripsikan video
    const video = await api.runtime.mediaUnderstanding.describeVideoFile({
      filePath: "/tmp/inbound-video.mp4",
      cfg: api.config,
    });

    // Analisis file generik
    const result = await api.runtime.mediaUnderstanding.runFile({
      filePath: "/tmp/inbound-file.pdf",
      cfg: api.config,
    });
    ```

    Mengembalikan `{ text: undefined }` saat tidak ada output yang dihasilkan (misalnya input dilewati).

    <Info>
    `api.runtime.stt.transcribeAudioFile(...)` tetap ada sebagai alias kompatibilitas untuk `api.runtime.mediaUnderstanding.transcribeAudioFile(...)`.
    </Info>

  </Accordion>
  <Accordion title="api.runtime.imageGeneration">
    Pembuatan gambar.

    ```typescript
    const result = await api.runtime.imageGeneration.generate({
      prompt: "Robot melukis matahari terbenam",
      cfg: api.config,
    });

    const providers = api.runtime.imageGeneration.listProviders({ cfg: api.config });
    ```

  </Accordion>
  <Accordion title="api.runtime.webSearch">
    Pencarian web.

    ```typescript
    const providers = api.runtime.webSearch.listProviders({ config: api.config });

    const result = await api.runtime.webSearch.search({
      config: api.config,
      args: { query: "OpenClaw plugin SDK", count: 5 },
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.media">
    Utilitas media level rendah.

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
    Muat dan tulis config.

    ```typescript
    const cfg = await api.runtime.config.loadConfig();
    await api.runtime.config.writeConfigFile(cfg);
    ```

  </Accordion>
  <Accordion title="api.runtime.system">
    Utilitas tingkat sistem.

    ```typescript
    await api.runtime.system.enqueueSystemEvent(event);
    api.runtime.system.requestHeartbeatNow();
    const output = await api.runtime.system.runCommandWithTimeout(cmd, args, opts);
    const hint = api.runtime.system.formatNativeDependencyHint(pkg);
    ```

  </Accordion>
  <Accordion title="api.runtime.events">
    Langganan peristiwa.

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
    Logging.

    ```typescript
    const verbose = api.runtime.logging.shouldLogVerbose();
    const childLogger = api.runtime.logging.getChildLogger({ plugin: "my-plugin" }, { level: "debug" });
    ```

  </Accordion>
  <Accordion title="api.runtime.modelAuth">
    Resolusi auth model dan provider.

    ```typescript
    const auth = await api.runtime.modelAuth.getApiKeyForModel({ model, cfg });
    const providerAuth = await api.runtime.modelAuth.resolveApiKeyForProvider({
      provider: "openai",
      cfg,
    });
    ```

  </Accordion>
  <Accordion title="api.runtime.state">
    Resolusi direktori status.

    ```typescript
    const stateDir = api.runtime.state.resolveStateDir();
    ```

  </Accordion>
  <Accordion title="api.runtime.tools">
    Factory tool memori dan CLI.

    ```typescript
    const getTool = api.runtime.tools.createMemoryGetTool(/* ... */);
    const searchTool = api.runtime.tools.createMemorySearchTool(/* ... */);
    api.runtime.tools.registerMemoryCli(/* ... */);
    ```

  </Accordion>
  <Accordion title="api.runtime.channel">
    Helper runtime khusus channel (tersedia saat Plugin channel dimuat).

    `api.runtime.channel.mentions` adalah surface kebijakan mention masuk bersama untuk Plugin channel bawaan yang menggunakan injeksi runtime:

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

    Helper mention yang tersedia:

    - `buildMentionRegexes`
    - `matchesMentionPatterns`
    - `matchesMentionWithExplicit`
    - `implicitMentionKindWhen`
    - `resolveInboundMentionDecision`

    `api.runtime.channel.mentions` dengan sengaja tidak mengekspos helper kompatibilitas `resolveMentionGating*` yang lebih lama. Pilih jalur `{ facts, policy }` yang ternormalisasi.

  </Accordion>
</AccordionGroup>

## Menyimpan referensi runtime

Gunakan `createPluginRuntimeStore` untuk menyimpan referensi runtime agar dapat digunakan di luar callback `register`:

<Steps>
  <Step title="Buat store">
    ```typescript
    import { createPluginRuntimeStore } from "openclaw/plugin-sdk/runtime-store";
    import type { PluginRuntime } from "openclaw/plugin-sdk/runtime-store";

    const store = createPluginRuntimeStore<PluginRuntime>({
      pluginId: "my-plugin",
      errorMessage: "runtime my-plugin belum diinisialisasi",
    });
    ```

  </Step>
  <Step title="Hubungkan ke entry point">
    ```typescript
    export default defineChannelPluginEntry({
      id: "my-plugin",
      name: "My Plugin",
      description: "Contoh",
      plugin: myPlugin,
      setRuntime: store.setRuntime,
    });
    ```
  </Step>
  <Step title="Akses dari file lain">
    ```typescript
    export function getRuntime() {
      return store.getRuntime(); // melempar error jika belum diinisialisasi
    }

    export function tryGetRuntime() {
      return store.tryGetRuntime(); // mengembalikan null jika belum diinisialisasi
    }
    ```

  </Step>
</Steps>

<Note>
Pilih `pluginId` untuk identitas runtime-store. Bentuk `key` tingkat lebih rendah digunakan untuk kasus yang tidak umum ketika satu Plugin secara sengaja memerlukan lebih dari satu slot runtime.
</Note>

## Field `api` tingkat atas lainnya

Selain `api.runtime`, objek API juga menyediakan:

<ParamField path="api.id" type="string">
  Id Plugin.
</ParamField>
<ParamField path="api.name" type="string">
  Nama tampilan Plugin.
</ParamField>
<ParamField path="api.config" type="OpenClawConfig">
  Snapshot config saat ini (snapshot runtime in-memory aktif saat tersedia).
</ParamField>
<ParamField path="api.pluginConfig" type="Record<string, unknown>">
  Config khusus Plugin dari `plugins.entries.<id>.config`.
</ParamField>
<ParamField path="api.logger" type="PluginLogger">
  Logger bercakupan (`debug`, `info`, `warn`, `error`).
</ParamField>
<ParamField path="api.registrationMode" type="PluginRegistrationMode">
  Mode pemuatan saat ini; `"setup-runtime"` adalah jendela startup/setup ringan sebelum entri penuh.
</ParamField>
<ParamField path="api.resolvePath(input)" type="(string) => string">
  Resolve path relatif terhadap root Plugin.
</ParamField>

## Terkait

- [Plugin internals](/id/plugins/architecture) — model kapabilitas dan registry
- [SDK entry points](/id/plugins/sdk-entrypoints) — opsi `definePluginEntry`
- [SDK overview](/id/plugins/sdk-overview) — referensi subpath
