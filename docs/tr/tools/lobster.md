---
read_when:
    - Açık onaylara sahip deterministik çok adımlı iş akışları istiyorsunuz
    - Daha önceki adımları yeniden çalıştırmadan bir iş akışını sürdürmeniz gerekiyor
summary: OpenClaw için, devam ettirilebilir onay kapılarına sahip türlendirilmiş iş akışı çalışma zamanı.
title: Istakoz
x-i18n:
    generated_at: "2026-05-04T07:09:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: 67f5145b11f2d6e07e9d78a44a389ae5f236c85ec8c287ab0f217a18b622ece0
    source_path: tools/lobster.md
    workflow: 16
---

Lobster, OpenClaw'ın çok adımlı araç dizilerini açık onay kontrol noktalarıyla tek, deterministik bir işlem olarak çalıştırmasını sağlayan bir iş akışı kabuğudur.

Lobster, ayrılmış arka plan işinin bir üst yazım katmanıdır. Tekil görevlerin üstündeki akış orkestrasyonu için [Görev Akışı](/tr/automation/taskflow) (`openclaw tasks flow`) bölümüne bakın. Görev etkinliği defteri için [`openclaw tasks`](/tr/automation/tasks) bölümüne bakın.

## Kanca

Asistanınız kendisini yöneten araçları oluşturabilir. Bir iş akışı isteyin; 30 dakika sonra tek çağrı olarak çalışan bir CLI ve işlem hatlarınız olsun. Lobster eksik parçadır: deterministik işlem hatları, açık onaylar ve sürdürülebilir durum.

## Neden

Bugün karmaşık iş akışları çok sayıda karşılıklı araç çağrısı gerektirir. Her çağrı token maliyeti oluşturur ve LLM her adımı orkestre etmek zorunda kalır. Lobster bu orkestrasyonu tiplendirilmiş bir çalışma zamanına taşır:

- **Çok sayıda çağrı yerine tek çağrı**: OpenClaw tek bir Lobster araç çağrısı çalıştırır ve yapılandırılmış bir sonuç alır.
- **Onaylar yerleşiktir**: Yan etkiler (e-posta gönderme, yorum yayınlama) açıkça onaylanana kadar iş akışını durdurur.
- **Sürdürülebilir**: Durdurulan iş akışları bir token döndürür; her şeyi yeniden çalıştırmadan onaylayıp devam edin.

## Düz programlar yerine neden bir DSL?

Lobster bilinçli olarak küçüktür. Amaç "yeni bir dil" değildir; birinci sınıf onaylara ve sürdürme token'larına sahip, öngörülebilir ve AI dostu bir işlem hattı tanımıdır.

- **Onaylama/sürdürme yerleşiktir**: Normal bir program bir insana soru sorabilir, ancak bu çalışma zamanını kendiniz icat etmeden kalıcı bir token ile _duraklatıp sürdüremez_.
- **Determinizm + denetlenebilirlik**: İşlem hatları veridir; bu yüzden günlüklemek, fark almak, yeniden oynatmak ve gözden geçirmek kolaydır.
- **AI için sınırlandırılmış yüzey**: Küçük bir dil bilgisi + JSON borulama, “yaratıcı” kod yollarını azaltır ve doğrulamayı gerçekçi kılar.
- **Güvenlik politikası yerleşiktir**: Zaman aşımları, çıktı sınırları, sandbox denetimleri ve izin listeleri her betik tarafından değil, çalışma zamanı tarafından uygulanır.
- **Yine de programlanabilir**: Her adım herhangi bir CLI veya betiği çağırabilir. JS/TS istiyorsanız `.lobster` dosyalarını koddan üretin.

## Nasıl çalışır

OpenClaw, Lobster iş akışlarını gömülü bir çalıştırıcı kullanarak **süreç içinde** çalıştırır. Harici bir CLI alt süreci başlatılmaz; iş akışı motoru Gateway sürecinin içinde yürütülür ve doğrudan bir JSON zarfı döndürür.
İşlem hattı onay için duraklarsa araç, daha sonra devam edebilmeniz için bir `resumeToken` döndürür.

## Kalıp: küçük CLI + JSON boruları + onaylar

JSON konuşan küçük komutlar oluşturun, sonra bunları tek bir Lobster çağrısında zincirleyin. (Aşağıdaki örnek komut adlarını kendi komutlarınızla değiştirin.)

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

AI iş akışını tetikler; Lobster adımları yürütür. Onay kapıları yan etkileri açık ve denetlenebilir tutar.

Örnek: girdi öğelerini araç çağrılarına eşleyin:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Yalnızca JSON LLM adımları (llm-task)

**Yapılandırılmış bir LLM adımı** gerektiren iş akışları için isteğe bağlı
`llm-task` Plugin aracını etkinleştirin ve Lobster'dan çağırın. Bu, bir modelle sınıflandırma/özetleme/taslak hazırlamaya izin verirken iş akışını
deterministik tutar.

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

Bir işlem hattında kullanın:

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

Ayrıntılar ve yapılandırma seçenekleri için [LLM Görevi](/tr/tools/llm-task) bölümüne bakın.

## İş akışı dosyaları (.lobster)

Lobster `name`, `args`, `steps`, `env`, `condition` ve `approval` alanlarına sahip YAML/JSON iş akışı dosyalarını çalıştırabilir. OpenClaw araç çağrılarında `pipeline` değerini dosya yoluna ayarlayın.

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
- `condition` (veya `when`) adımları `$step.approved` üzerinde kapılayabilir.

## Lobster'ı kurun

Paketli Lobster iş akışları süreç içinde çalışır; ayrı bir `lobster` ikilisi gerekmez. Gömülü çalıştırıcı Lobster Plugin ile birlikte gelir.

Geliştirme veya harici işlem hatları için bağımsız Lobster CLI gerekiyorsa, [Lobster repo](https://github.com/openclaw/lobster) üzerinden kurun ve `lobster` öğesinin `PATH` üzerinde olduğundan emin olun.

## Aracı etkinleştirin

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

Kısıtlayıcı izin listesi modunda çalıştırmayı amaçlamadıkça `tools.allow: ["lobster"]` kullanmaktan kaçının.

<Note>
İzin listeleri isteğe bağlı plugin'ler için isteğe bağlıdır. `alsoAllow`, normal çekirdek araç kümesini korurken yalnızca adlandırılmış isteğe bağlı Plugin araçlarını etkinleştirir. Çekirdek araçları kısıtlamak için istediğiniz çekirdek araçlar veya gruplarla `tools.allow` kullanın.
</Note>

## Örnek: E-posta triyajı

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

Tek iş akışı. Deterministik. Güvenli.

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

### İsteğe bağlı girdiler

- `cwd`: İşlem hattı için göreli çalışma dizini (Gateway çalışma dizininin içinde kalmalıdır).
- `timeoutMs`: Bu süreyi aşarsa iş akışını durdurur (varsayılan: 20000).
- `maxStdoutBytes`: Çıktı bu boyutu aşarsa iş akışını durdurur (varsayılan: 512000).
- `argsJson`: `lobster run --args-json` öğesine geçirilen JSON dizesi (yalnızca iş akışı dosyaları).

## Çıktı zarfı

Lobster, üç durumdan birine sahip bir JSON zarfı döndürür:

- `ok` → başarıyla tamamlandı
- `needs_approval` → duraklatıldı; sürdürmek için `requiresApproval.resumeToken` gereklidir
- `cancelled` → açıkça reddedildi veya iptal edildi

Araç, zarfı hem `content` (güzel biçimlendirilmiş JSON) hem de `details` (ham nesne) içinde gösterir.

## Onaylar

`requiresApproval` varsa istemi inceleyin ve karar verin:

- `approve: true` → yan etkileri sürdür ve devam et
- `approve: false` → iş akışını iptal et ve sonlandır

Özel jq/heredoc yapıştırıcısı olmadan onay isteklerine bir JSON önizlemesi eklemek için `approve --preview-from-stdin --limit N` kullanın. Sürdürme token'ları artık kompakttır: Lobster iş akışı sürdürme durumunu kendi durum dizini altında saklar ve küçük bir token anahtarı geri verir.

## OpenProse

OpenProse, Lobster ile iyi eşleşir: çok aracı hazırlığı orkestre etmek için `/prose` kullanın, ardından deterministik onaylar için bir Lobster işlem hattı çalıştırın. Bir Prose programının Lobster'a ihtiyacı varsa `tools.subagents.tools` aracılığıyla alt aracılar için `lobster` aracına izin verin. [OpenProse](/tr/prose) bölümüne bakın.

## Güvenlik

- **Yalnızca yerel süreç içi** — iş akışları Gateway sürecinin içinde yürütülür; Plugin kendisi ağ çağrısı yapmaz.
- **Gizli yok** — Lobster OAuth yönetmez; bunu yapan OpenClaw araçlarını çağırır.
- **Sandbox farkındalığı** — araç bağlamı sandbox içindeyken devre dışı bırakılır.
- **Sertleştirilmiş** — zaman aşımları ve çıktı sınırları gömülü çalıştırıcı tarafından uygulanır.

## Sorun giderme

- **`lobster timed out`** → `timeoutMs` değerini artırın veya uzun bir işlem hattını bölün.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` değerini yükseltin veya çıktı boyutunu azaltın.
- **`lobster returned invalid JSON`** → işlem hattının araç modunda çalıştığından ve yalnızca JSON yazdırdığından emin olun.
- **`lobster failed`** → gömülü çalıştırıcı hata ayrıntıları için Gateway günlüklerini kontrol edin.

## Daha fazla bilgi

- [Plugin'ler](/tr/tools/plugin)
- [Plugin aracı yazımı](/tr/plugins/building-plugins#registering-agent-tools)

## Vaka çalışması: topluluk iş akışları

Herkese açık bir örnek: üç Markdown kasasını (kişisel, eş, paylaşılan) yöneten bir “ikinci beyin” CLI + Lobster işlem hatları. CLI; istatistikler, gelen kutusu listeleri ve eski taramalar için JSON yayar; Lobster bu komutları `weekly-review`, `inbox-triage`, `memory-consolidation` ve `shared-task-sync` gibi, her biri onay kapılarına sahip iş akışlarına zincirler. AI mevcut olduğunda muhakemeyi (sınıflandırma) üstlenir, olmadığında deterministik kurallara geri döner.

- Konu: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — Lobster iş akışlarını zamanlama
- [Otomasyona Genel Bakış](/tr/automation) — tüm otomasyon mekanizmaları
- [Araçlara Genel Bakış](/tr/tools) — kullanılabilir tüm aracı araçları
