---
read_when:
    - Açık onaylarla deterministik çok adımlı iş akışları istiyorsunuz
    - Önceki adımları yeniden çalıştırmadan bir iş akışını sürdürmeniz gerekir
summary: OpenClaw için kaldığı yerden sürdürülebilir onay geçitlerine sahip tiplendirilmiş iş akışı çalışma zamanı.
title: Istakoz
x-i18n:
    generated_at: "2026-04-30T09:49:46Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1700bcfdbcf4558cb908935834e9059221d0d26ad78ed6f9e2158f7e0b83edbd
    source_path: tools/lobster.md
    workflow: 16
---

Lobster, OpenClaw'ın çok adımlı araç dizilerini açık onay denetim noktalarıyla tek, deterministik bir işlem olarak çalıştırmasını sağlayan bir iş akışı kabuğudur.

Lobster, ayrılmış arka plan işlerinin bir üstünde yer alan bir yazma katmanıdır. Tekil görevlerin üzerindeki akış orkestrasyonu için bkz. [Görev Akışı](/tr/automation/taskflow) (`openclaw tasks flow`). Görev etkinliği defteri için bkz. [`openclaw tasks`](/tr/automation/tasks).

## Kanca

Asistanınız, kendisini yöneten araçları oluşturabilir. Bir iş akışı isteyin; 30 dakika sonra tek çağrı olarak çalışan bir CLI ve pipeline'larınız olur. Lobster eksik parçadır: deterministik pipeline'lar, açık onaylar ve sürdürülebilir durum.

## Neden

Bugün karmaşık iş akışları birçok karşılıklı araç çağrısı gerektirir. Her çağrı token maliyeti yaratır ve LLM'nin her adımı orkestre etmesi gerekir. Lobster bu orkestrasyonu tipli bir çalışma zamanına taşır:

- **Birçok çağrı yerine tek çağrı**: OpenClaw bir Lobster araç çağrısı çalıştırır ve yapılandırılmış bir sonuç alır.
- **Onaylar yerleşiktir**: Yan etkiler (e-posta gönderme, yorum paylaşma) açıkça onaylanana kadar iş akışını durdurur.
- **Sürdürülebilir**: Durdurulan iş akışları bir token döndürür; her şeyi yeniden çalıştırmadan onaylayıp sürdürebilirsiniz.

## Neden düz programlar yerine DSL?

Lobster bilinçli olarak küçüktür. Amaç "yeni bir dil" değildir; birinci sınıf onaylara ve sürdürme token'larına sahip, öngörülebilir ve yapay zeka dostu bir pipeline tanımıdır.

- **Onayla/sürdür yerleşiktir**: Normal bir program bir insana istem gösterebilir, ancak bu çalışma zamanını kendiniz icat etmeden kalıcı bir token ile _duraklatıp sürdüremez_.
- **Determinizm + denetlenebilirlik**: Pipeline'lar veridir; bu yüzden günlüğe kaydetmesi, karşılaştırması, yeniden yürütmesi ve incelemesi kolaydır.
- **Yapay zeka için kısıtlı yüzey**: Küçük bir dil bilgisi + JSON aktarımı, “yaratıcı” kod yollarını azaltır ve doğrulamayı gerçekçi hale getirir.
- **Güvenlik politikası yerleşiktir**: Zaman aşımları, çıktı sınırları, sandbox denetimleri ve izin listeleri her betik tarafından değil, çalışma zamanı tarafından uygulanır.
- **Yine de programlanabilirdir**: Her adım herhangi bir CLI veya betiği çağırabilir. JS/TS istiyorsanız koddan `.lobster` dosyaları üretin.

## Nasıl çalışır

OpenClaw, Lobster iş akışlarını gömülü bir çalıştırıcı kullanarak **süreç içinde** çalıştırır. Harici bir CLI alt süreci başlatılmaz; iş akışı motoru gateway süreci içinde yürütülür ve doğrudan bir JSON zarfı döndürür.
Pipeline onay için duraklarsa araç, daha sonra devam edebilmeniz için bir `resumeToken` döndürür.

## Kalıp: küçük CLI + JSON boruları + onaylar

JSON konuşan küçük komutlar oluşturun, sonra bunları tek bir Lobster çağrısı halinde zincirleyin. (Aşağıdaki örnek komut adlarıdır — kendi komutlarınızla değiştirin.)

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

Pipeline onay isterse token ile sürdürün:

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

Yapay zeka iş akışını tetikler; Lobster adımları yürütür. Onay kapıları yan etkileri açık ve denetlenebilir tutar.

Örnek: girdi öğelerini araç çağrılarına eşleyin:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Yalnızca JSON LLM adımları (llm-task)

**Yapılandırılmış LLM adımı** gerektiren iş akışları için isteğe bağlı
`llm-task` Plugin aracını etkinleştirin ve Lobster'dan çağırın. Bu, bir modelle
sınıflandırma/özetleme/taslak oluşturma olanağı verirken iş akışını deterministik tutar.

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
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

Bir pipeline'da kullanın:

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

Ayrıntılar ve yapılandırma seçenekleri için bkz. [LLM Görevi](/tr/tools/llm-task).

## İş akışı dosyaları (.lobster)

Lobster, `name`, `args`, `steps`, `env`, `condition` ve `approval` alanlarına sahip YAML/JSON iş akışı dosyalarını çalıştırabilir. OpenClaw araç çağrılarında `pipeline` değerini dosya yoluna ayarlayın.

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

- `stdin: $step.stdout` ve `stdin: $step.json` önceki bir adımın çıktısını aktarır.
- `condition` (veya `when`) adımları `$step.approved` üzerinde kapılayabilir.

## Lobster'ı yükleme

Paketle gelen Lobster iş akışları süreç içinde çalışır; ayrı bir `lobster` ikili dosyası gerekmez. Gömülü çalıştırıcı Lobster Plugin ile birlikte gelir.

Geliştirme veya harici pipeline'lar için bağımsız Lobster CLI gerekiyorsa, [Lobster deposundan](https://github.com/openclaw/lobster) yükleyin ve `lobster` komutunun `PATH` üzerinde olduğundan emin olun.

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

Veya ajan bazında:

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

Kısıtlayıcı izin listesi modunda çalışmayı amaçlamıyorsanız `tools.allow: ["lobster"]` kullanmaktan kaçının.

<Note>
İzin listeleri, isteğe bağlı pluginler için isteğe bağlıdır. İzin listeniz yalnızca Plugin araçlarını (`lobster` gibi) adlandırıyorsa OpenClaw çekirdek araçları etkin tutar. Çekirdek araçları kısıtlamak için izin listesine istediğiniz çekirdek araçları veya grupları da dahil edin.
</Note>

## Örnek: E-posta triajı

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

Araç modunda bir pipeline çalıştırın.

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

Onaydan sonra durdurulmuş bir iş akışını sürdürün.

```json
{
  "action": "resume",
  "token": "<resumeToken>",
  "approve": true
}
```

### İsteğe bağlı girdiler

- `cwd`: Pipeline için göreli çalışma dizini (gateway çalışma dizini içinde kalmalıdır).
- `timeoutMs`: Bu süreyi aşarsa iş akışını iptal eder (varsayılan: 20000).
- `maxStdoutBytes`: Çıktı bu boyutu aşarsa iş akışını iptal eder (varsayılan: 512000).
- `argsJson`: `lobster run --args-json` komutuna geçirilen JSON dizesi (yalnızca iş akışı dosyaları).

## Çıktı zarfı

Lobster üç durumdan birine sahip bir JSON zarfı döndürür:

- `ok` → başarıyla tamamlandı
- `needs_approval` → duraklatıldı; sürdürmek için `requiresApproval.resumeToken` gerekir
- `cancelled` → açıkça reddedildi veya iptal edildi

Araç zarfı hem `content` (güzel biçimlendirilmiş JSON) hem de `details` (ham nesne) içinde sunar.

## Onaylar

`requiresApproval` mevcutsa istemi inceleyin ve karar verin:

- `approve: true` → yan etkileri sürdür ve devam et
- `approve: false` → iş akışını iptal et ve sonlandır

Özel jq/heredoc yapıştırması olmadan onay isteklerine JSON önizlemesi eklemek için `approve --preview-from-stdin --limit N` kullanın. Sürdürme token'ları artık kompakttır: Lobster, iş akışı sürdürme durumunu kendi durum dizini altında saklar ve küçük bir token anahtarı döndürür.

## OpenProse

OpenProse, Lobster ile iyi eşleşir: çok ajanlı hazırlığı orkestre etmek için `/prose` kullanın, ardından deterministik onaylar için bir Lobster pipeline'ı çalıştırın. Bir Prose programı Lobster'a ihtiyaç duyuyorsa, `tools.subagents.tools` aracılığıyla alt ajanlar için `lobster` aracına izin verin. Bkz. [OpenProse](/tr/prose).

## Güvenlik

- **Yalnızca yerel süreç içi** — iş akışları gateway süreci içinde yürütülür; Plugin'in kendisinden ağ çağrısı yapılmaz.
- **Sır yok** — Lobster OAuth yönetmez; bunu yapan OpenClaw araçlarını çağırır.
- **Sandbox farkındadır** — araç bağlamı sandbox içindeyken devre dışı bırakılır.
- **Güçlendirilmiş** — zaman aşımları ve çıktı sınırları gömülü çalıştırıcı tarafından uygulanır.

## Sorun giderme

- **`lobster timed out`** → `timeoutMs` değerini artırın veya uzun bir pipeline'ı bölün.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` değerini yükseltin veya çıktı boyutunu azaltın.
- **`lobster returned invalid JSON`** → pipeline'ın araç modunda çalıştığından ve yalnızca JSON yazdırdığından emin olun.
- **`lobster failed`** → gömülü çalıştırıcı hata ayrıntıları için gateway günlüklerini kontrol edin.

## Daha fazla bilgi

- [Pluginler](/tr/tools/plugin)
- [Plugin aracı yazma](/tr/plugins/building-plugins#registering-agent-tools)

## Vaka çalışması: topluluk iş akışları

Herkese açık bir örnek: üç Markdown kasasını (kişisel, partner, paylaşılan) yöneten bir “ikinci beyin” CLI + Lobster pipeline'ları. CLI istatistikler, gelen kutusu listeleri ve bayat taramalar için JSON üretir; Lobster bu komutları `weekly-review`, `inbox-triage`, `memory-consolidation` ve `shared-task-sync` gibi, her biri onay kapılarına sahip iş akışları halinde zincirler. Yapay zeka mevcut olduğunda yargı gerektiren işleri (kategorilendirme) üstlenir, olmadığında deterministik kurallara geri döner.

- Konu: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Depo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## İlgili

- [Otomasyon ve Görevler](/tr/automation) — Lobster iş akışlarını zamanlama
- [Otomasyon Genel Bakış](/tr/automation) — tüm otomasyon mekanizmaları
- [Araçlara Genel Bakış](/tr/tools) — kullanılabilir tüm ajan araçları
