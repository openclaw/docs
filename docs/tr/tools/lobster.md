---
read_when:
    - Açık onaylarla deterministik çok adımlı iş akışları istiyorsunuz
    - Önceki adımları yeniden çalıştırmadan bir iş akışını sürdürmeniz gerekir.
summary: OpenClaw için, kaldığı yerden devam ettirilebilir onay geçitlerine sahip tipli iş akışı çalışma zamanı.
title: Istakoz
x-i18n:
    generated_at: "2026-05-12T01:00:28Z"
    model: gpt-5.5
    provider: openai
    source_hash: 404b2e47982f7efb9a8bb015ac5d7bd8a06f0a41d966e620c9826735abf7f0e3
    source_path: tools/lobster.md
    workflow: 16
---

Lobster, OpenClaw'ın çok adımlı araç dizilerini açık onay denetim noktalarıyla tek ve belirlenimci bir işlem olarak çalıştırmasına olanak tanıyan bir iş akışı kabuğudur.

Lobster, ayrık arka plan çalışmasının bir üstündeki yazma katmanıdır. Tekil görevlerin üzerindeki akış orkestrasyonu için [Görev Akışı](/tr/automation/taskflow) (`openclaw tasks flow`) bölümüne bakın. Görev etkinliği defteri için [`openclaw tasks`](/tr/automation/tasks) bölümüne bakın.

## Kanca

Asistanınız kendisini yöneten araçları oluşturabilir. Bir iş akışı isteyin; 30 dakika sonra tek çağrı olarak çalışan bir CLI ve işlem hatlarına sahip olun. Lobster eksik parçadır: belirlenimci işlem hatları, açık onaylar ve sürdürülebilir durum.

## Neden

Bugün karmaşık iş akışları çok sayıda karşılıklı araç çağrısı gerektirir. Her çağrı token maliyeti doğurur ve LLM her adımı orkestre etmek zorundadır. Lobster bu orkestrasyonu tipli bir çalışma zamanına taşır:

- **Çok yerine tek çağrı**: OpenClaw tek bir Lobster araç çağrısı çalıştırır ve yapılandırılmış bir sonuç alır.
- **Yerleşik onaylar**: Yan etkiler (e-posta gönderme, yorum gönderme) açıkça onaylanana kadar iş akışını durdurur.
- **Sürdürülebilir**: Durdurulan iş akışları bir token döndürür; her şeyi yeniden çalıştırmadan onaylayıp sürdürebilirsiniz.

## Neden düz programlar yerine DSL?

Lobster kasıtlı olarak küçüktür. Amaç "yeni bir dil" değil; birinci sınıf onaylara ve sürdürme tokenlarına sahip, öngörülebilir ve yapay zeka dostu bir işlem hattı belirtimidir.

- **Onayla/sürdür yerleşiktir**: Normal bir program bir insandan istem alabilir, ancak bu çalışma zamanını kendiniz icat etmeden dayanıklı bir token ile _duraklayıp sürdüremez_.
- **Belirlenimcilik + denetlenebilirlik**: İşlem hatları veridir; bu yüzden günlüğe kaydetmeleri, fark almaları, yeniden oynatmaları ve incelemeleri kolaydır.
- **Yapay zeka için kısıtlı yüzey**: Küçük bir gramer + JSON borulama, "yaratıcı" kod yollarını azaltır ve doğrulamayı gerçekçi hale getirir.
- **Güvenlik politikası yerleşiktir**: Zaman aşımları, çıktı sınırları, sandbox kontrolleri ve izin listeleri her betik tarafından değil çalışma zamanı tarafından uygulanır.
- **Yine de programlanabilir**: Her adım herhangi bir CLI veya betiği çağırabilir. JS/TS istiyorsanız koddan `.lobster` dosyaları oluşturun.

## Nasıl çalışır

OpenClaw, Lobster iş akışlarını gömülü bir çalıştırıcı kullanarak **işlem içinde** çalıştırır. Harici CLI alt süreci başlatılmaz; iş akışı motoru gateway sürecinin içinde yürütülür ve doğrudan bir JSON zarfı döndürür.
İşlem hattı onay için duraklarsa, araç daha sonra devam edebilmeniz için bir `resumeToken` döndürür.

## Kalıp: küçük CLI + JSON boruları + onaylar

JSON konuşan küçük komutlar oluşturun, sonra bunları tek bir Lobster çağrısına zincirleyin. (Aşağıdaki örnek komut adları - kendi komutlarınızla değiştirin.)

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

İşlem hattı onay isterse token ile sürdürün:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Yapay zeka iş akışını tetikler; Lobster adımları yürütür. Onay kapıları yan etkileri açık ve denetlenebilir tutar.

Örnek: giriş öğelerini araç çağrılarına eşleyin:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Yalnızca JSON LLM adımları (llm-task)

**Yapılandırılmış LLM adımı** gerektiren iş akışları için isteğe bağlı
`llm-task` Plugin aracını etkinleştirin ve Lobster'dan çağırın. Bu, bir modelle sınıflandırma/özetleme/taslak oluşturma yapmanıza izin verirken iş akışını
belirlenimci tutar.

Aracı etkinleştirin:

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

### Önemli sınırlama: gömülü Lobster ve `openclaw.invoke`

Paketle gelen Lobster Plugin, iş akışlarını gateway içinde **işlem içinde** çalıştırır. Bu gömülü modda `openclaw.invoke`, iç içe OpenClaw CLI araç çağrıları için bir gateway URL/kimlik doğrulama bağlamını otomatik olarak devralmaz.

Bu, şu kalıbın **gömülü çalıştırıcıda şu anda güvenilir olmadığı** anlamına gelir:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Aşağıdaki örneği yalnızca **bağımsız Lobster CLI** çalıştırırken, `openclaw.invoke` zaten doğru gateway/kimlik doğrulama bağlamıyla yapılandırılmış bir ortamda kullanın.

Bunu bağımsız bir Lobster CLI işlem hattında kullanın:

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

Bugün gömülü Lobster Plugin kullanıyorsanız şunlardan birini tercih edin:

- Lobster dışında doğrudan bir `llm-task` araç çağrısı veya
- desteklenen bir gömülü köprü eklenene kadar Lobster işlem hattı içinde `openclaw.invoke` olmayan adımlar.

Ayrıntılar ve yapılandırma seçenekleri için [LLM Görevi](/tr/tools/llm-task) bölümüne bakın.

## İş akışı dosyaları (.lobster)

Lobster, `name`, `args`, `steps`, `env`, `condition` ve `approval` alanlarına sahip YAML/JSON iş akışı dosyalarını çalıştırabilir. OpenClaw araç çağrılarında `pipeline` değerini dosya yolu olarak ayarlayın.

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

- `stdin: $step.stdout` ve `stdin: $step.json`, önceki bir adımın çıktısını geçirir.
- `condition` (veya `when`), adımları `$step.approved` üzerinde kapılayabilir.

## Lobster'ı yükleme

Paketle gelen Lobster iş akışları işlem içinde çalışır; ayrı bir `lobster` ikili dosyası gerekmez. Gömülü çalıştırıcı Lobster Plugin ile birlikte gelir.

Geliştirme veya harici işlem hatları için bağımsız Lobster CLI gerekiyorsa, [Lobster deposundan](https://github.com/openclaw/lobster) yükleyin ve `lobster` öğesinin `PATH` üzerinde olduğundan emin olun.

## Aracı etkinleştirme

Lobster **isteğe bağlı** bir Plugin aracıdır (varsayılan olarak etkin değildir).

Önerilen (eklemeli, güvenli):

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

Kısıtlayıcı izin listesi modunda çalıştırmayı amaçlamadığınız sürece `tools.allow: ["lobster"]` kullanmaktan kaçının.

<Note>
İzin listeleri isteğe bağlı plugins için isteğe bağlıdır. `alsoAllow`, normal çekirdek araç setini korurken yalnızca adlandırılmış isteğe bağlı Plugin araçlarını etkinleştirir. Çekirdek araçları kısıtlamak için istediğiniz çekirdek araçlar veya gruplarla `tools.allow` kullanın.
</Note>

## Örnek: E-posta önceliklendirme

Lobster olmadan:

```
User: "Check my email and draft replies"
→ openclaw calls gmail.list
→ LLM summarizes
→ User: "draft replies to #2 and #5"
→ LLM drafts
→ User: "send #2"
→ openclaw calls gmail.send
(repeat daily, no memory of what was triaged)
```

Lobster ile:

```json
{
  "action": "run",
  "pipeline": "email.triage --limit 20",
  "timeoutMs": 30000
}
```

Bir JSON zarfı döndürür (kısaltılmış):

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

Kullanıcı onaylar → sürdür:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Tek iş akışı. Belirlenimci. Güvenli.

## Araç parametreleri

### `run`

Bir işlem hattını araç modunda çalıştırın.

```json
{
  "action": "run",
  "pipeline": "gog.gmail.search --query 'newer_than:1d' | email.triage",
  "cwd": "workspace",
  "timeoutMs": 30000,
  "maxStdoutBytes": 512000
}
```

Argümanlarla bir iş akışı dosyası çalıştırın:

```json
{
  "action": "run",
  "pipeline": "/path/to/inbox-triage.lobster",
  "argsJson": "{\"tag\":\"family\"}"
}
```

### `resume`

Onaydan sonra durdurulmuş bir iş akışına devam edin.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### İsteğe bağlı girişler

- `cwd`: İşlem hattı için göreli çalışma dizini (gateway çalışma dizini içinde kalmalıdır).
- `timeoutMs`: Bu süreyi aşarsa iş akışını iptal eder (varsayılan: 20000).
- `maxStdoutBytes`: Çıktı bu boyutu aşarsa iş akışını iptal eder (varsayılan: 512000).
- `argsJson`: `lobster run --args-json` öğesine geçirilen JSON dizesi (yalnızca iş akışı dosyaları).

## Çıktı zarfı

Lobster üç durumdan birine sahip bir JSON zarfı döndürür:

- `ok` → başarıyla tamamlandı
- `needs_approval` → duraklatıldı; sürdürmek için `requiresApproval.resumeToken` gereklidir
- `cancelled` → açıkça reddedildi veya iptal edildi

Araç, zarfı hem `content` (güzel biçimlendirilmiş JSON) hem de `details` (ham nesne) içinde sunar.

## Onaylar

`requiresApproval` varsa istemi inceleyin ve karar verin:

- `approve: true` → sürdür ve yan etkilere devam et
- `approve: false` → iptal et ve iş akışını sonlandır

Özel jq/heredoc yapıştırıcısı olmadan onay isteklerine JSON önizlemesi eklemek için `approve --preview-from-stdin --limit N` kullanın. Sürdürme tokenları artık kompakttır: Lobster iş akışı sürdürme durumunu kendi durum dizini altında saklar ve küçük bir token anahtarı döndürür.

## OpenProse

OpenProse, Lobster ile iyi eşleşir: çok aracılı hazırlığı orkestre etmek için `/prose` kullanın, ardından belirlenimci onaylar için bir Lobster işlem hattı çalıştırın. Bir Prose programının Lobster'a ihtiyacı varsa `tools.subagents.tools` aracılığıyla alt aracılar için `lobster` aracına izin verin. [OpenProse](/tr/prose) bölümüne bakın.

## Güvenlik

- **Yalnızca yerel işlem içi** - iş akışları gateway süreci içinde yürütülür; Plugin'in kendisinden ağ çağrısı yapılmaz.
- **Sır yok** - Lobster OAuth yönetmez; bunu yapan OpenClaw araçlarını çağırır.
- **Sandbox duyarlı** - araç bağlamı sandbox içine alındığında devre dışı bırakılır.
- **Sertleştirilmiş** - zaman aşımları ve çıktı sınırları gömülü çalıştırıcı tarafından uygulanır.

## Sorun giderme

- **`lobster timed out`** → `timeoutMs` değerini artırın veya uzun bir işlem hattını bölün.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` değerini yükseltin veya çıktı boyutunu azaltın.
- **`lobster returned invalid JSON`** → işlem hattının araç modunda çalıştığından ve yalnızca JSON yazdırdığından emin olun.
- **`lobster failed`** → gömülü çalıştırıcı hata ayrıntıları için gateway günlüklerini kontrol edin.

## Daha fazla bilgi

- [Plugins](/tr/tools/plugin)
- [Plugin aracı yazma](/tr/plugins/building-plugins#registering-agent-tools)

## Vaka çalışması: topluluk iş akışları

Herkese açık bir örnek: üç Markdown kasasını (kişisel, partner, paylaşılan) yöneten bir "ikinci beyin" CLI + Lobster işlem hatları. CLI istatistikler, gelen kutusu listeleri ve bayat taramalar için JSON üretir; Lobster bu komutları her biri onay kapılarına sahip `weekly-review`, `inbox-triage`, `memory-consolidation` ve `shared-task-sync` gibi iş akışlarına zincirler. Yapay zeka mevcut olduğunda muhakemeyi (kategorizasyon) ele alır ve olmadığında belirlenimci kurallara geri döner.

- Konu: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Depo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## İlgili

- [Otomasyon](/tr/automation) - Lobster iş akışlarını zamanlama
- [Otomasyona Genel Bakış](/tr/automation) - tüm otomasyon mekanizmaları
- [Araçlara Genel Bakış](/tr/tools) - kullanılabilir tüm aracı araçları
