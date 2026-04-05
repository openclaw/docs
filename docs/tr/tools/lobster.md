---
read_when:
    - Açık onaylarla deterministik çok adımlı iş akışları istiyorsunuz
    - Önceki adımları yeniden çalıştırmadan bir iş akışını sürdürmeniz gerekiyor
summary: Yeniden başlatılabilir onay geçitlerine sahip OpenClaw için türlendirilmiş iş akışı çalışma zamanı.
title: Lobster
x-i18n:
    generated_at: "2026-04-05T14:13:22Z"
    model: gpt-5.4
    provider: openai
    source_hash: 82718c15d571406ad6f1507de22a528fdab873edfc6aafae10742e500f6a5eda
    source_path: tools/lobster.md
    workflow: 15
---

# Lobster

Lobster, OpenClaw'un çok adımlı araç dizilerini açık onay kontrol noktalarıyla tek bir deterministik işlem olarak çalıştırmasını sağlayan bir iş akışı kabuğudur.

Lobster, ayrılmış arka plan çalışmasının bir üstünde yer alan bir yazım katmanıdır. Tek tek görevlerin üzerindeki akış düzenlemesi için [Task Flow](/tr/automation/taskflow) (`openclaw tasks flow`) bölümüne bakın. Görev etkinlik kaydı için [`openclaw tasks`](/tr/automation/tasks) bölümüne bakın.

## Kanca

Asistanınız, kendisini yöneten araçları oluşturabilir. Bir iş akışı isteyin, 30 dakika sonra tek çağrıyla çalışan bir CLI'niz ve işlem hatlarınız olur. Lobster eksik parçadır: deterministik işlem hatları, açık onaylar ve sürdürülebilir durum.

## Neden

Bugün karmaşık iş akışları birçok ileri geri araç çağrısı gerektirir. Her çağrı token maliyeti oluşturur ve LLM her adımı düzenlemek zorundadır. Lobster bu düzenlemeyi türlendirilmiş bir çalışma zamanına taşır:

- **Birçok çağrı yerine tek çağrı**: OpenClaw tek bir Lobster araç çağrısı çalıştırır ve yapılandırılmış bir sonuç alır.
- **Yerleşik onaylar**: Yan etkiler (e-posta gönderme, yorum gönderme) açıkça onaylanana kadar iş akışını durdurur.
- **Sürdürülebilir**: Durdurulan iş akışları bir token döndürür; her şeyi yeniden çalıştırmadan onaylayıp sürdürebilirsiniz.

## Düz programlar yerine neden bir DSL?

Lobster kasıtlı olarak küçüktür. Amaç "yeni bir dil" değil, birinci sınıf onaylara ve sürdürme token'larına sahip, öngörülebilir ve yapay zeka dostu bir işlem hattı tanımıdır.

- **Onaylama/sürdürme yerleşiktir**: Normal bir program bir insandan istem alabilir, ancak bu çalışma zamanını kendiniz icat etmeden dayanıklı bir token ile _duraklayıp sürdüremez_.
- **Determinism + denetlenebilirlik**: İşlem hatları veridir, bu yüzden günlüğe kaydetmek, fark almak, yeniden oynatmak ve gözden geçirmek kolaydır.
- **Yapay zeka için kısıtlı yüzey**: Küçük bir dil bilgisi + JSON aktarımı, “yaratıcı” kod yollarını azaltır ve doğrulamayı gerçekçi hale getirir.
- **Güvenlik politikası içine gömülüdür**: Zaman aşımları, çıktı sınırları, sandbox kontrolleri ve izin listeleri her betik tarafından değil, çalışma zamanı tarafından uygulanır.
- **Hâlâ programlanabilir**: Her adım herhangi bir CLI veya betiği çağırabilir. JS/TS istiyorsanız koddan `.lobster` dosyaları oluşturun.

## Nasıl çalışır

OpenClaw yerel `lobster` CLI'sini **tool mode** içinde başlatır ve stdout'tan bir JSON zarfı ayrıştırır.
İşlem hattı onay için duraklarsa, araç daha sonra devam edebilmeniz için bir `resumeToken` döndürür.

## Desen: küçük CLI + JSON aktarımı + onaylar

JSON konuşan küçük komutlar oluşturun, sonra bunları tek bir Lobster çağrısında zincirleyin. (Aşağıdaki komut adları örnektir — kendi adlarınızla değiştirin.)

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

Yapay zeka iş akışını tetikler; Lobster adımları yürütür. Onay geçitleri yan etkileri açık ve denetlenebilir tutar.

Örnek: girdi öğelerini araç çağrılarına eşleyin:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Yalnızca JSON LLM adımları (`llm-task`)

**Yapılandırılmış bir LLM adımı** gerektiren iş akışları için isteğe bağlı
`llm-task` eklenti aracını etkinleştirin ve Lobster içinden çağırın. Bu, modelle sınıflandırma/özetleme/taslak oluşturma yaparken iş akışını
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
        "tools": { "allow": ["llm-task"] }
      }
    ]
  }
}
```

Bunu bir işlem hattında kullanın:

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

Ayrıntılar ve yapılandırma seçenekleri için [LLM Task](/tr/tools/llm-task) bölümüne bakın.

## İş akışı dosyaları (.lobster)

Lobster, `name`, `args`, `steps`, `env`, `condition` ve `approval` alanlarına sahip YAML/JSON iş akışı dosyalarını çalıştırabilir. OpenClaw araç çağrılarında `pipeline` alanını dosya yoluna ayarlayın.

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
- `condition` (veya `when`), adımları `$step.approved` üzerinde koşullandırabilir.

## Lobster'ı yükleyin

Lobster CLI'yi OpenClaw Gateway'i çalıştıran **aynı ana makineye** kurun ([Lobster deposuna](https://github.com/openclaw/lobster) bakın) ve `lobster` komutunun `PATH` üzerinde olduğundan emin olun.

## Aracı etkinleştirin

Lobster, **isteğe bağlı** bir eklenti aracıdır (varsayılan olarak etkin değildir).

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

Not: izin listeleri isteğe bağlı eklentiler için katılımlıdır. İzin listeniz yalnızca
`lobster` gibi eklenti araçlarını adlandırıyorsa OpenClaw çekirdek araçları etkin tutar. Çekirdek
araçları kısıtlamak için çekirdek araçları veya istediğiniz grupları da izin listesine ekleyin.

## Örnek: E-posta sınıflandırma

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

Bir JSON zarfı döndürür (kesilmiş):

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

Bir işlem hattını tool mode içinde çalıştırın.

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

- `cwd`: İşlem hattı için göreli çalışma dizini (mevcut süreç çalışma dizini içinde kalmalıdır).
- `timeoutMs`: Alt süreç bu süreyi aşarsa sonlandırılır (varsayılan: 20000).
- `maxStdoutBytes`: stdout bu boyutu aşarsa alt süreç sonlandırılır (varsayılan: 512000).
- `argsJson`: `lobster run --args-json` komutuna geçirilen JSON dizgesi (yalnızca iş akışı dosyaları).

## Çıktı zarfı

Lobster, üç durumdan biriyle bir JSON zarfı döndürür:

- `ok` → başarıyla tamamlandı
- `needs_approval` → duraklatıldı; sürdürmek için `requiresApproval.resumeToken` gerekir
- `cancelled` → açıkça reddedildi veya iptal edildi

Araç, zarfı hem `content` içinde (güzel biçimlendirilmiş JSON) hem de `details` içinde (ham nesne) gösterir.

## Onaylar

`requiresApproval` varsa istemi inceleyin ve karar verin:

- `approve: true` → sürdür ve yan etkileri devam ettir
- `approve: false` → iptal et ve iş akışını sonlandır

Özel `jq`/heredoc yapıştırıcısı olmadan onay isteklerine bir JSON önizlemesi eklemek için `approve --preview-from-stdin --limit N` kullanın. Sürdürme token'ları artık küçüktür: Lobster iş akışı sürdürme durumunu kendi durum dizini altında saklar ve küçük bir token anahtarı geri verir.

## OpenProse

OpenProse, Lobster ile iyi eşleşir: çok ajanlı hazırlığı düzenlemek için `/prose` kullanın, ardından deterministik onaylar için bir Lobster işlem hattı çalıştırın. Bir Prose programı Lobster'a ihtiyaç duyuyorsa alt ajanlar için `lobster` aracına `tools.subagents.tools` üzerinden izin verin. Bkz. [OpenProse](/tr/prose).

## Güvenlik

- **Yalnızca yerel alt süreç** — eklentinin kendisinden ağ çağrısı yoktur.
- **Gizli bilgi yok** — Lobster OAuth yönetmez; bunu yapan OpenClaw araçlarını çağırır.
- **Sandbox farkındalığı** — araç bağlamı sandbox içine alınmışsa devre dışı bırakılır.
- **Sertleştirilmiş** — `PATH` üzerindeki sabit yürütülebilir ad (`lobster`); zaman aşımları ve çıktı sınırları uygulanır.

## Sorun giderme

- **`lobster subprocess timed out`** → `timeoutMs` değerini artırın veya uzun bir işlem hattını bölün.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` değerini artırın veya çıktı boyutunu azaltın.
- **`lobster returned invalid JSON`** → işlem hattının tool mode içinde çalıştığından ve yalnızca JSON yazdırdığından emin olun.
- **`lobster failed (code …)`** → stderr'yi incelemek için aynı işlem hattını bir terminalde çalıştırın.

## Daha fazla bilgi

- [Plugins](/tools/plugin)
- [Plugin tool authoring](/tr/plugins/building-plugins#registering-agent-tools)

## Örnek olay: topluluk iş akışları

Herkese açık bir örnek: üç Markdown kasasını (kişisel, partner, paylaşılan) yöneten bir “second brain” CLI + Lobster işlem hatları. CLI; istatistikler, gelen kutusu listeleri ve bayat taramaları için JSON üretir; Lobster ise bu komutları `weekly-review`, `inbox-triage`, `memory-consolidation` ve `shared-task-sync` gibi iş akışlarında, her biri onay geçitleriyle, zincirler. Yapay zeka mevcut olduğunda değerlendirmeyi (sınıflandırma) üstlenir, mevcut olmadığında ise deterministik kurallara geri döner.

- Başlık: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Depo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## İlgili

- [Automation & Tasks](/tr/automation) — Lobster iş akışlarını zamanlama
- [Automation Overview](/tr/automation) — tüm otomasyon mekanizmaları
- [Tools Overview](/tr/tools) — kullanılabilir tüm ajan araçları
