---
read_when:
    - OpenClaw ile iletişim kuran harici bir uygulama, betik, pano, CI işi veya IDE uzantısı oluşturuyorsunuz
    - App SDK ile Plugin SDK arasında seçim yapıyorsunuz
    - Gateway ajan çalıştırmaları, oturumları, etkinlikleri, onayları, modelleri veya araçlarıyla entegrasyon yapıyorsunuz
sidebarTitle: App SDK
summary: Harici uygulamalar, betikler, panolar, CI görevleri ve IDE uzantıları için herkese açık OpenClaw Uygulama SDK'sı
title: OpenClaw Uygulama SDK'sı
x-i18n:
    generated_at: "2026-05-06T09:08:59Z"
    model: gpt-5.5
    provider: openai
    source_hash: 23d161958e8b100bfc829319ef6bfd2ea2bf7c873ef29a0d4a849b064e5a3b66
    source_path: concepts/openclaw-sdk.md
    workflow: 16
---

**OpenClaw App SDK**, OpenClaw sürecinin dışındaki uygulamalar için genel istemci API’sidir. Bir betik, pano, CI işi, IDE eklentisi veya başka bir dış uygulama Gateway’e bağlanmak, agent çalıştırmaları başlatmak, olayları akışla almak, sonuçları beklemek, işi iptal etmek ya da Gateway kaynaklarını incelemek istediğinde `@openclaw/sdk` kullanın.

<Note>
  App SDK, [Plugin SDK](/tr/plugins/sdk-overview)’den farklıdır.
  `@openclaw/sdk`, OpenClaw dışından Gateway ile konuşur.
  `openclaw/plugin-sdk/*` yalnızca OpenClaw içinde çalışan ve sağlayıcılar, kanallar, araçlar, hook’lar veya güvenilir çalışma zamanları kaydeden plugin’ler içindir.
</Note>

## Bugün sunulanlar

`@openclaw/sdk` şunlarla birlikte sunulur:

| Yüzey                     | Durum  | Ne yapar                                                                                 |
| ------------------------- | ------ | ---------------------------------------------------------------------------------------- |
| `OpenClaw`                | Hazır  | Ana istemci giriş noktası. Aktarımı, bağlantıyı, istekleri ve olayları yönetir.           |
| `GatewayClientTransport`  | Hazır  | Gateway istemcisi tarafından desteklenen WebSocket aktarımı.                             |
| `oc.agents`               | Hazır  | Agent tanıtıcılarını listeler, oluşturur, günceller, siler ve alır.                       |
| `Agent.run()`             | Hazır  | Bir Gateway `agent` çalıştırması başlatır ve bir `Run` döndürür.                         |
| `oc.runs`                 | Hazır  | Çalıştırmaları oluşturur, alır, bekler, iptal eder ve akışla iletir.                     |
| `Run.events()`            | Hazır  | Hızlı çalıştırmalar için yeniden oynatma ile çalıştırma başına normalize olayları akıtır. |
| `Run.wait()`              | Hazır  | `agent.wait` çağırır ve kararlı bir `RunResult` döndürür.                                |
| `Run.cancel()`            | Hazır  | Kullanılabiliyorsa oturum anahtarıyla birlikte çalıştırma kimliğine göre `sessions.abort` çağırır. |
| `oc.sessions`             | Hazır  | Oturum tanıtıcılarını oluşturur, çözer, gönderir, yamalar, compaction uygular ve alır.    |
| `Session.send()`          | Hazır  | `sessions.send` çağırır ve bir `Run` döndürür.                                           |
| `oc.models`               | Hazır  | `models.list` ve geçerli `models.authStatus` durum RPC’sini çağırır.                     |
| `oc.tools`                | Hazır  | Gateway araçlarını ilke hattı üzerinden listeler, kapsamlandırır ve çağırır.             |
| `oc.artifacts`            | Hazır  | Gateway transcript artifact’lerini listeler, alır ve indirir.                            |
| `oc.approvals`            | Hazır  | Gateway onay RPC’leri üzerinden exec onaylarını listeler ve çözer.                       |
| `oc.environments`         | Kısmi  | Gateway-yerel ve node ortam adaylarını listeler; oluşturma/silme bağlı değildir.          |
| `oc.rawEvents()`          | Hazır  | Gelişmiş tüketiciler için ham Gateway olaylarını açığa çıkarır.                          |
| `normalizeGatewayEvent()` | Hazır  | Ham Gateway olaylarını kararlı SDK olay şekline dönüştürür.                              |

SDK ayrıca bu yüzeyler tarafından kullanılan temel türleri dışa aktarır:
`AgentRunParams`, `RunResult`, `RunStatus`, `OpenClawEvent`,
`OpenClawEventType`, `GatewayEvent`, `OpenClawTransport`,
`GatewayRequestOptions`, `SessionCreateParams`, `SessionSendParams`,
`ArtifactSummary`, `ArtifactQuery`, `ArtifactsListResult`,
`ArtifactsGetResult`, `ArtifactsDownloadResult`, `RuntimeSelection`,
`EnvironmentSelection`, `WorkspaceSelection`, `ApprovalMode` ve ilgili
sonuç türleri.

## Bir Gateway’e bağlanma

Açık bir Gateway URL’siyle bir istemci oluşturun veya testler ve gömülü
uygulama çalışma zamanları için özel bir aktarım enjekte edin.

```typescript
import { OpenClaw } from "@openclaw/sdk";

const oc = new OpenClaw({
  url: "ws://127.0.0.1:18789",
  token: process.env.OPENCLAW_GATEWAY_TOKEN,
  requestTimeoutMs: 30_000,
});

await oc.connect();
```

`new OpenClaw({ gateway: "ws://..." })`, `url` ile eşdeğerdir.
`gateway: "auto"` seçeneği kurucu tarafından kabul edilir, ancak otomatik Gateway
keşfi henüz ayrı bir SDK özelliği değildir; uygulama Gateway’i nasıl keşfedeceğini
zaten bilmiyorsa `url` iletin.

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

## Bir agent çalıştırma

Uygulama bir agent tanıtıcısı istediğinde `oc.agents.get(id)` kullanın, ardından
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

`openai/gpt-5.5` gibi sağlayıcı nitelikli model başvuruları Gateway `provider`
ve `model` geçersiz kılmalarına ayrılır. `timeoutMs` SDK içinde milisaniye
olarak kalır ve `agent` RPC’si için Gateway zaman aşımı saniyelerine dönüştürülür.

`run.wait()`, Gateway `agent.wait` RPC’sini kullanır. Çalıştırma hâlâ etkinken
süresi dolan bir bekleme son tarihi, çalıştırmanın kendisi zaman aşımına uğramış
gibi davranmak yerine `status: "accepted"` döndürür. Çalışma zamanı zaman
aşımları, durdurulan çalıştırmalar ve iptal edilen çalıştırmalar `timed_out`
veya `cancelled` olarak normalize edilir.

## Oturum oluşturma ve yeniden kullanma

Uygulama kalıcı transcript durumu istediğinde oturumları kullanın.

```typescript
const session = await oc.sessions.create({
  agentId: "main",
  label: "release-review",
});

const run = await session.send("Prepare release notes from the current diff.");
await run.wait();
```

`Session.send()`, `sessions.send` çağırır ve bir `Run` döndürür. Oturum
tanıtıcıları ayrıca şunları destekler:

```typescript
await session.abort(run.id);
await session.patch({ label: "renamed-session" });
await session.compact({ maxLines: 200 });
```

## Olayları akışla alma

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

Yaygın olay türleri şunlardır:

| Olay türü             | Kaynak Gateway olayı                         |
| --------------------- | -------------------------------------------- |
| `run.started`         | `agent` yaşam döngüsü başlangıcı             |
| `run.completed`       | `agent` yaşam döngüsü sonu                   |
| `run.failed`          | `agent` yaşam döngüsü hatası                 |
| `run.cancelled`       | Durdurulan/iptal edilen yaşam döngüsü sonu   |
| `run.timed_out`       | Zaman aşımı yaşam döngüsü sonu               |
| `assistant.delta`     | Assistant akış deltası                       |
| `assistant.message`   | Assistant iletisi                            |
| `thinking.delta`      | Düşünme veya plan akışı                      |
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
| `artifact.updated`    | Yama akışı olayları                          |
| `raw`                 | Henüz kararlı SDK eşlemesi olmayan herhangi bir olay |

`Run.events()`, olayları tek bir çalıştırma kimliğine filtreler ve hızlı
çalıştırmalar için daha önce görülmüş olayları yeniden oynatır. Bu, belgelenen
akışın güvenli olduğu anlamına gelir:

```typescript
const run = await agent.run("Summarize the latest session.");

for await (const event of run.events()) {
  if (event.type === "run.completed") {
    break;
  }
}
```

Uygulama genelindeki akışlar için `oc.events()` kullanın. Ham Gateway frame’leri
için `oc.rawEvents()` kullanın.

## Modeller, araçlar, artifact’ler ve onaylar

Model yardımcıları geçerli Gateway yöntemlerine eşlenir:

```typescript
await oc.models.list();
await oc.models.status({ probe: false }); // calls models.authStatus
```

Araç yardımcıları Gateway kataloğunu, etkili araç görünümünü ve doğrudan Gateway
araç çağrısını açığa çıkarır. `oc.tools.invoke()`, ilke veya onay reddetmeleri
için hata fırlatmak yerine türlendirilmiş bir zarf döndürür.

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

Artifact yardımcıları, oturum, çalıştırma veya görev bağlamı için Gateway
artifact projeksiyonunu açığa çıkarır. Her çağrı açıkça bir `sessionKey`,
`runId` veya `taskId` kapsamı gerektirir:

```typescript
const { artifacts } = await oc.artifacts.list({ sessionKey: "main" });
const first = artifacts[0];

if (first) {
  const { artifact } = await oc.artifacts.get(first.id, { sessionKey: "main" });
  const download = await oc.artifacts.download(artifact.id, { sessionKey: "main" });
  console.log(download.encoding, download.url);
}
```

Onay yardımcıları exec onay RPC’lerini kullanır:

```typescript
const approvals = await oc.approvals.list();
await oc.approvals.respond("approval-id", { decision: "approve" });
```

Ortam yardımcıları salt okunur Gateway-yerel ve node keşfini açığa çıkarır:

```typescript
const { environments } = await oc.environments.list();
await oc.environments.status(environments[0].id);
```

## Bugün açıkça desteklenmeyenler

SDK, istediğimiz ürün modeli için adlar içerir, ancak Gateway RPC’leri varmış
gibi sessizce davranmaz. Bu çağrılar şu anda açık desteklenmeyen hata verir:

```typescript
await oc.tasks.list();
await oc.tasks.get("task-id");
await oc.tasks.cancel("task-id");

await oc.environments.create({});
await oc.environments.delete("environment-id");
```

Çalıştırma başına `workspace`, `runtime`, `environment` ve `approvals` alanları
gelecekteki şekil olarak türlendirilmiştir, ancak mevcut Gateway bu geçersiz
kılmaları `agent` RPC’sinde desteklemez. Çağıranlar bunları iletirse, SDK
çalıştırmayı göndermeden önce hata fırlatır; böylece iş yanlışlıkla varsayılan
çalışma alanı, çalışma zamanı, ortam veya onay davranışıyla yürütülmez.

## App SDK ve Plugin SDK

Kod OpenClaw dışında yaşadığında App SDK kullanın:

- Agent çalıştırmaları başlatan veya gözlemleyen Node betikleri
- Gateway çağıran CI işleri
- panolar ve yönetim panelleri
- IDE eklentileri
- kanal plugin’i olması gerekmeyen dış köprüler
- sahte veya gerçek Gateway aktarımlarıyla entegrasyon testleri

Kod OpenClaw içinde çalıştığında Plugin SDK kullanın:

- sağlayıcı plugin’leri
- kanal plugin’leri
- araç veya yaşam döngüsü hook’ları
- agent harness plugin’leri
- güvenilir çalışma zamanı yardımcıları

App SDK kodu `@openclaw/sdk` içinden içe aktarmalıdır. Plugin kodu belgelenmiş
`openclaw/plugin-sdk/*` alt yollarından içe aktarmalıdır. İki sözleşmeyi
karıştırmayın.

## İlgili

- [OpenClaw App SDK API tasarımı](/tr/reference/openclaw-sdk-api-design)
- [Gateway RPC referansı](/tr/reference/rpc)
- [Agent döngüsü](/tr/concepts/agent-loop)
- [Agent çalışma zamanları](/tr/concepts/agent-runtimes)
- [Oturumlar](/tr/concepts/session)
- [Arka plan görevleri](/tr/automation/tasks)
- [ACP agent’ları](/tr/tools/acp-agents)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
