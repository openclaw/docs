---
read_when:
    - Önerilen herkese açık OpenClaw uygulama SDK'sını uyguluyorsunuz
    - Uygulama SDK'sı için taslak ad alanı, olay, sonuç, yapıt, onay veya güvenlik sözleşmesine ihtiyacınız var
    - Gateway protokol kaynaklarını yüksek düzey OpenClaw App SDK sarmalayıcısıyla karşılaştırıyorsunuz
sidebarTitle: App SDK API design
summary: Herkese açık OpenClaw App SDK API'si, olay taksonomisi, yapıtlar, onaylar ve paket yapısı için referans tasarım
title: OpenClaw Uygulama SDK API tasarımı
x-i18n:
    generated_at: "2026-05-10T19:53:58Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7eab11a5dfb85465e7d6da971fba779baaef06fd333eb53a39b53d7150e85b72
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Bu sayfa, herkese açık
[OpenClaw App SDK](/tr/concepts/openclaw-sdk) için ayrıntılı API referansı tasarımıdır. Bilinçli olarak
[Plugin SDK](/tr/plugins/sdk-overview) bölümünden ayrı tutulmuştur.

<Note>
  `@openclaw/sdk`, Gateway ile konuşmak için kullanılan harici app/client paketidir.
  `openclaw/plugin-sdk/*`, süreç içi Plugin yazarlığı sözleşmesidir.
  Yalnızca agent çalıştırması gereken uygulamalardan Plugin SDK alt yollarını içe aktarmayın.
</Note>

Herkese açık app SDK iki katmanda oluşturulmalıdır:

1. Düşük seviyeli, üretilmiş bir Gateway istemcisi.
2. `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` ve `Environment` nesnelerine sahip, yüksek seviyeli ergonomik bir sarmalayıcı.

## Ad alanı tasarımı

Düşük seviyeli ad alanları Gateway kaynaklarını yakından izlemelidir:

```typescript
oc.agents.list();
oc.agents.get("main");
oc.agents.create(...);
oc.agents.update(...);

oc.sessions.list();
oc.sessions.create(...);
oc.sessions.resolve(...);
oc.sessions.send(...);
oc.sessions.messages(...);
oc.sessions.fork(...);
oc.sessions.compact(...);
oc.sessions.abort(...);

oc.runs.create(...);
oc.runs.get(runId);
oc.runs.events(runId, { after });
oc.runs.wait(runId);
oc.runs.cancel(runId);

oc.tasks.list({ status: "running" });
oc.tasks.get(taskId);
oc.tasks.cancel(taskId, { reason });
oc.tasks.events(taskId, { after }); // future API

oc.models.list();
oc.models.status(); // Gateway models.authStatus

oc.tools.list();
oc.tools.invoke("tool-name", { sessionKey, idempotencyKey });

oc.artifacts.list({ runId });
oc.artifacts.get(artifactId, { runId });
oc.artifacts.download(artifactId, { runId });

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list();
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId);
oc.environments.delete(environmentId); // future API: current SDK throws unsupported
```

Yüksek seviyeli sarmalayıcılar, yaygın akışları kullanışlı hale getiren nesneler döndürmelidir:

```typescript
const run = await agent.run(inputOrParams);
await run.cancel();
await run.wait();

for await (const event of run.events()) {
  // normalized event stream
}

const artifacts = await run.artifacts.list();
const session = await run.session();
```

## Olay sözleşmesi

Herkese açık SDK, sürümlü, yeniden oynatılabilir ve normalize edilmiş olaylar sunmalıdır.

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
  raw?: unknown;
};
```

`id` bir yeniden oynatma imlecidir. Tüketiciler
`events({ after: id })` ile yeniden bağlanabilmeli ve saklama izin verdiğinde kaçırılan olayları alabilmelidir.

Önerilen normalize edilmiş olay aileleri:

| Olay                  | Anlam                                                       |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Run kabul edildi.                                           |
| `run.queued`          | Run bir oturum hattı, runtime veya ortam bekliyor.          |
| `run.started`         | Runtime yürütmeyi başlattı.                                 |
| `run.completed`       | Run başarıyla tamamlandı.                                   |
| `run.failed`          | Run bir hatayla sona erdi.                                  |
| `run.cancelled`       | Run iptal edildi.                                           |
| `run.timed_out`       | Run zaman aşımını aştı.                                     |
| `assistant.delta`     | Assistant metin deltası.                                    |
| `assistant.message`   | Tam assistant mesajı veya değişimi.                         |
| `thinking.delta`      | Politika gösterime izin verdiğinde akıl yürütme veya plan deltası. |
| `tool.call.started`   | Tool çağrısı başladı.                                       |
| `tool.call.delta`     | Tool çağrısı ilerleme veya kısmi çıktı akışı sağladı.       |
| `tool.call.completed` | Tool çağrısı başarıyla döndü.                               |
| `tool.call.failed`    | Tool çağrısı başarısız oldu.                                |
| `approval.requested`  | Bir run veya tool onay gerektiriyor.                        |
| `approval.resolved`   | Onay verildi, reddedildi, süresi doldu veya iptal edildi.   |
| `question.requested`  | Runtime kullanıcıdan veya host uygulamadan girdi istiyor.   |
| `question.answered`   | Host uygulama bir yanıt sağladı.                            |
| `artifact.created`    | Yeni artifact kullanılabilir.                               |
| `artifact.updated`    | Mevcut artifact değişti.                                    |
| `session.created`     | Oturum oluşturuldu.                                         |
| `session.updated`     | Oturum metadata'sı değişti.                                 |
| `session.compacted`   | Oturum Compaction gerçekleşti.                              |
| `task.updated`        | Arka plan task durumu değişti.                              |
| `git.branch`          | Runtime branch durumunu gözlemledi veya değiştirdi.         |
| `git.diff`            | Runtime bir diff üretti veya değiştirdi.                    |
| `git.pr`              | Runtime bir pull request açtı, güncelledi veya bağladı.     |

Runtime'a özgü yükler `raw` üzerinden kullanılabilir olmalıdır, ancak uygulamaların normal UI için
`raw` ayrıştırması gerekmemelidir.

## Sonuç sözleşmesi

`Run.wait()` kararlı bir sonuç zarfı döndürmelidir:

```typescript
type RunResult = {
  runId: string;
  status: "accepted" | "completed" | "failed" | "cancelled" | "timed_out";
  sessionId?: string;
  sessionKey?: string;
  taskId?: string;
  startedAt?: string | number;
  endedAt?: string | number;
  output?: {
    text?: string;
    messages?: SDKMessage[];
  };
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    costUsd?: number;
  };
  artifacts?: ArtifactSummary[];
  error?: SDKError;
};
```

Sonuç sade ve kararlı olmalıdır. Zaman damgası değerleri Gateway
şeklini korur; bu nedenle mevcut lifecycle destekli run'lar genellikle epoch milisaniye
sayıları bildirirken adapter'lar hâlâ ISO dizgileri gösterebilir. Zengin UI, tool izleri ve
runtime'a özgü ayrıntılar olaylara ve artifact'lara aittir.

`accepted` terminal olmayan bir bekleme sonucudur: Gateway bekleme son tarihinin,
run bir lifecycle bitişi/hatası üretmeden önce dolduğu anlamına gelir. `timed_out` olarak
ele alınmamalıdır; `timed_out`, kendi runtime zaman aşımını aşan bir run için ayrılmıştır.

## Onaylar ve sorular

Kodlama agent'ları sürekli güvenlik sınırlarını geçtiği için onaylar birinci sınıf olmalıdır.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Onay olayları şunları taşımalıdır:

- onay id'si
- run id'si ve oturum id'si
- istek türü
- istenen eylem özeti
- tool adı veya ortam eylemi
- risk seviyesi
- kullanılabilir kararlar
- süre sonu
- kararın yeniden kullanılıp kullanılamayacağı

Sorular onaylardan ayrıdır. Bir soru, kullanıcıdan veya host uygulamadan bilgi ister. Bir onay, bir eylemi gerçekleştirmek için izin ister.

## ToolSpace modeli

Uygulamaların, Plugin iç bileşenlerini içe aktarmadan tool yüzeyini anlaması gerekir.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK şunları sunmalıdır:

- normalize edilmiş tool metadata'sı
- kaynak: OpenClaw, MCP, Plugin, channel, runtime veya app
- şema özeti
- onay politikası
- runtime uyumluluğu
- bir tool'un gizli, readonly, yazma yetenekli veya host yetenekli olup olmadığı

SDK üzerinden tool çağırma açık ve kapsamlı olmalıdır. Çoğu uygulama agent çalıştırmalı, rastgele tool'ları doğrudan çağırmamalıdır.

## Artifact modeli

Artifact'lar dosyalardan daha fazlasını kapsamalıdır.

```typescript
type ArtifactSummary = {
  id: string;
  runId?: string;
  sessionId?: string;
  type:
    | "file"
    | "patch"
    | "diff"
    | "log"
    | "media"
    | "screenshot"
    | "trajectory"
    | "pull_request"
    | "workspace";
  title?: string;
  mimeType?: string;
  sizeBytes?: number;
  createdAt: string;
  expiresAt?: string;
};
```

Yaygın örnekler:

- dosya düzenlemeleri ve üretilen dosyalar
- patch paketleri
- VCS diff'leri
- ekran görüntüleri ve medya çıktıları
- log'lar ve iz paketleri
- pull request bağlantıları
- runtime yörüngeleri
- yönetilen ortam workspace snapshot'ları

Artifact erişimi, her artifact'ın normal bir yerel dosya olduğunu varsaymadan redaction, saklama ve indirme URL'lerini desteklemelidir.

## Güvenlik modeli

App SDK yetki konusunda açık olmalıdır.

Önerilen token kapsamları:

| Kapsam              | İzin verir                                           |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Agent'ları listeleme ve inceleme.                   |
| `agent.run`         | Run başlatma.                                       |
| `session.read`      | Oturum metadata'sını ve mesajları okuma.            |
| `session.write`     | Oturum oluşturma, oturuma gönderme, fork etme, compact etme ve abort etme. |
| `task.read`         | Arka plan task durumunu okuma.                      |
| `task.write`        | Task bildirim politikasını iptal etme veya değiştirme. |
| `approval.respond`  | İstekleri onaylama veya reddetme.                   |
| `tools.invoke`      | Açığa çıkarılan tool'ları doğrudan çağırma.         |
| `artifacts.read`    | Artifact'ları listeleme ve indirme.                 |
| `environment.write` | Yönetilen ortamları oluşturma veya yok etme.        |
| `admin`             | Yönetim işlemleri.                                  |

Varsayılanlar:

- varsayılan olarak gizli bilgi iletimi yok
- sınırsız ortam değişkeni aktarımı yok
- gizli değerler yerine gizli referansları
- açık sandbox ve ağ politikası
- açık uzak ortam saklama politikası
- politika aksini kanıtlamadıkça host yürütmesi için onaylar
- raw runtime olayları, çağıranın daha güçlü bir tanılama kapsamı yoksa Gateway'den ayrılmadan önce redacted edilir

## Yönetilen ortam sağlayıcısı

Yönetilen agent'lar ortam sağlayıcıları olarak uygulanmalıdır.

```typescript
type EnvironmentProvider = {
  id: string;
  capabilities: {
    checkout?: boolean;
    sandbox?: boolean;
    networkPolicy?: boolean;
    secrets?: boolean;
    artifacts?: boolean;
    logs?: boolean;
    pullRequests?: boolean;
    longRunning?: boolean;
  };
};
```

İlk uygulamanın hosted SaaS olması gerekmez. Mevcut node host'larını, geçici workspace'leri, CI tarzı runner'ları veya Testbox tarzı
ortamları hedefleyebilir. Önemli sözleşme şudur:

1. workspace hazırla
2. güvenli ortamı ve gizli bilgileri bağla
3. run başlat
4. olay akışı sağla
5. artifact'ları topla
6. politikaya göre temizle veya sakla

Bu kararlı hale geldiğinde hosted cloud hizmeti aynı sağlayıcı sözleşmesini uygulayabilir.

## Paket yapısı

Önerilen paketler:

| Paket                   | Amaç                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | Herkese açık yüksek seviyeli SDK ve üretilmiş düşük seviyeli Gateway istemcisi. |
| `@openclaw/sdk-react`   | Dashboard'lar ve app oluşturucular için isteğe bağlı React hook'ları. |
| `@openclaw/sdk-testing` | App entegrasyonları için test yardımcıları ve sahte Gateway sunucusu. |

Depoda Plugin'ler için zaten `openclaw/plugin-sdk/*` bulunur. Plugin yazarları ile app geliştiricilerini karıştırmamak için bu ad alanını ayrı tutun.

## Üretilmiş istemci stratejisi

Düşük seviyeli istemci, sürümlü Gateway protokol
şemalarından üretilmeli, ardından elle yazılmış ergonomik sınıflarla sarmalanmalıdır.

Katmanlama:

1. Gateway şeması için tek doğruluk kaynağı.
2. Oluşturulmuş düşük düzey TypeScript istemcisi.
3. Dış girdiler ve olay yükleri için çalışma zamanı doğrulayıcıları.
4. Üst düzey `OpenClaw`, `Agent`, `Session`, `Run`, `Task` ve `Artifact`
   sarmalayıcıları.
5. Tarif örnekleri ve entegrasyon testleri.

Faydalar:

- protokol sapması görünür olur
- testler, oluşturulan yöntemleri Gateway dışa aktarımlarıyla karşılaştırabilir
- App SDK, Plugin SDK iç bileşenlerinden bağımsız kalır
- düşük düzey tüketiciler hâlâ protokole tam erişime sahiptir
- üst düzey tüketiciler küçük ürün API'sini alır

## İlgili

- [OpenClaw App SDK](/tr/concepts/openclaw-sdk)
- [Gateway RPC başvurusu](/tr/reference/rpc)
- [Agent döngüsü](/tr/concepts/agent-loop)
- [Agent çalışma zamanları](/tr/concepts/agent-runtimes)
- [Arka plan görevleri](/tr/automation/tasks)
- [ACP agent'ları](/tr/tools/acp-agents)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
