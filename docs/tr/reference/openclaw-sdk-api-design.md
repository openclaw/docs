---
read_when:
    - Önerilen herkese açık OpenClaw uygulama SDK'sını uyguluyorsunuz
    - Uygulama SDK'sı için taslak ad alanı, olay, sonuç, artefakt, onay veya güvenlik sözleşmesine ihtiyacınız var
    - Gateway protokol kaynaklarını üst düzey OpenClaw App SDK sarmalayıcısıyla karşılaştırıyorsunuz
sidebarTitle: App SDK API design
summary: Herkese açık OpenClaw App SDK API'si, olay taksonomisi, artefaktlar, onaylar ve paket yapısı için referans tasarım
title: OpenClaw Uygulama SDK API tasarımı
x-i18n:
    generated_at: "2026-04-30T09:43:55Z"
    model: gpt-5.5
    provider: openai
    source_hash: cacc5329942798b6876dba6ab8d6a9193291ddda81db5cb2ed492cc42a810099
    source_path: reference/openclaw-sdk-api-design.md
    workflow: 16
---

Bu sayfa, herkese açık
[OpenClaw App SDK](/tr/concepts/openclaw-sdk) için ayrıntılı API referansı tasarımıdır. Bilerek
[Plugin SDK](/tr/plugins/sdk-overview)'den ayrı tutulmuştur.

<Note>
  `@openclaw/sdk`, Gateway ile konuşmak için kullanılan harici app/istemci paketidir.
  `openclaw/plugin-sdk/*`, süreç içi Plugin yazarlığı sözleşmesidir.
  Yalnızca ajanları çalıştırması gereken uygulamalardan Plugin SDK alt yollarını içe aktarmayın.
</Note>

Herkese açık app SDK iki katmanda oluşturulmalıdır:

1. Düşük seviyeli, oluşturulmuş bir Gateway istemcisi.
2. `OpenClaw`, `Agent`, `Session`, `Run`,
   `Task`, `Artifact`, `Approval` ve `Environment` nesneleriyle yüksek seviyeli ergonomik bir sarmalayıcı.

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
oc.tools.invoke(...); // future API: current SDK throws unsupported

oc.artifacts.list({ runId }); // future API: current SDK throws unsupported
oc.artifacts.get(artifactId); // future API: current SDK throws unsupported
oc.artifacts.download(artifactId); // future API: current SDK throws unsupported

oc.approvals.list();
oc.approvals.respond(approvalId, ...);

oc.environments.list(); // future API: current SDK throws unsupported
oc.environments.create(...); // future API: current SDK throws unsupported
oc.environments.status(environmentId); // future API: current SDK throws unsupported
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

Herkese açık SDK, sürümlü, yeniden oynatılabilir, normalleştirilmiş olaylar sunmalıdır.

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

`id`, yeniden oynatma imlecidir. Tüketiciler
`events({ after: id })` ile yeniden bağlanabilmeli ve saklama izin verdiğinde kaçırılan olayları alabilmelidir.

Önerilen normalleştirilmiş olay aileleri:

| Olay                  | Anlam                                                       |
| --------------------- | ----------------------------------------------------------- |
| `run.created`         | Çalıştırma kabul edildi.                                    |
| `run.queued`          | Çalıştırma bir oturum hattı, çalışma zamanı veya ortam bekliyor. |
| `run.started`         | Çalışma zamanı yürütmeyi başlattı.                          |
| `run.completed`       | Çalıştırma başarıyla tamamlandı.                            |
| `run.failed`          | Çalıştırma bir hatayla sona erdi.                           |
| `run.cancelled`       | Çalıştırma iptal edildi.                                    |
| `run.timed_out`       | Çalıştırma zaman aşımını aştı.                              |
| `assistant.delta`     | Asistan metin deltası.                                      |
| `assistant.message`   | Tam asistan mesajı veya değiştirme.                         |
| `thinking.delta`      | İlke görünürlüğe izin verdiğinde akıl yürütme veya plan deltası. |
| `tool.call.started`   | Araç çağrısı başladı.                                       |
| `tool.call.delta`     | Araç çağrısı ilerleme veya kısmi çıktıyı akışla iletti.     |
| `tool.call.completed` | Araç çağrısı başarıyla döndü.                               |
| `tool.call.failed`    | Araç çağrısı başarısız oldu.                                |
| `approval.requested`  | Bir çalıştırma veya aracın onaya ihtiyacı var.              |
| `approval.resolved`   | Onay verildi, reddedildi, süresi doldu veya iptal edildi.   |
| `question.requested`  | Çalışma zamanı kullanıcıdan veya ana uygulamadan girdi ister. |
| `question.answered`   | Ana uygulama bir yanıt sağladı.                             |
| `artifact.created`    | Yeni artifact kullanılabilir.                               |
| `artifact.updated`    | Mevcut artifact değişti.                                    |
| `session.created`     | Oturum oluşturuldu.                                         |
| `session.updated`     | Oturum meta verileri değişti.                               |
| `session.compacted`   | Oturum Compaction gerçekleşti.                              |
| `task.updated`        | Arka plan görev durumu değişti.                             |
| `git.branch`          | Çalışma zamanı dal durumunu gözlemledi veya değiştirdi.     |
| `git.diff`            | Çalışma zamanı bir diff üretti veya değiştirdi.             |
| `git.pr`              | Çalışma zamanı bir pull request açtı, güncelledi veya bağladı. |

Çalışma zamanına özgü payload'lar `raw` üzerinden kullanılabilir olmalıdır, ancak uygulamalar normal UI için
`raw` ayrıştırmak zorunda kalmamalıdır.

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
şeklini korur; bu nedenle mevcut yaşam döngüsü destekli çalıştırmalar genellikle epoch milisaniye
sayıları bildirirken adaptörler hâlâ ISO dizgileri yüzeye çıkarabilir. Zengin UI, araç izleri ve
çalışma zamanına özgü ayrıntılar olaylara ve artifact'lere aittir.

`accepted`, terminal olmayan bir bekleme sonucudur: Gateway bekleme son tarihinin
çalıştırma bir yaşam döngüsü bitişi/hatası üretmeden önce dolduğu anlamına gelir. `timed_out` olarak
ele alınmamalıdır; `timed_out`, kendi çalışma zamanı
zaman aşımını aşan bir çalıştırma için ayrılmıştır.

## Onaylar ve sorular

Kodlama ajanları sürekli güvenlik sınırlarını geçtiği için onaylar birinci sınıf olmalıdır.

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
- çalıştırma id'si ve oturum id'si
- istek türü
- istenen eylem özeti
- araç adı veya ortam eylemi
- risk seviyesi
- kullanılabilir kararlar
- süre sonu
- kararın yeniden kullanılıp kullanılamayacağı

Sorular onaylardan ayrıdır. Bir soru kullanıcıdan veya ana uygulamadan bilgi ister. Bir onay, bir eylemi gerçekleştirmek için izin ister.

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
- onay ilkesi
- çalışma zamanı uyumluluğu
- bir aracın gizli, salt okunur, yazma yetenekli veya ana makine yetenekli olup olmadığı

SDK üzerinden araç çağırma açık ve kapsamlı olmalıdır. Çoğu uygulama ajanları çalıştırmalı, rastgele araçları doğrudan çağırmamalıdır.

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

- dosya düzenlemeleri ve oluşturulan dosyalar
- patch paketleri
- VCS diff'leri
- ekran görüntüleri ve medya çıktıları
- günlükler ve iz paketleri
- pull request bağlantıları
- çalışma zamanı yörüngeleri
- yönetilen ortam çalışma alanı anlık görüntüleri

Artifact erişimi, her artifact'in normal bir yerel dosya olduğunu varsaymadan
redaksiyon, saklama ve indirme URL'lerini desteklemelidir.

## Güvenlik modeli

App SDK yetki konusunda açık olmalıdır.

Önerilen token kapsamları:

| Kapsam              | İzin verdiği şeyler                                  |
| ------------------- | --------------------------------------------------- |
| `agent.read`        | Ajanları listeleme ve inceleme.                      |
| `agent.run`         | Çalıştırmaları başlatma.                             |
| `session.read`      | Oturum meta verilerini ve mesajları okuma.           |
| `session.write`     | Oturum oluşturma, oturuma gönderme, fork etme, compact etme ve iptal etme. |
| `task.read`         | Arka plan görev durumunu okuma.                      |
| `task.write`        | Görev bildirim ilkesini iptal etme veya değiştirme.  |
| `approval.respond`  | İstekleri onaylama veya reddetme.                    |
| `tools.invoke`      | Açığa çıkarılan araçları doğrudan çağırma.           |
| `artifacts.read`    | Artifact'leri listeleme ve indirme.                  |
| `environment.write` | Yönetilen ortamlar oluşturma veya yok etme.          |
| `admin`             | Yönetim işlemleri.                                   |

Varsayılanlar:

- varsayılan olarak secret iletimi yok
- kısıtlamasız ortam değişkeni aktarımı yok
- secret değerleri yerine secret referansları
- açık sandbox ve ağ ilkesi
- açık uzak ortam saklama
- ilke aksini kanıtlamadıkça ana makine yürütmesi için onaylar
- çağıranın daha güçlü bir tanılama kapsamı olmadığı sürece ham çalışma zamanı olayları Gateway dışına çıkmadan önce redakte edilir

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

İlk uygulamanın barındırılan bir SaaS olması gerekmez. Mevcut node ana makinelerini, geçici çalışma alanlarını, CI tarzı çalıştırıcıları veya Testbox tarzı
ortamları hedefleyebilir. Önemli sözleşme şudur:

1. çalışma alanını hazırla
2. güvenli ortamı ve secret'ları bağla
3. çalıştırmayı başlat
4. olayları akışla ilet
5. artifact'leri topla
6. ilkeye göre temizle veya sakla

Bu kararlı hale geldiğinde, barındırılan bir bulut hizmeti aynı sağlayıcı
sözleşmesini uygulayabilir.

## Paket yapısı

Önerilen paketler:

| Paket                   | Amaç                                                          |
| ----------------------- | ------------------------------------------------------------- |
| `@openclaw/sdk`         | Herkese açık yüksek seviyeli SDK ve oluşturulmuş düşük seviyeli Gateway istemcisi. |
| `@openclaw/sdk-react`   | Panolar ve uygulama oluşturucular için isteğe bağlı React kancaları. |
| `@openclaw/sdk-testing` | Uygulama entegrasyonları için test yardımcıları ve sahte Gateway sunucusu. |

Repo, Plugin'ler için zaten `openclaw/plugin-sdk/*` içeriyor. Plugin yazarlarını uygulama geliştiricileriyle karıştırmamak için bu ad alanını ayrı tutun.

## Oluşturulmuş istemci stratejisi

Düşük seviyeli istemci, sürümlenmiş Gateway protokolü
şemalarından üretilmeli, ardından el yazımı ergonomik sınıflarla sarmalanmalıdır.

Katmanlama:

1. Gateway şeması tek doğruluk kaynağıdır.
2. Üretilmiş düşük seviyeli TypeScript istemcisi.
3. Dış girdiler ve olay yükleri için çalışma zamanı doğrulayıcıları.
4. Yüksek seviyeli `OpenClaw`, `Agent`, `Session`, `Run`, `Task` ve `Artifact`
   sarmalayıcıları.
5. Cookbook örnekleri ve entegrasyon testleri.

Avantajlar:

- protokol sapması görünür olur
- testler üretilmiş yöntemleri Gateway dışa aktarımlarıyla karşılaştırabilir
- Uygulama SDK'sı, Plugin SDK iç yapılarından bağımsız kalır
- düşük seviyeli tüketiciler hâlâ tam protokol erişimine sahip olur
- yüksek seviyeli tüketiciler küçük ürün API'sini alır

## İlgili dokümanlar

- [OpenClaw Uygulama SDK'sı](/tr/concepts/openclaw-sdk)
- [Gateway RPC başvurusu](/tr/reference/rpc)
- [Ajan döngüsü](/tr/concepts/agent-loop)
- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Arka plan görevleri](/tr/automation/tasks)
- [ACP ajanları](/tr/tools/acp-agents)
- [Plugin SDK genel bakışı](/tr/plugins/sdk-overview)
