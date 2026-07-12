---
read_when:
    - Açık onaylara sahip deterministik çok adımlı iş akışları istiyorsunuz
    - Önceki adımları yeniden çalıştırmadan bir iş akışını sürdürmeniz gerekiyor
summary: OpenClaw için sürdürülebilir onay geçitlerine sahip tür güvenli iş akışı çalışma zamanı.
title: Istakoz
x-i18n:
    generated_at: "2026-07-12T12:18:37Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: eedb6577133588b726992a882a92d94f1f414e55998d0fc80644dd3a64ffc1ab
    source_path: tools/lobster.md
    workflow: 16
---

Lobster, çok adımlı araç işlem hatlarını açık onay kontrol noktaları ve devam belirteçleriyle tek bir belirlenimci araç çağrısı olarak çalıştırır. Ayrılmış arka plan çalışmasının bir katman üzerinde yer alır: çok sayıda ayrılmış görev arasındaki akışları düzenlemek için [Task Flow](/tr/automation/taskflow) (`openclaw tasks flow`) sayfasına; görev etkinliği günlüğü için [Arka Plan Görevleri](/tr/automation/tasks) sayfasına bakın.

## Neden

Lobster olmadan çok adımlı bir iş, modelin her adımı düzenlediği çok sayıda gidiş dönüşlü araç çağrısı gerektirir. Lobster bu düzenlemeyi türü belirlenmiş bir çalışma zamanına taşır:

- **Çok sayıda çağrı yerine tek çağrı**: tek bir Lobster araç çağrısı, işlem hattının tamamı için yapılandırılmış bir sonuç döndürür.
- **Yerleşik onaylar**: yan etkiler (gönderme, yayımlama, silme), açıkça onaylanana kadar iş akışını durdurur.
- **Devam ettirilebilir**: durdurulan bir iş akışı bir belirteç döndürür; önceki adımları yeniden çalıştırmadan onaylayıp devam ettirin.

Lobster, genel amaçlı bir betik dili yerine küçük ve kısıtlı bir DSL'dir: onaylama/devam ettirme kalıcı ve yerleşik bir temel işlevdir; işlem hatları veridir (günlüğe kaydetmesi, karşılaştırması, yeniden oynatması ve incelemesi kolaydır); küçük dil bilgisi, doğrulamanın gerçekçi kalması için "yaratıcı" kod yollarını sınırlar; zaman aşımları, çıktı sınırları, korumalı alan denetimleri ve izin listeleri her betik tarafından değil, çalışma zamanı tarafından uygulanır. Her adım yine de herhangi bir CLI veya betiği çağırabilir; daha zengin bir yazım dili istiyorsanız diğer araçlardan `.lobster` dosyaları oluşturun.

Lobster olmadan yinelenen bir e-posta sınıflandırması şöyle görünür:

```text
Kullanıcı: "E-postalarımı kontrol et ve yanıt taslakları hazırla"
→ openclaw gmail.list'i çağırır
→ LLM özetler
→ Kullanıcı: "#2 ve #5 için yanıt taslakları hazırla"
→ LLM taslakları hazırlar
→ Kullanıcı: "#2'yi gönder"
→ openclaw gmail.send'i çağırır
(her gün tekrarlanır, nelerin sınıflandırıldığına dair bellek yoktur)
```

Lobster ile aynı iş, onay için duran ve ardından devam eden tek bir çağrıdır:

```json
{ "action": "run", "pipeline": "email.triage --limit 20", "timeoutMs": 30000 }
```

```json
{
  "ok": true,
  "status": "needs_approval",
  "output": [{ "summary": "5 need replies, 2 need action" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "Send 2 draft replies?",
    "items": [],
    "resumeToken": "..."
  }
}
```

## Nasıl çalışır

OpenClaw, Lobster iş akışlarını gömülü bir çalıştırıcı olarak paketlenmiş `@clawdbot/lobster` paketini kullanarak **işlem içinde** çalıştırır. Harici bir `lobster` alt işlemi başlatılmaz; araç çağrısı doğrudan bir JSON zarfı döndürür. İşlem hattı onay için durursa zarf, daha sonra devam edebilmeniz için bir devam belirteci (veya kısa bir onay kimliği) taşır.

## Etkinleştirme

Lobster, varsayılan olarak etkinleştirilmemiş **isteğe bağlı** bir Plugin aracıdır. Paketlenmiş olarak gelir, dolayısıyla ayrı bir kurulum adımı gerekmez; yalnızca araca izin verin:

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Veya aracı başına:

```json
{
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": {
          "alsoAllow": ["lobster"]
        }
      }
    ]
  }
}
```

<Note>
`alsoAllow`, diğer temel araçları kısıtlamadan etkin araç profiline `lobster` ekler. Bunun yerine yalnızca kısıtlayıcı bir izin listesi modu istiyorsanız `tools.allow` kullanın.
</Note>

Araç, korumalı alandaki araç bağlamlarında tamamen devre dışıdır.

Geliştirme veya harici işlem hatları için (gömülü Gateway çalıştırıcısının dışında) bağımsız Lobster CLI'ye ihtiyacınız varsa bunu [Lobster deposundan](https://github.com/openclaw/lobster) kurun ve `lobster`'ı `PATH` içine ekleyin.

## Kalıp: küçük CLI + JSON kanalları + onaylar

JSON ile iletişim kuran küçük komutlar oluşturun, ardından bunları tek bir Lobster çağrısında zincirleyin. (Aşağıdaki örnek komut adlarını kendi komutlarınızla değiştirin.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Apply changes?'",
  "timeoutMs": 30000
}
```

İşlem hattı onay isterse belirteçle devam edin:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Örnek: girdi öğelerini araç çağrılarına eşleyin:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Yalnızca JSON kullanan LLM adımları (llm-task)

Bir iş akışı içindeki **yapılandırılmış LLM adımı** için isteğe bağlı `llm-task` Plugin aracını etkinleştirin ve Lobster'dan çağırın:

```json
{
  "plugins": {
    "entries": {
      "llm-task": { "enabled": true }
    }
  },
  "agents": {
    "list": [
      {
        "id": "main",
        "tools": { "alsoAllow": ["llm-task"] }
      }
    ]
  }
}
```

### Önemli sınırlama: gömülü Lobster ile `openclaw.invoke`

Paketlenmiş Lobster Plugin'i, iş akışlarını Gateway içinde **işlem içi** çalıştırır. Bu gömülü modda `openclaw.invoke`, iç içe OpenClaw CLI araç çağrıları için Gateway URL'sini/kimlik doğrulama bağlamını otomatik olarak devralmaz.

Bu nedenle bu kalıp **şu anda gömülü çalıştırıcıda güvenilir değildir**:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Aşağıdaki örneği yalnızca **bağımsız Lobster CLI'yi**, `openclaw.invoke`'ın doğru Gateway/kimlik doğrulama bağlamıyla önceden yapılandırıldığı bir ortamda çalıştırırken kullanın.

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Given the input email, return intent and draft.",
  "thinking": "low",
  "input": { "subject": "Hello", "body": "Can you help?" },
  "schema": {
    "type": "object",
    "properties": {
      "intent": { "type": "string" },
      "draft": { "type": "string" }
    },
    "required": ["intent", "draft"],
    "additionalProperties": false
  }
}'
```

Bugün gömülü Lobster Plugin'ini kullanıyorsanız şunlardan birini tercih edin:

- Lobster dışında doğrudan bir `llm-task` araç çağrısı veya
- desteklenen bir gömülü köprü eklenene kadar Lobster işlem hattı içinde `openclaw.invoke` kullanmayan adımlar.

Ayrıntılar ve yapılandırma seçenekleri için [LLM Görevi](/tr/tools/llm-task) sayfasına bakın.

## İş akışı dosyaları (.lobster)

Lobster, `name`, `args`, `steps`, `env`, `condition` ve `approval` alanlarını içeren YAML/JSON iş akışı dosyalarını çalıştırabilir. Araç çağrısında `pipeline` değerini dosya yolu olarak ayarlayın.

```yaml
name: inbox-triage
args:
  tag:
    default: "family"
steps:
  - id: collect
    command: inbox list --json
  - id: categorize
    command: inbox categorize --json
    stdin: $collect.stdout
  - id: approve
    command: inbox apply --approve
    stdin: $categorize.stdout
    approval: required
  - id: execute
    command: inbox apply --execute
    stdin: $categorize.stdout
    condition: $approve.approved
```

Notlar:

- `stdin: $step.stdout` ve `stdin: $step.json`, önceki bir adımın çıktısını aktarır.
- `condition` (veya `when`), adımları `$step.approved` değerine göre koşullandırabilir.

## Araç parametreleri

### `run`

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Bağımsız değişkenlerle bir iş akışı dosyası çalıştırın:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

| Alan             | Varsayılan  | Notlar                                                                                                                      |
| ---------------- | ----------- | --------------------------------------------------------------------------------------------------------------------------- |
| `pipeline`       | gerekli     | Satır içi işlem hattı dizesi veya iş akışı dosyası için `.lobster`/`.yaml`/`.yml`/`.json` ile biten bir yol.                 |
| `cwd`            | Gateway cwd | Göreli çalışma dizini; Gateway çalışma dizini içinde çözümlenmelidir (mutlak yollar reddedilir).                             |
| `timeoutMs`      | `20000`     | Aşılırsa çalıştırmayı iptal eder.                                                                                            |
| `maxStdoutBytes` | `512000`    | Yakalanan standart çıktı veya standart hata bu boyutu aşarsa çalıştırmayı iptal eder.                                       |
| `argsJson`       | -           | Bir iş akışı dosyasının bağımsız değişkenlerini içeren JSON dizesi (satır içi işlem hatlarında yok sayılır).                 |

### `resume`

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

`resume`, `token` (`requiresApproval` içindeki tam devam belirteci) veya `approvalId` (aynı nesnedeki kısa kimlik) kabul eder; durdurulan çalıştırma hangisini döndürdüyse onu kullanın. `approve` zorunludur.

### Yönetilen Task Flow modu

`run` işleminde `flowControllerId` ve `flowGoal` (veya `resume` işleminde `flowId` ve `flowExpectedRevision`) iletmek, çıplak bir zarf döndürmek yerine çağrıyı Plugin çalışma zamanının yönetilen [Task Flow](/tr/automation/taskflow) API'si üzerinden yürütür: OpenClaw kalıcı bir akış kaydı oluşturur veya devam ettirir, Lobster zarfını bu kayda uygular (onay sırasında `waiting`, tamamlandığında `succeeded`/`failed`) ve `{ ok, envelope, flow, mutation }` döndürür. Bu mod, bağlı bir Task Flow çalışma zamanı gerektirir ve tipik geçici araç kullanımı için değil, Gateway yeniden başlatmaları arasında kalıcı akış durumuna ihtiyaç duyan Plugin/denetleyici kodu için tasarlanmıştır.

## Çıktı zarfı

Lobster, üç durumdan birini içeren bir JSON zarfı döndürür:

- `ok` - başarıyla tamamlandı
- `needs_approval` - duraklatıldı; `requiresApproval`, çalıştırmayı devam ettirebilen bir `resumeToken` ve kısa bir `approvalId` taşır
- `cancelled` - açıkça reddedildi veya iptal edildi

Araç, zarfı hem `content` (biçimlendirilmiş JSON) hem de `details` (ham nesne) içinde sunar.

## Onaylar

`requiresApproval` mevcutsa istemi inceleyip karar verin:

- `approve: true` - devam ettirir ve yan etkileri sürdürür
- `approve: false` - iş akışını iptal eder ve sonlandırır

Özel jq/heredoc birleştirmeleri olmadan onay isteklerine JSON önizlemesi eklemek için `approve --preview-from-stdin --limit N` kullanın. Devam durumu, Lobster durum dizini altında küçük JSON dosyaları olarak saklanır (varsayılan olarak `~/.lobster/state`; `LOBSTER_STATE_DIR` ile geçersiz kılın); belirtecin kendisi işlem hattı durumunun tamamını değil, yalnızca bu duruma yönelik bir işaretçiyi kodlar.

## OpenProse

OpenProse, Lobster ile iyi çalışır: çok aracılı hazırlığı düzenlemek için `/prose` kullanın, ardından belirlenimci onaylar için bir Lobster işlem hattı çalıştırın. Bir Prose programı Lobster'a ihtiyaç duyuyorsa `tools.subagents.tools` aracılığıyla alt aracılar için `lobster` aracına izin verin. [OpenProse](/tr/prose) sayfasına bakın.

## Güvenlik

- **Yalnızca yerel ve işlem içi** - iş akışları Gateway işlemi içinde yürütülür; Plugin'in kendisi ağ çağrısı yapmaz.
- **Gizli bilgi yok** - Lobster, OAuth'u yönetmez; bunu yapan OpenClaw araçlarını çağırır.
- **Korumalı alanı dikkate alır** - araç bağlamı korumalı alandaysa devre dışı bırakılır.
- **Güçlendirilmiş** - zaman aşımları ve çıktı sınırları gömülü çalıştırıcı tarafından uygulanır.

## Sorun giderme

| Hata                                                          | Neden / çözüm                                                                                 |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `lobster runtime timed out`                                   | İşlem hattı `timeoutMs` değerini aştı. Değeri artırın veya işlem hattını bölün.                |
| `lobster stdout exceeded maxStdoutBytes` (veya `stderr`)      | Yakalanan çıktı sınırı aştı. `maxStdoutBytes` değerini artırın veya çıktıyı azaltın.           |
| `run --args-json must be valid JSON`                          | `argsJson` (iş akışı dosyası çalıştırmaları) ayrıştırılamadı. JSON dizesini düzeltin.          |
| `lobster runtime failed` (veya başka bir `runtime_error` iletisi) | Gömülü çalışma zamanı bir hata zarfı döndürdü. Ayrıntılar için Gateway günlüklerini inceleyin. |

## Daha fazla bilgi

- [Plugin'ler](/tr/tools/plugin)
- [Plugin aracı yazma](/tr/plugins/building-plugins#registering-agent-tools)

## Örnek olay: topluluk iş akışları

Herkese açık bir örnek: üç Markdown kasasını (kişisel, partner, ortak) yöneten bir "ikinci beyin" CLI'sı + Lobster işlem hatları. CLI; istatistikler, gelen kutusu listeleri ve güncelliğini yitirmiş öğe taramaları için JSON üretir. Lobster ise bu komutları, her biri onay geçitlerine sahip `weekly-review`, `inbox-triage`, `memory-consolidation` ve `shared-task-sync` gibi iş akışlarında zincirler. Kullanılabilir olduğunda muhakemeyi (kategorilendirme) yapay zekâ gerçekleştirir; kullanılamadığında ise belirli kurallara geri döner.

- Konu: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Depo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## İlgili

- [Otomasyon](/tr/automation) - tüm otomasyon mekanizmaları
- [Araçlara Genel Bakış](/tr/tools) - kullanılabilir tüm aracı araçları
