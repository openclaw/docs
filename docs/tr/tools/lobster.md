---
read_when:
    - Açık onaylarla deterministik çok adımlı iş akışları istiyorsunuz
    - Önceki adımları yeniden çalıştırmadan bir iş akışını sürdürmeniz gerekir
summary: Devam ettirilebilir onay kapılarıyla OpenClaw için tipli iş akışı çalışma zamanı.
title: Istakoz
x-i18n:
    generated_at: "2026-05-06T09:34:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: a6da8c7ca213dd4e9f85bcedabdb74da172bd3d82eceaf2c001f1a2692b01ca8
    source_path: tools/lobster.md
    workflow: 16
---

Lobster, OpenClaw'ın çok adımlı araç dizilerini açık onay kontrol noktalarıyla tek, deterministik bir işlem olarak çalıştırmasını sağlayan bir iş akışı kabuğudur.

Lobster, ayrılmış arka plan çalışmalarının üzerinde yer alan bir yazma katmanıdır. Tekil görevlerin üzerindeki akış orkestrasyonu için [Görev Akışı](/tr/automation/taskflow) (`openclaw tasks flow`) bölümüne bakın. Görev etkinliği defteri için [`openclaw tasks`](/tr/automation/tasks) bölümüne bakın.

## Kanca

Asistanınız kendisini yöneten araçları oluşturabilir. Bir iş akışı isteyin; 30 dakika sonra tek çağrı olarak çalışan bir CLI ve işlem hatlarına sahip olursunuz. Lobster eksik parçadır: deterministik işlem hatları, açık onaylar ve sürdürülebilir durum.

## Neden

Günümüzde karmaşık iş akışları çok sayıda karşılıklı araç çağrısı gerektirir. Her çağrı token maliyeti yaratır ve LLM'in her adımı orkestre etmesi gerekir. Lobster bu orkestrasyonu tipli bir çalışma zamanına taşır:

- **Çok çağrı yerine tek çağrı**: OpenClaw tek bir Lobster araç çağrısı çalıştırır ve yapılandırılmış bir sonuç alır.
- **Onaylar yerleşik**: Yan etkiler (e-posta gönderme, yorum paylaşma) açıkça onaylanana kadar iş akışını durdurur.
- **Sürdürülebilir**: Durdurulan iş akışları bir token döndürür; onaylayıp her şeyi yeniden çalıştırmadan devam edebilirsiniz.

## Neden düz programlar yerine bir DSL?

Lobster bilinçli olarak küçüktür. Amaç "yeni bir dil" değil, birinci sınıf onaylara ve devam token'larına sahip öngörülebilir, yapay zeka dostu bir işlem hattı belirtimidir.

- **Onayla/devam et yerleşiktir**: Normal bir program bir insandan istemde bulunabilir, ancak bu çalışma zamanını kendiniz icat etmeden dayanıklı bir token ile _duraklatıp devam edemez_.
- **Determinizm + denetlenebilirlik**: İşlem hatları veridir; bu nedenle günlüğe kaydetmesi, farkını alması, yeniden yürütmesi ve gözden geçirmesi kolaydır.
- **Yapay zeka için sınırlı yüzey**: Küçük bir gramer + JSON borulama "yaratıcı" kod yollarını azaltır ve doğrulamayı gerçekçi kılar.
- **Güvenlik politikası yerleşiktir**: Zaman aşımları, çıktı sınırları, sandbox kontrolleri ve izin listeleri her betik tarafından değil, çalışma zamanı tarafından uygulanır.
- **Yine de programlanabilir**: Her adım herhangi bir CLI veya betik çağırabilir. JS/TS istiyorsanız, koddan `.lobster` dosyaları üretin.

## Nasıl çalışır?

OpenClaw, Lobster iş akışlarını gömülü bir çalıştırıcı kullanarak **süreç içinde** çalıştırır. Harici CLI alt süreci başlatılmaz; iş akışı motoru gateway sürecinin içinde yürütülür ve doğrudan bir JSON zarfı döndürür.
İşlem hattı onay için duraklarsa, araç daha sonra devam edebilmeniz için bir `resumeToken` döndürür.

## Kalıp: küçük CLI + JSON boruları + onaylar

JSON konuşan küçük komutlar oluşturun, ardından bunları tek bir Lobster çağrısında zincirleyin. (Aşağıdaki örnek komut adlarını kendi komutlarınızla değiştirin.)

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

İşlem hattı onay isterse, token ile devam edin:

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

**Yapılandırılmış bir LLM adımı** gerektiren iş akışları için isteğe bağlı
`llm-task` Plugin aracını etkinleştirin ve Lobster'dan çağırın. Bu, bir modelle sınıflandırma/özetleme/taslak oluşturma olanağı sunarken iş akışını
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

- `stdin: $step.stdout` ve `stdin: $step.json` önceki bir adımın çıktısını iletir.
- `condition` (veya `when`) adımları `$step.approved` üzerinden kapılayabilir.

## Lobster'ı yükleme

Paketle gelen Lobster iş akışları süreç içinde çalışır; ayrı bir `lobster` ikili dosyası gerekmez. Gömülü çalıştırıcı Lobster Plugin'i ile birlikte gelir.

Geliştirme veya harici işlem hatları için bağımsız Lobster CLI'ye ihtiyacınız varsa, [Lobster deposundan](https://github.com/openclaw/lobster) yükleyin ve `lobster` öğesinin `PATH` üzerinde olduğundan emin olun.

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

Kısıtlayıcı izin listesi modunda çalıştırmayı amaçlamıyorsanız `tools.allow: ["lobster"]` kullanmaktan kaçının.

<Note>
İzin listeleri isteğe bağlı Plugin'ler için seçimlidir. `alsoAllow`, normal çekirdek araç kümesini korurken yalnızca adı verilen isteğe bağlı Plugin araçlarını etkinleştirir. Çekirdek araçları kısıtlamak için istediğiniz çekirdek araçlar veya gruplarla `tools.allow` kullanın.
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

Kullanıcı onaylar → devam eder:

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

### İsteğe bağlı girişler

- `cwd`: İşlem hattı için göreli çalışma dizini (gateway çalışma dizini içinde kalmalıdır).
- `timeoutMs`: Bu süreyi aşarsa iş akışını iptal et (varsayılan: 20000).
- `maxStdoutBytes`: Çıktı bu boyutu aşarsa iş akışını iptal et (varsayılan: 512000).
- `argsJson`: `lobster run --args-json` öğesine geçirilen JSON dizesi (yalnızca iş akışı dosyaları).

## Çıktı zarfı

Lobster, üç durumdan birine sahip bir JSON zarfı döndürür:

- `ok` → başarıyla tamamlandı
- `needs_approval` → duraklatıldı; devam etmek için `requiresApproval.resumeToken` gerekir
- `cancelled` → açıkça reddedildi veya iptal edildi

Araç zarfı hem `content` (güzel biçimlendirilmiş JSON) hem de `details` (ham nesne) içinde sunar.

## Onaylar

`requiresApproval` varsa, istemi inceleyin ve karar verin:

- `approve: true` → devam et ve yan etkileri sürdür
- `approve: false` → iş akışını iptal et ve sonlandır

Özel jq/heredoc bağlayıcısı olmadan onay isteklerine JSON önizlemesi eklemek için `approve --preview-from-stdin --limit N` kullanın. Devam token'ları artık kompakttır: Lobster, iş akışı devam durumunu kendi durum dizini altında saklar ve küçük bir token anahtarı döndürür.

## OpenProse

OpenProse, Lobster ile iyi eşleşir: çok ajanlı hazırlığı orkestre etmek için `/prose` kullanın, ardından deterministik onaylar için bir Lobster işlem hattı çalıştırın. Bir Prose programının Lobster'a ihtiyacı varsa, alt ajanlar için `lobster` aracına `tools.subagents.tools` üzerinden izin verin. [OpenProse](/tr/prose) bölümüne bakın.

## Güvenlik

- **Yalnızca yerel süreç içi** - iş akışları gateway süreci içinde yürütülür; Plugin'in kendisinden ağ çağrısı yapılmaz.
- **Gizli bilgi yok** - Lobster OAuth yönetmez; bunu yapan OpenClaw araçlarını çağırır.
- **Sandbox farkındalığı** - araç bağlamı sandbox içindeyken devre dışıdır.
- **Sertleştirilmiş** - zaman aşımları ve çıktı sınırları gömülü çalıştırıcı tarafından uygulanır.

## Sorun giderme

- **`lobster timed out`** → `timeoutMs` değerini artırın veya uzun bir işlem hattını bölün.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` değerini yükseltin veya çıktı boyutunu azaltın.
- **`lobster returned invalid JSON`** → işlem hattının araç modunda çalıştığından ve yalnızca JSON yazdırdığından emin olun.
- **`lobster failed`** → gömülü çalıştırıcı hata ayrıntıları için gateway günlüklerini kontrol edin.

## Daha fazla bilgi

- [Plugin'ler](/tr/tools/plugin)
- [Plugin aracı yazma](/tr/plugins/building-plugins#registering-agent-tools)

## Vaka incelemesi: topluluk iş akışları

Herkese açık bir örnek: üç Markdown kasasını (kişisel, partner, paylaşılan) yöneten bir "ikinci beyin" CLI + Lobster işlem hatları. CLI; istatistikler, gelen kutusu listeleri ve eskimiş taramalar için JSON üretir; Lobster bu komutları `weekly-review`, `inbox-triage`, `memory-consolidation` ve `shared-task-sync` gibi, her biri onay kapılarına sahip iş akışlarında zincirler. Yapay zeka mevcut olduğunda yargı gerektiren işleri (sınıflandırma) üstlenir, mevcut olmadığında deterministik kurallara geri döner.

- Konu: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Depo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## İlgili

- [Otomasyon ve Görevler](/tr/automation) - Lobster iş akışlarını zamanlama
- [Otomasyon Genel Bakış](/tr/automation) - tüm otomasyon mekanizmaları
- [Araçlara Genel Bakış](/tr/tools) - kullanılabilir tüm ajan araçları
