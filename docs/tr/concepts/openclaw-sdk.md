---
read_when:
    - OpenClaw ile iletişim kuran harici bir uygulama, betik, pano, CI işi veya IDE uzantısı oluşturuyorsunuz.
    - App SDK ile Plugin SDK arasında seçim yapıyorsunuz
    - Gateway ajan çalıştırmaları, oturumları, olayları, onayları, modelleri veya araçlarıyla entegrasyon yapıyorsunuz
sidebarTitle: App SDK
summary: Harici uygulamalar, betikler, panolar, CI işleri ve IDE uzantıları için herkese açık OpenClaw Uygulama SDK'sı
title: OpenClaw Uygulama SDK'si
x-i18n:
    generated_at: "2026-04-30T09:17:37Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9c46454d172a25d329a796461982dc4307d3720a28df777eda8605996505e38c
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK**, OpenClaw süreci dışındaki uygulamalar için genel istemci API'sidir. Bir betik, pano, CI işi, IDE eklentisi veya başka bir harici uygulama Gateway'e bağlanmak, agent çalıştırmaları başlatmak, olayları stream etmek, sonuçları beklemek, işi iptal etmek ya da Gateway kaynaklarını incelemek istediğinde `@openclaw/sdk` kullanın.

<Note>
  App SDK, [Plugin SDK](/tr/plugins/sdk-overview) ile aynı değildir.
  `@openclaw/sdk`, OpenClaw dışından Gateway ile konuşur.
  `openclaw/plugin-sdk/*` yalnızca OpenClaw içinde çalışan ve sağlayıcılar,
  kanallar, araçlar, hook'lar veya güvenilir runtime'lar kaydeden plugin'ler içindir.
</Note>

## Bugün Neler Sunuluyor

`@openclaw/sdk` şunlarla birlikte gelir:

| Yüzey                     | Durum   | Ne yapar                                                                     |
| ------------------------- | ------- | ---------------------------------------------------------------------------- |
| `OpenClaw`                | Hazır   | Ana istemci giriş noktası. Taşıma, bağlantı, istekler ve olayları yönetir.   |
| `GatewayClientTransport`  | Hazır   | Gateway istemcisi tarafından desteklenen WebSocket taşıması.                 |
| `oc.agents`               | Hazır   | Agent handle'larını listeler, oluşturur, günceller, siler ve getirir.        |
| `Agent.run()`             | Hazır   | Bir Gateway `agent` çalıştırması başlatır ve bir `Run` döndürür.             |
| `oc.runs`                 | Hazır   | Çalıştırmaları oluşturur, getirir, bekler, iptal eder ve stream eder.        |
| `Run.events()`            | Hazır   | Hızlı çalıştırmalar için yeniden oynatmayla, normalize edilmiş çalıştırma bazlı olayları stream eder. |
| `Run.wait()`              | Hazır   | `agent.wait` çağırır ve kararlı bir `RunResult` döndürür.                    |
| `Run.cancel()`            | Hazır   | Uygun olduğunda session anahtarıyla, çalıştırma kimliğine göre `sessions.abort` çağırır. |
| `oc.sessions`             | Hazır   | Session handle'larını oluşturur, çözümler, gönderir, yamalar, compact eder ve getirir. |
| `Session.send()`          | Hazır   | `sessions.send` çağırır ve bir `Run` döndürür.                               |
| `oc.models`               | Hazır   | `models.list` ve geçerli `models.authStatus` durum RPC'sini çağırır.         |
| `oc.tools`                | Kısmi   | Araç kataloğunu ve etkin araçları listeler; doğrudan araç çağırma bağlanmamıştır. |
| `oc.approvals`            | Hazır   | Gateway onay RPC'leri üzerinden exec onaylarını listeler ve çözümler.        |
| `oc.rawEvents()`          | Hazır   | Gelişmiş tüketiciler için ham Gateway olaylarını açığa çıkarır.              |
| `normalizeGatewayEvent()` | Hazır   | Ham Gateway olaylarını kararlı SDK olay şekline dönüştürür.                  |

SDK ayrıca bu yüzeylerin kullandığı temel türleri dışa aktarır:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`RuntimeSelection`, `EnvironmentSelection`, `WorkspaceSelection`,
`ApprovalMode` ve ilişkili sonuç türleri.

## Bir Gateway'e Bağlanın

Açık bir Gateway URL'siyle istemci oluşturun veya testler ve gömülü uygulama
runtime'ları için özel bir taşıma enjekte edin.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })`, `url` ile eşdeğerdir. `gateway: "auto"` seçeneği constructor tarafından kabul edilir, ancak otomatik Gateway keşfi henüz ayrı bir SDK özelliği değildir; uygulama Gateway'i nasıl keşfedeceğini zaten bilmiyorsa `url` iletin.

Testler için `OpenClawTransport` uygulayan bir nesne iletin:

```typescript
const oc = new OpenClaw({
  transport: {
    async request(method, params) {
      return { method, params };
    },
    async *events() {},
  },
});
```

## Bir Agent Çalıştırın

Uygulama bir agent handle'ı istediğinde `oc.agents.get(id)` kullanın, ardından
`agent.run()` çağırın.

```typescript
const agent = await oc.agents.get("main");

const run = await agent.run({
  input: "Review this pull request and suggest the smallest safe fix.",
  model: "openai/gpt-5.5",
  sessionKey: "main",
  timeoutMs: 30_000,
});

for await (const event of run.events()) {
  const data = event.data as { delta?: unknown };
  if (event.type === "assistant.delta" && typeof data.delta === "string") {
    process.stdout.write(data.delta);
  }
}

const result = await run.wait({ timeoutMs: 120_000 });
console.log(result.status);
```

`openai/gpt-5.5` gibi sağlayıcı nitelemeli model başvuruları Gateway `provider` ve `model` geçersiz kılmalarına ayrılır. `timeoutMs` SDK içinde milisaniye olarak kalır ve `agent` RPC'si için Gateway zaman aşımı saniyelerine dönüştürülür.

`run.wait()`, Gateway `agent.wait` RPC'sini kullanır. Çalıştırma hâlâ aktifken süresi dolan bir bekleme son tarihi, çalıştırmanın kendisi zaman aşımına uğramış gibi davranmak yerine `status: "accepted"` döndürür. Runtime zaman aşımları, durdurulan çalıştırmalar ve iptal edilen çalıştırmalar `timed_out` veya `cancelled` olarak normalize edilir.

## Session'lar Oluşturun ve Yeniden Kullanın

Uygulama kalıcı transcript durumu istediğinde session'ları kullanın.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()`, `sessions.send` çağırır ve bir `Run` döndürür. Session handle'ları ayrıca şunları destekler:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Olayları Stream Edin

SDK, ham Gateway olaylarını kararlı bir `OpenClawEvent` zarfına normalize eder:

```typescript
type OpenClawEvent = {
  version: 1;
  id: string;
  ts: number;
  type: OpenClawEventType;
  runId?: string;
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  agentId?: string;
  data: unknown;
  raw?: GatewayEvent;
};
```

Yaygın olay türleri şunları içerir:

| Olay türü             | Kaynak Gateway olayı                         |
| --------------------- | -------------------------------------------- |
| `run.started`         | `agent` yaşam döngüsü başlangıcı             |
| `run.completed`       | `agent` yaşam döngüsü sonu                   |
| `run.failed`          | `agent` yaşam döngüsü hatası                 |
| `run.cancelled`       | Durdurulmuş/iptal edilmiş yaşam döngüsü sonu |
| `run.timed_out`       | Zaman aşımı yaşam döngüsü sonu               |
| `assistant.delta`     | Assistant streaming delta                    |
| `assistant.message`   | Assistant mesajı                             |
| `thinking.delta`      | Düşünme veya plan stream'i                   |
| `tool.call.started`   | Araç/öğe/komut başlangıcı                    |
| `tool.call.delta`     | Araç/öğe/komut güncellemesi                  |
| `tool.call.completed` | Araç/öğe/komut tamamlanması                  |
| `tool.call.failed`    | Araç/öğe/komut hatası veya engellenmiş durum |
| `approval.requested`  | Exec veya plugin onay isteği                 |
| `approval.resolved`   | Exec veya plugin onay çözümü                 |
| `session.created`     | `sessions.changed` oluşturma                 |
| `session.updated`     | `sessions.changed` güncelleme                |
| `session.compacted`   | `sessions.changed` compaction                |
| `task.updated`        | Görev güncelleme olayları                    |
| `artifact.updated`    | Yama stream olayları                         |
| `raw`                 | Henüz kararlı SDK eşlemesi olmayan herhangi bir olay |

`Run.events()`, olayları tek bir çalıştırma kimliğine filtreler ve hızlı çalıştırmalar için önceden görülmüş olayları yeniden oynatır. Bu, belgelenen akışın güvenli olduğu anlamına gelir:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Uygulama genelindeki stream'ler için `oc.events()` kullanın. Ham Gateway frame'leri için `oc.rawEvents()` kullanın.

## Modeller, Araçlar ve Onaylar

Model yardımcıları geçerli Gateway yöntemleriyle eşleşir:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Araç yardımcıları Gateway kataloğunu ve etkin araç görünümünü açığa çıkarır:

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
```

Onay yardımcıları exec onay RPC'lerini kullanır:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Bugün Açıkça Desteklenmeyenler

SDK, istediğimiz ürün modeli için adlar içerir, ancak Gateway RPC'leri varmış gibi sessizce davranmaz. Bu çağrılar şu anda açık desteklenmiyor hataları fırlatır:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.tools.invoke("tool-name", {});

await oc.artifacts.list();
await oc.artifacts.get("artifact-id");
await oc.artifacts.download("artifact-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Çalıştırma bazlı `workspace`, `runtime`, `environment` ve `approvals` alanları gelecek şekil olarak tiplendirilmiştir, ancak mevcut Gateway bu geçersiz kılmaları `agent` RPC'sinde desteklemez. Çağıranlar bunları iletirse SDK, işin yanlışlıkla varsayılan workspace, runtime, environment veya onay davranışıyla yürütülmemesi için çalıştırmayı göndermeden önce hata fırlatır.

## App SDK ve Plugin SDK Karşılaştırması

Kod OpenClaw dışında bulunduğunda App SDK kullanın:

- Agent çalıştırmaları başlatan veya gözlemleyen Node betikleri
- Bir Gateway'i çağıran CI işleri
- panolar ve yönetici panelleri
- IDE eklentileri
- kanal plugin'lerine dönüşmesi gerekmeyen harici köprüler
- sahte veya gerçek Gateway taşımalarıyla entegrasyon testleri

Kod OpenClaw içinde çalıştığında Plugin SDK kullanın:

- sağlayıcı plugin'leri
- kanal plugin'leri
- araç veya yaşam döngüsü hook'ları
- agent harness plugin'leri
- güvenilir runtime yardımcıları

App SDK kodu `@openclaw/sdk` içinden import etmelidir. Plugin kodu belgelenmiş `openclaw/plugin-sdk/*` alt yollarından import etmelidir. İki sözleşmeyi karıştırmayın.

## İlgili Belgeler

- [OpenClaw App SDK API tasarımı](/tr/reference/openclaw-sdk-api-design)
- [Gateway RPC referansı](/tr/reference/rpc)
- [Agent loop](/tr/concepts/agent-loop)
- [Agent runtime'ları](/tr/concepts/agent-runtimes)
- [Session'lar](/tr/concepts/session)
- [Arka plan görevleri](/tr/automation/tasks)
- [ACP agent'ları](/tr/tools/acp-agents)
- [Plugin SDK genel bakış](/tr/plugins/sdk-overview)
