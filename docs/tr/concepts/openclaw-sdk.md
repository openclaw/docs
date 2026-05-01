---
read_when:
    - OpenClaw ile iletişim kuran harici bir uygulama, betik, pano, CI işi veya IDE uzantısı geliştiriyorsunuz
    - App SDK ile Plugin SDK arasında seçim yapıyorsunuz
    - Gateway ajan çalıştırmaları, oturumları, olayları, onayları, modelleri veya araçlarıyla entegrasyon yapıyorsunuz
sidebarTitle: App SDK
summary: Harici uygulamalar, betikler, panolar, CI işleri ve IDE uzantıları için herkese açık OpenClaw App SDK
title: OpenClaw Uygulama SDK'sı
x-i18n:
    generated_at: "2026-05-01T09:00:20Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6b22e9f4f809a572cfd19fd22f633a706dd23b8bee2f3c244003a0861a41073
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK**, OpenClaw sürecinin dışındaki uygulamalar için genel istemci API'sidir. Bir betik, pano, CI işi, IDE eklentisi veya başka bir harici uygulama Gateway'e bağlanmak, agent çalıştırmaları başlatmak, olayları akıtmak, sonuçları beklemek, işi iptal etmek ya da Gateway kaynaklarını incelemek istediğinde `@openclaw/sdk` kullanın.

<Note>
  App SDK, [Plugin SDK](/tr/plugins/sdk-overview)'den farklıdır.
  `@openclaw/sdk`, Gateway ile OpenClaw dışından konuşur.
  `openclaw/plugin-sdk/*` yalnızca OpenClaw içinde çalışan ve sağlayıcıları,
  kanalları, araçları, hook'ları veya güvenilir çalışma zamanlarını kaydeden plugin'ler içindir.
</Note>

## Bugün Neler Sunuluyor

`@openclaw/sdk` şunlarla birlikte gelir:

| Yüzey                     | Durum  | Ne yapar                                                                   |
| ------------------------- | ------ | -------------------------------------------------------------------------- |
| `OpenClaw`                | Hazır  | Ana istemci giriş noktası. Taşıma, bağlantı, istekler ve olayları yönetir. |
| `GatewayClientTransport`  | Hazır  | Gateway istemcisi tarafından desteklenen WebSocket taşıması.               |
| `oc.agents`               | Hazır  | Agent handle'larını listeler, oluşturur, günceller, siler ve getirir.      |
| `Agent.run()`             | Hazır  | Bir Gateway `agent` çalıştırması başlatır ve bir `Run` döndürür.           |
| `oc.runs`                 | Hazır  | Çalıştırmaları oluşturur, getirir, bekler, iptal eder ve akıtır.           |
| `Run.events()`            | Hazır  | Hızlı çalıştırmalar için yeniden oynatmayla normalleştirilmiş çalıştırma başına olayları akıtır. |
| `Run.wait()`              | Hazır  | `agent.wait` çağırır ve kararlı bir `RunResult` döndürür.                  |
| `Run.cancel()`            | Hazır  | Kullanılabilir olduğunda oturum anahtarıyla, çalıştırma kimliğine göre `sessions.abort` çağırır. |
| `oc.sessions`             | Hazır  | Oturum handle'larını oluşturur, çözer, gönderir, yamalar, sıkıştırır ve getirir. |
| `Session.send()`          | Hazır  | `sessions.send` çağırır ve bir `Run` döndürür.                             |
| `oc.models`               | Hazır  | `models.list` ve geçerli `models.authStatus` durum RPC'sini çağırır.       |
| `oc.tools`                | Hazır  | Gateway araçlarını ilke hattı üzerinden listeler, kapsamlandırır ve çağırır. |
| `oc.artifacts`            | Hazır  | Gateway transkript artifact'lerini listeler, getirir ve indirir.           |
| `oc.approvals`            | Hazır  | Gateway onay RPC'leri üzerinden exec onaylarını listeler ve çözer.         |
| `oc.rawEvents()`          | Hazır  | Gelişmiş tüketiciler için ham Gateway olaylarını sunar.                    |
| `normalizeGatewayEvent()` | Hazır  | Ham Gateway olaylarını kararlı SDK olay biçimine dönüştürür.               |

SDK ayrıca bu yüzeylerin kullandığı temel türleri de dışa aktarır:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` ve ilişkili
sonuç türleri.

## Bir Gateway'e Bağlanma

Açık bir Gateway URL'siyle bir istemci oluşturun ya da testler ve gömülü uygulama
çalışma zamanları için özel bir taşıma enjekte edin.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:14565",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })`, `url` ile eşdeğerdir. `gateway: "auto"`
seçeneği constructor tarafından kabul edilir, ancak otomatik Gateway keşfi henüz
ayrı bir SDK özelliği değildir; uygulama Gateway'i nasıl keşfedeceğini zaten
bilmiyorsa `url` iletin.

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

## Bir Agent Çalıştırma

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

`openai/gpt-5.5` gibi sağlayıcı nitelemeli model referansları Gateway `provider`
ve `model` geçersiz kılmalarına ayrılır. `timeoutMs`, SDK içinde milisaniye olarak
kalır ve `agent` RPC'si için Gateway zaman aşımı saniyelerine dönüştürülür.

`run.wait()`, Gateway `agent.wait` RPC'sini kullanır. Çalıştırma hâlâ etkinken
süresi dolan bir bekleme son tarihi, çalıştırmanın kendisinin zaman aşımına
uğradığını varsaymak yerine `status: "accepted"` döndürür. Çalışma zamanı zaman
aşımları, durdurulan çalıştırmalar ve iptal edilen çalıştırmalar `timed_out` veya
`cancelled` olarak normalleştirilir.

## Oturum Oluşturma ve Yeniden Kullanma

Uygulama kalıcı transkript durumu istediğinde oturumları kullanın.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()`, `sessions.send` çağırır ve bir `Run` döndürür. Oturum handle'ları
şunları da destekler:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Olayları Akıtma

SDK, ham Gateway olaylarını kararlı bir `OpenClawEvent` zarfına normalleştirir:

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

Yaygın olay türleri şunlardır:

| Olay türü             | Kaynak Gateway olayı                       |
| --------------------- | ------------------------------------------ |
| `run.started`         | `agent` yaşam döngüsü başlangıcı           |
| `run.completed`       | `agent` yaşam döngüsü sonu                 |
| `run.failed`          | `agent` yaşam döngüsü hatası               |
| `run.cancelled`       | Durdurulan/iptal edilen yaşam döngüsü sonu |
| `run.timed_out`       | Zaman aşımı yaşam döngüsü sonu             |
| `assistant.delta`     | Assistant akış deltası                     |
| `assistant.message`   | Assistant mesajı                           |
| `thinking.delta`      | Düşünme veya plan akışı                    |
| `tool.call.started`   | Araç/öğe/komut başlangıcı                  |
| `tool.call.delta`     | Araç/öğe/komut güncellemesi                |
| `tool.call.completed` | Araç/öğe/komut tamamlanması                |
| `tool.call.failed`    | Araç/öğe/komut hatası veya engellenmiş durum |
| `approval.requested`  | Exec veya plugin onay isteği               |
| `approval.resolved`   | Exec veya plugin onay çözümü               |
| `session.created`     | `sessions.changed` oluşturma               |
| `session.updated`     | `sessions.changed` güncelleme              |
| `session.compacted`   | `sessions.changed` sıkıştırma              |
| `task.updated`        | Görev güncelleme olayları                  |
| `artifact.updated`    | Yama akışı olayları                        |
| `raw`                 | Henüz kararlı SDK eşlemesi olmayan herhangi bir olay |

`Run.events()`, olayları tek bir çalıştırma kimliğine göre filtreler ve hızlı
çalıştırmalar için önceden görülmüş olayları yeniden oynatır. Bu, belgelenen
akışın güvenli olduğu anlamına gelir:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Uygulama genelindeki akışlar için `oc.events()` kullanın. Ham Gateway frame'leri
için `oc.rawEvents()` kullanın.

## Modeller, Araçlar, Artifact'ler ve Onaylar

Model yardımcıları geçerli Gateway yöntemlerine eşlenir:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Araç yardımcıları Gateway kataloğunu, etkili araç görünümünü ve doğrudan Gateway
araç çağrısını sunar. `oc.tools.invoke()`, ilke veya onay retlerinde hata fırlatmak
yerine türlendirilmiş bir zarf döndürür.

```typescript
await oc.tools.list();
await oc.tools.effective({ sessionKey: "main" });
await oc.tools.invoke("tool-name", {
  args: { input: "value" },
  sessionKey: "main",
  confirm: false,
  idempotencyKey: "tool-call-1",
});
```

Artifact yardımcıları, oturum, çalıştırma veya görev bağlamı için Gateway artifact
projeksiyonunu sunar. Her çağrı açık bir `sessionKey`, `runId` veya `taskId`
kapsamı gerektirir:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Onay yardımcıları exec onay RPC'lerini kullanır:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

## Bugün Açıkça Desteklenmeyenler

SDK, hedeflediğimiz ürün modeli için adlar içerir, ancak Gateway RPC'leri varmış
gibi sessizce davranmaz. Bu çağrılar şu anda açık desteklenmiyor hataları fırlatır:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.list();
await oc.environments.create({});
await oc.environments.status("environment-id");
await oc.environments.delete("environment-id");
```

Çalıştırma başına `workspace`, `runtime`, `environment` ve `approvals` alanları
gelecekteki biçim olarak türlendirilmiştir, ancak geçerli Gateway bu geçersiz
kılmaları `agent` RPC'sinde desteklemez. Çağıranlar bunları iletirse SDK,
çalıştırmayı göndermeden önce hata fırlatır; böylece işler yanlışlıkla varsayılan
workspace, runtime, environment veya approval davranışıyla yürütülmez.

## App SDK ve Plugin SDK Karşılaştırması

Kod OpenClaw dışında yaşadığında App SDK kullanın:

- Agent çalıştırmaları başlatan veya gözlemleyen Node betikleri
- Bir Gateway çağıran CI işleri
- panolar ve yönetim panelleri
- IDE eklentileri
- kanal plugin'i olması gerekmeyen harici köprüler
- sahte veya gerçek Gateway taşımalarıyla entegrasyon testleri

Kod OpenClaw içinde çalıştığında Plugin SDK kullanın:

- sağlayıcı plugin'leri
- kanal plugin'leri
- araç veya yaşam döngüsü hook'ları
- agent harness plugin'leri
- güvenilir çalışma zamanı yardımcıları

App SDK kodu `@openclaw/sdk` içinden içe aktarmalıdır. Plugin kodu belgelenmiş
`openclaw/plugin-sdk/*` alt yollarından içe aktarmalıdır. İki sözleşmeyi
karıştırmayın.

## İlgili Belgeler

- [OpenClaw App SDK API tasarımı](/tr/reference/openclaw-sdk-api-design)
- [Gateway RPC referansı](/tr/reference/rpc)
- [Agent döngüsü](/tr/concepts/agent-loop)
- [Agent çalışma zamanları](/tr/concepts/agent-runtimes)
- [Oturumlar](/tr/concepts/session)
- [Arka plan görevleri](/tr/automation/tasks)
- [ACP agent'ları](/tr/tools/acp-agents)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
