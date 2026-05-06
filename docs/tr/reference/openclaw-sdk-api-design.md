---
read_when:
    - Önerilen herkese açık OpenClaw uygulama SDK'sini uyguluyorsunuz
    - Uygulama SDK'sı için taslak ad alanı, olay, sonuç, artefakt, onay veya güvenlik sözleşmesine ihtiyacınız var
    - Gateway protokol kaynaklarını üst düzey OpenClaw App SDK sarmalayıcısıyla karşılaştırıyorsunuz
sidebarTitle: App SDK API design
summary: Genel kullanıma açık OpenClaw App SDK API'si, olay taksonomisi, artefaktlar, onaylar ve paket yapısı için referans tasarım
title: OpenClaw Uygulama SDK API tasarımı
x-i18n:
    generated_at: "2026-05-06T09:30:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1c49afb4b3b23653e1c6512c22c7465dc1778fc9ea2b28864ca9eaa3ccc90f2f
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Bu sayfa, genel
[OpenClaw Uygulama SDK'si](/tr/concepts/openclaw-sdk) için ayrıntılı API referansı tasarımıdır. Bilerek
[Plugin SDK](/tr/plugins/sdk-overview) öğesinden ayrı tutulmuştur.

<Note>
  `@openclaw/sdk`, Gateway ile konuşmak için kullanılan harici uygulama/istemci paketidir.
  `openclaw/plugin-sdk/*`, süreç içi Plugin yazarlığı sözleşmesidir.
  Yalnızca ajan çalıştırması gereken uygulamalardan Plugin SDK alt yollarını içe aktarmayın.
</Note>

Genel uygulama SDK'si iki katmanda oluşturulmalıdır:

1. Düşük seviyeli, üretilmiş bir Gateway istemcisi.
2. `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` ve `Environment` nesneleri içeren, yüksek seviyeli ergonomik bir sarmalayıcı.

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

oc.tasks.list(); // future API: current SDK throws unsupported
oc.tasks.get(taskId); // future API: current SDK throws unsupported
oc.tasks.cancel(taskId); // future API: current SDK throws unsupported
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

Genel SDK, sürümlenmiş, yeniden oynatılabilir, normalleştirilmiş olaylar sunmalıdır.

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

Önerilen normalleştirilmiş olay aileleri:

| Olay                  | Anlam                                                        |
| --------------------- | ------------------------------------------------------------ |
| `run.created`         | Çalıştırma kabul edildi.                                     |
| `run.queued`          | Çalıştırma bir oturum hattı, çalışma zamanı veya ortam bekliyor. |
| `run.started`         | Çalışma zamanı yürütmeyi başlattı.                           |
| `run.completed`       | Çalıştırma başarıyla tamamlandı.                             |
| `run.failed`          | Çalıştırma bir hatayla sona erdi.                            |
| `run.cancelled`       | Çalıştırma iptal edildi.                                     |
| `run.timed_out`       | Çalıştırma zaman aşımını aştı.                               |
| `assistant.delta`     | Asistan metin deltası.                                       |
| `assistant.message`   | Tam asistan mesajı veya değiştirme.                          |
| `thinking.delta`      | Politika gösterime izin verdiğinde akıl yürütme veya plan deltası. |
| `tool.call.started`   | Araç çağrısı başladı.                                        |
| `tool.call.delta`     | Araç çağrısı ilerleme veya kısmi çıktı akışı yaptı.          |
| `tool.call.completed` | Araç çağrısı başarıyla döndü.                                |
| `tool.call.failed`    | Araç çağrısı başarısız oldu.                                 |
| `approval.requested`  | Bir çalıştırma veya aracın onaya ihtiyacı var.               |
| `approval.resolved`   | Onay verildi, reddedildi, süresi doldu veya iptal edildi.    |
| `question.requested`  | Çalışma zamanı kullanıcıdan veya ana uygulamadan girdi ister. |
| `question.answered`   | Ana uygulama bir yanıt sağladı.                              |
| `artifact.created`    | Yeni artifact kullanılabilir.                                |
| `artifact.updated`    | Mevcut artifact değişti.                                     |
| `session.created`     | Oturum oluşturuldu.                                          |
| `session.updated`     | Oturum meta verileri değişti.                                |
| `session.compacted`   | Oturum Compaction gerçekleşti.                               |
| `task.updated`        | Arka plan görevi durumu değişti.                             |
| `git.branch`          | Çalışma zamanı dal durumunu gözlemledi veya değiştirdi.      |
| `git.diff`            | Çalışma zamanı bir diff üretti veya değiştirdi.              |
| `git.pr`              | Çalışma zamanı bir pull request açtı, güncelledi veya bağladı. |

Çalışma zamanına özgü yükler `raw` üzerinden erişilebilir olmalıdır, ancak uygulamaların normal UI için
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

Sonuç sade ve kararlı olmalıdır. Zaman damgası değerleri Gateway biçimini korur;
bu nedenle mevcut yaşam döngüsü destekli çalıştırmalar genellikle epoch milisaniye
sayıları bildirirken bağdaştırıcılar hâlâ ISO dizeleri sunabilir. Zengin UI, araç izleri ve
çalışma zamanına özgü ayrıntılar olaylara ve artifact'lere aittir.

`accepted` terminal olmayan bir bekleme sonucudur: Gateway bekleme son tarihi,
çalıştırma bir yaşam döngüsü sonu/hatası üretmeden önce doldu demektir. `timed_out` olarak ele alınmamalıdır;
`timed_out`, kendi çalışma zamanı zaman aşımını aşan bir çalıştırma için ayrılmıştır.

## Onaylar ve sorular

Kodlama ajanları sürekli olarak güvenlik sınırlarını aştığı için onaylar birinci sınıf olmalıdır.

```typescript
run.onApproval(async (request) => {
  if (request.kind === "tool" && request.toolName === "exec") {
    return request.approveOnce({ reason: "CI command allowed by policy" });
  }

  return request.askUser();
});
```

Onay olayları şunları taşımalıdır:

- onay kimliği
- çalıştırma kimliği ve oturum kimliği
- istek türü
- istenen eylem özeti
- araç adı veya ortam eylemi
- risk düzeyi
- kullanılabilir kararlar
- sona erme
- kararın yeniden kullanılıp kullanılamayacağı

Sorular onaylardan ayrıdır. Bir soru, kullanıcıdan veya ana uygulamadan bilgi ister.
Bir onay, bir eylemi gerçekleştirmek için izin ister.

## ToolSpace modeli

Uygulamaların, Plugin iç işleyişlerini içe aktarmadan araç yüzeyini anlaması gerekir.

```typescript
const tools = await run.toolSpace();

for (const tool of tools.list()) {
  console.log(tool.name, tool.source, tool.requiresApproval);
}
```

SDK şunları sunmalıdır:

- normalleştirilmiş araç meta verileri
- kaynak: OpenClaw, MCP, Plugin, kanal, çalışma zamanı veya uygulama
- şema özeti
- onay politikası
- çalışma zamanı uyumluluğu
- bir aracın gizli, salt okunur, yazma yetenekli veya ana makine yetenekli olup olmadığı

SDK üzerinden araç çağırma açık ve kapsamlı olmalıdır. Çoğu uygulama, rastgele araçları doğrudan çağırmak yerine
ajanları çalıştırmalıdır.

## Artifact modeli

Artifact'ler dosyalardan fazlasını kapsamalıdır.

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

- dosya düzenlemeleri ve üretilmiş dosyalar
- patch paketleri
- VCS diff'leri
- ekran görüntüleri ve medya çıktıları
- günlükler ve iz paketleri
- pull request bağlantıları
- çalışma zamanı izlekleri
- yönetilen ortam çalışma alanı anlık görüntüleri

Artifact erişimi, her artifact'in normal bir yerel dosya olduğunu varsaymadan
redaksiyon, saklama ve indirme URL'lerini desteklemelidir.

## Güvenlik modeli

Uygulama SDK'si yetki konusunda açık olmalıdır.

Önerilen token kapsamları:

| Kapsam              | İzin verir                                          |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Ajanları listeleme ve inceleme.                     |
| `agent.run`         | Çalıştırmaları başlatma.                            |
| `session.read`      | Oturum meta verilerini ve mesajlarını okuma.        |
| `session.write`     | Oturum oluşturma, oturuma gönderme, fork etme, compact etme ve iptal etme. |
| `task.read`         | Arka plan görevi durumunu okuma.                    |
| `task.write`        | Görev bildirim politikasını iptal etme veya değiştirme. |
| `approval.respond`  | İstekleri onaylama veya reddetme.                   |
| `tools.invoke`      | Açığa çıkarılmış araçları doğrudan çağırma.         |
| `artifacts.read`    | Artifact'leri listeleme ve indirme.                 |
| `environment.write` | Yönetilen ortamlar oluşturma veya yok etme.         |
| `admin`             | Yönetim işlemleri.                                  |

Varsayılanlar:

- varsayılan olarak gizli bilgi iletimi yok
- sınırsız ortam değişkeni aktarımı yok
- gizli değerleri yerine gizli referansları
- açık sandbox ve ağ politikası
- açık uzak ortam saklama
- politika aksini kanıtlamadığı sürece ana makine yürütmesi için onaylar
- çağıranın daha güçlü bir tanılama kapsamı yoksa, ham çalışma zamanı olayları Gateway'den çıkmadan önce redakte edilir

## Yönetilen ortam sağlayıcısı

Yönetilen ajanlar ortam sağlayıcıları olarak uygulanmalıdır.

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

İlk uygulamanın barındırılan bir SaaS olması gerekmez. Mevcut Node ana makinelerini,
geçici çalışma alanlarını, CI tarzı çalıştırıcıları veya Testbox tarzı ortamları hedefleyebilir.
Önemli sözleşme şudur:

1. çalışma alanını hazırla
2. güvenli ortamı ve gizli bilgileri bağla
3. çalıştırmayı başlat
4. olayları akışla
5. artifact'leri topla
6. politikaya göre temizle veya sakla

Bu kararlı hale geldiğinde, barındırılan bir bulut hizmeti aynı sağlayıcı
sözleşmesini uygulayabilir.

## Paket yapısı

Önerilen paketler:

| Paket                   | Amaç                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | Genel yüksek seviyeli SDK ve üretilmiş düşük seviyeli Gateway istemcisi. |
| `@openclaw/sdk-react`   | Panolar ve uygulama oluşturucular için isteğe bağlı React hook'ları. |
| `@openclaw/sdk-testing` | Uygulama entegrasyonları için test yardımcıları ve sahte Gateway sunucusu. |

Depoda Plugin'ler için zaten `openclaw/plugin-sdk/*` vardır. Plugin yazarları ile uygulama geliştiricilerini
karıştırmamak için bu ad alanını ayrı tutun.

## Üretilmiş istemci stratejisi

Düşük seviyeli istemci, sürümlenmiş Gateway protokol şemalarından üretilmeli,
ardından elle yazılmış ergonomik sınıflarla sarmalanmalıdır.

Katmanlama:

1. Gateway şeması için doğruluk kaynağı.
2. Oluşturulmuş düşük seviyeli TypeScript istemcisi.
3. Harici girdiler ve olay yükleri için çalışma zamanı doğrulayıcıları.
4. Yüksek seviyeli `OpenClaw`, `Agent`, `Session`, `Run`, `Task` ve `Artifact`
   sarmalayıcıları.
5. Tarif niteliğinde örnekler ve entegrasyon testleri.

Avantajlar:

- protokol sapması görünürdür
- testler oluşturulan yöntemleri Gateway dışa aktarımlarıyla karşılaştırabilir
- App SDK, Plugin SDK iç yapılarından bağımsız kalır
- düşük seviyeli tüketiciler hâlâ tam protokol erişimine sahiptir
- yüksek seviyeli tüketiciler küçük ürün API'sini alır

## İlgili

- [OpenClaw App SDK](/tr/concepts/openclaw-sdk)
- [Gateway RPC başvurusu](/tr/reference/rpc)
- [Agent döngüsü](/tr/concepts/agent-loop)
- [Agent çalışma zamanları](/tr/concepts/agent-runtimes)
- [Arka plan görevleri](/tr/automation/tasks)
- [ACP agent'ları](/tr/tools/acp-agents)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
