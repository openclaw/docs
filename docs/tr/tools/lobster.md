---
read_when:
    - Açık onaylar içeren deterministik çok adımlı iş akışları istiyorsunuz
    - İş akışını önceki adımları yeniden çalıştırmadan sürdürmeniz gerekir
summary: OpenClaw için sürdürülebilir onay kapılarıyla tiplenmiş iş akışı çalışma zamanı.
title: Istakoz
x-i18n:
    generated_at: "2026-05-07T13:27:08Z"
    model: gpt-5.5
    provider: openai
    source_hash: 859cc29bd5b91d30e9f91a5b00a06d0fcf6f80d501aaaa7a7e266a4240573927
    source_path: tools/lobster.md
    workflow: 16
---

Lobster, OpenClaw'un çok adımlı araç dizilerini açık onay kontrol noktalarıyla tek, deterministik bir işlem olarak çalıştırmasını sağlayan bir iş akışı kabuğudur.

Lobster, ayrılmış arka plan çalışmasının bir üstündeki yazma katmanıdır. Tekil görevlerin üzerindeki akış orkestrasyonu için [Görev Akışı](/tr/automation/taskflow) (`openclaw tasks flow`) bölümüne bakın. Görev etkinliği defteri için [`openclaw tasks`](/tr/automation/tasks) bölümüne bakın.

## Hook

Asistanınız kendisini yöneten araçları oluşturabilir. Bir iş akışı isteyin; 30 dakika sonra tek çağrı olarak çalışan bir CLI ve işlem hatlarınız olur. Lobster eksik parçadır: deterministik işlem hatları, açık onaylar ve sürdürülebilir durum.

## Neden

Bugün karmaşık iş akışları çok sayıda karşılıklı araç çağrısı gerektirir. Her çağrı token harcar ve LLM her adımı orkestre etmek zorundadır. Lobster bu orkestrasyonu tipli bir çalışma zamanına taşır:

- **Çok çağrı yerine tek çağrı**: OpenClaw tek bir Lobster araç çağrısı çalıştırır ve yapılandırılmış bir sonuç alır.
- **Onaylar yerleşiktir**: Yan etkiler (e-posta gönderme, yorum paylaşma) açıkça onaylanana kadar iş akışını durdurur.
- **Sürdürülebilir**: Durdurulan iş akışları bir token döndürür; her şeyi yeniden çalıştırmadan onaylayıp sürdürebilirsiniz.

## Neden düz programlar yerine bir DSL?

Lobster bilinçli olarak küçüktür. Amaç "yeni bir dil" değildir; birinci sınıf onaylara ve sürdürme token'larına sahip, öngörülebilir ve yapay zekâ dostu bir işlem hattı belirtimidir.

- **Onayla/sürdür yerleşiktir**: Normal bir program bir insandan onay isteyebilir, ancak bu çalışma zamanını kendiniz icat etmeden dayanıklı bir token ile _duraklayıp sürdüremez_.
- **Determinizm + denetlenebilirlik**: İşlem hatları veridir; bu yüzden günlüğe kaydetmesi, farkını alması, yeniden oynatması ve incelemesi kolaydır.
- **Yapay zekâ için sınırlandırılmış yüzey**: Küçük bir gramer + JSON borulama "yaratıcı" kod yollarını azaltır ve doğrulamayı gerçekçi kılar.
- **Güvenlik ilkesi yerleşiktir**: Zaman aşımları, çıktı sınırları, sandbox kontrolleri ve izin listeleri her betik tarafından değil, çalışma zamanı tarafından uygulanır.
- **Yine de programlanabilir**: Her adım herhangi bir CLI veya betik çağırabilir. JS/TS istiyorsanız, koddan `.lobster` dosyaları üretin.

## Nasıl çalışır

OpenClaw, Lobster iş akışlarını gömülü bir çalıştırıcı kullanarak **işlem içinde** çalıştırır. Harici CLI alt süreci başlatılmaz; iş akışı motoru gateway sürecinin içinde yürütülür ve doğrudan bir JSON zarfı döndürür.
İşlem hattı onay için duraklarsa, araç daha sonra devam edebilmeniz için bir `resumeToken` döndürür.

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

İşlem hattı onay isterse, token ile sürdürün:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Yapay zekâ iş akışını tetikler; Lobster adımları yürütür. Onay kapıları yan etkileri açık ve denetlenebilir tutar.

Örnek: giriş öğelerini araç çağrılarına eşleyin:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Yalnızca JSON LLM adımları (llm-task)

**Yapılandırılmış bir LLM adımı** gerektiren iş akışları için isteğe bağlı
`llm-task` Plugin aracını etkinleştirip Lobster içinden çağırın. Bu, bir modelle
sınıflandırma/özetleme/taslak oluşturma yapmanıza izin verirken iş akışını
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

### Önemli sınırlama: gömülü Lobster ve `openclaw.invoke`

Paketle gelen Lobster Plugin'i iş akışlarını gateway içinde **işlem içinde** çalıştırır. Bu gömülü modda, `openclaw.invoke` iç içe OpenClaw CLI araç çağrıları için bir gateway URL'sini/yetkilendirme bağlamını otomatik olarak devralmaz.

Bu, şu kalıbın **gömülü çalıştırıcıda şu anda güvenilir olmadığı** anlamına gelir:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{ ... }'
```

Aşağıdaki örneği yalnızca `openclaw.invoke` doğru gateway/yetkilendirme bağlamıyla zaten yapılandırılmış bir ortamda **bağımsız Lobster CLI** çalıştırırken kullanın.

Bağımsız bir Lobster CLI işlem hattında kullanın:

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

Bugün gömülü Lobster Plugin'ini kullanıyorsanız, şunlardan birini tercih edin:

- Lobster dışında doğrudan bir `llm-task` araç çağrısı veya
- desteklenen gömülü bir köprü eklenene kadar Lobster işlem hattı içinde `openclaw.invoke` olmayan adımlar.

Ayrıntılar ve yapılandırma seçenekleri için [LLM Görevi](/tr/tools/llm-task) bölümüne bakın.

## İş akışı dosyaları (.lobster)

Lobster `name`, `args`, `steps`, `env`, `condition` ve `approval` alanlarına sahip YAML/JSON iş akışı dosyalarını çalıştırabilir. OpenClaw araç çağrılarında `pipeline` değerini dosya yolu olarak ayarlayın.

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

## Lobster'ı yükleme

Paketle gelen Lobster iş akışları işlem içinde çalışır; ayrı bir `lobster` ikili dosyası gerekmez. Gömülü çalıştırıcı Lobster Plugin'i ile birlikte gelir.

Geliştirme veya harici işlem hatları için bağımsız Lobster CLI'ye ihtiyacınız varsa, [Lobster repo](https://github.com/openclaw/lobster) üzerinden yükleyin ve `lobster` öğesinin `PATH` üzerinde olduğundan emin olun.

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

Veya ajan başına:

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
İzin listeleri isteğe bağlı Plugin'ler için tercihli olarak etkinleştirilir. `alsoAllow`, normal çekirdek araç setini korurken yalnızca adlandırılmış isteğe bağlı Plugin araçlarını etkinleştirir. Çekirdek araçları kısıtlamak için istediğiniz çekirdek araçlar veya gruplarla `tools.allow` kullanın.
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

Durdurulmuş bir iş akışını onaydan sonra sürdürün.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### İsteğe bağlı girişler

- `cwd`: İşlem hattı için göreli çalışma dizini (gateway çalışma dizininin içinde kalmalıdır).
- `timeoutMs`: İş akışı bu süreyi aşarsa durdurur (varsayılan: 20000).
- `maxStdoutBytes`: Çıktı bu boyutu aşarsa iş akışını durdurur (varsayılan: 512000).
- `argsJson`: `lobster run --args-json` komutuna geçirilen JSON dizesi (yalnızca iş akışı dosyaları).

## Çıktı zarfı

Lobster üç durumdan birine sahip bir JSON zarfı döndürür:

- `ok` → başarıyla tamamlandı
- `needs_approval` → duraklatıldı; sürdürmek için `requiresApproval.resumeToken` gereklidir
- `cancelled` → açıkça reddedildi veya iptal edildi

Araç zarfı hem `content` (biçimli JSON) hem de `details` (ham nesne) içinde sunar.

## Onaylar

`requiresApproval` varsa, istemi inceleyin ve karar verin:

- `approve: true` → yan etkileri sürdürüp devam ettir
- `approve: false` → iş akışını iptal edip sonlandır

Özel jq/heredoc bağlama kodu olmadan onay isteklerine JSON önizlemesi eklemek için `approve --preview-from-stdin --limit N` kullanın. Sürdürme token'ları artık küçüktür: Lobster iş akışı sürdürme durumunu kendi durum dizini altında saklar ve küçük bir token anahtarı döndürür.

## OpenProse

OpenProse, Lobster ile iyi eşleşir: çok ajanlı hazırlığı orkestre etmek için `/prose` kullanın, ardından deterministik onaylar için bir Lobster işlem hattı çalıştırın. Bir Prose programının Lobster'a ihtiyacı varsa, alt ajanlar için `tools.subagents.tools` üzerinden `lobster` aracına izin verin. [OpenProse](/tr/prose) bölümüne bakın.

## Güvenlik

- **Yalnızca yerel işlem içi** - iş akışları gateway sürecinin içinde yürütülür; Plugin'in kendisinden ağ çağrısı yapılmaz.
- **Sır yok** - Lobster OAuth yönetmez; bunu yapan OpenClaw araçlarını çağırır.
- **Sandbox farkındalığı** - araç bağlamı sandbox içindeyken devre dışı bırakılır.
- **Güçlendirilmiş** - zaman aşımları ve çıktı sınırları gömülü çalıştırıcı tarafından uygulanır.

## Sorun giderme

- **`lobster timed out`** → `timeoutMs` değerini artırın veya uzun bir işlem hattını bölün.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` değerini artırın veya çıktı boyutunu azaltın.
- **`lobster returned invalid JSON`** → işlem hattının araç modunda çalıştığından ve yalnızca JSON yazdırdığından emin olun.
- **`lobster failed`** → gömülü çalıştırıcı hata ayrıntıları için gateway günlüklerini kontrol edin.

## Daha fazla bilgi

- [Plugin'ler](/tr/tools/plugin)
- [Plugin aracı yazma](/tr/plugins/building-plugins#registering-agent-tools)

## Vaka çalışması: topluluk iş akışları

Bir herkese açık örnek: üç Markdown kasasını (kişisel, partner, paylaşılan) yöneten bir "ikinci beyin" CLI'si + Lobster işlem hatları. CLI istatistikler, gelen kutusu listeleri ve bayat taramalar için JSON üretir; Lobster bu komutları `weekly-review`, `inbox-triage`, `memory-consolidation` ve `shared-task-sync` gibi, her biri onay kapılarına sahip iş akışlarına zincirler. Yapay zekâ mevcut olduğunda yargı gerektiren işleri (sınıflandırma) ele alır, olmadığında deterministik kurallara geri döner.

- İş parçacığı: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## İlgili

- [Otomasyon ve Görevler](/tr/automation) - Lobster iş akışlarını zamanlama
- [Otomasyona Genel Bakış](/tr/automation) - tüm otomasyon mekanizmaları
- [Araçlara Genel Bakış](/tr/tools) - tüm kullanılabilir ajan araçları
