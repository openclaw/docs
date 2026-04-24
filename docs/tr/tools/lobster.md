---
read_when:
    - Açık onaylarla deterministik çok adımlı iş akışları istiyorsunuz
    - Bir iş akışını önceki adımları yeniden çalıştırmadan sürdürmeniz gerekiyor
summary: Yeniden başlatılabilir onay geçitleriyle OpenClaw için türlendirilmiş iş akışı çalışma zamanı.
title: Yeniden başlatılabilir onay geçitleriyle OpenClaw için türlendirilmiş iş akışı çalışma zamanı.
x-i18n:
    generated_at: "2026-04-24T09:36:14Z"
    model: gpt-5.4
    provider: openai
    source_hash: ce1dbd73cc90091d02862af183a2f8658d6cbe6623c100baf7992b5e18041edb
    source_path: tools/lobster.md
    workflow: 15
---

Lobster, OpenClaw'ın çok adımlı araç dizilerini açık onay kontrol noktalarıyla tek, deterministik bir işlem olarak çalıştırmasını sağlayan bir iş akışı kabuğudur.

Lobster, ayrılmış arka plan işlerinin bir üstünde yer alan bir yazım katmanıdır. Tekil görevlerin üzerindeki akış orkestrasyonu için bkz. [Task Flow](/tr/automation/taskflow) (`openclaw tasks flow`). Görev etkinlik kaydı için bkz. [`openclaw tasks`](/tr/automation/tasks).

## Kanca

Asistanınız kendini yöneten araçları oluşturabilir. Bir iş akışı isteyin, 30 dakika sonra tek çağrı olarak çalışan bir CLI'niz ve işlem hatlarınız olsun. Lobster eksik parçadır: deterministik işlem hatları, açık onaylar ve sürdürülebilir durum.

## Neden

Bugün karmaşık iş akışları çok sayıda ileri-geri araç çağrısı gerektirir. Her çağrı token maliyeti getirir ve LLM her adımı orkestre etmek zorundadır. Lobster bu orkestrasyonu türlendirilmiş bir çalışma zamanına taşır:

- **Birçok çağrı yerine tek çağrı**: OpenClaw tek bir Lobster araç çağrısı çalıştırır ve yapılandırılmış bir sonuç alır.
- **Yerleşik onaylar**: Yan etkiler (e-posta gönderme, yorum yayımlama) açıkça onaylanana kadar iş akışını durdurur.
- **Sürdürülebilir**: Duraklatılmış iş akışları bir token döndürür; her şeyi yeniden çalıştırmadan onaylayıp sürdürebilirsiniz.

## Düz programlar yerine neden bir DSL?

Lobster bilerek küçüktür. Amaç "yeni bir dil" değil; birinci sınıf onaylar ve sürdürme token'larıyla öngörülebilir, yapay zekâ dostu bir işlem hattı belirtimidir.

- **Approve/resume yerleşiktir**: Normal bir program bir insandan onay isteyebilir, ancak bu çalışma zamanını kendiniz icat etmeden dayanıklı bir token ile _duraklayıp sürdüremez_.
- **Deterministiklik + denetlenebilirlik**: İşlem hatları veridir; bu yüzden günlüğe almak, diff'lemek, yeniden oynatmak ve gözden geçirmek kolaydır.
- **Yapay zekâ için sınırlı yüzey**: Küçük bir dil bilgisi + JSON borulama, "yaratıcı" kod yollarını azaltır ve doğrulamayı gerçekçi kılar.
- **Güvenlik ilkesi gömülüdür**: Zaman aşımları, çıktı sınırları, sandbox denetimleri ve allowlist'ler her betik tarafından değil, çalışma zamanı tarafından uygulanır.
- **Yine de programlanabilir**: Her adım herhangi bir CLI veya betiği çağırabilir. JS/TS istiyorsanız `.lobster` dosyalarını koddan üretin.

## Nasıl çalışır

OpenClaw, Lobster iş akışlarını **süreç içinde** gömülü bir çalıştırıcı kullanarak çalıştırır. Harici bir CLI alt süreci başlatılmaz; iş akışı motoru Gateway işlemi içinde yürütülür ve doğrudan bir JSON zarfı döndürür.
İşlem hattı onay için duraklarsa araç, daha sonra devam edebilmeniz için bir `resumeToken` döndürür.

## Desen: küçük CLI + JSON boruları + onaylar

JSON konuşan küçük komutlar oluşturun, sonra bunları tek bir Lobster çağrısında zincirleyin. (Aşağıdaki komut adları örnektir — kendinizinkilerle değiştirin.)

```bash
inbox list --json
inbox categorize --json
inbox apply --json
```

```json
{
  "action": "run",
  "pipeline": "exec --json --shell 'inbox list --json' | exec --stdin json --shell 'inbox categorize --json' | exec --stdin json --shell 'inbox apply --json' | approve --preview-from-stdin --limit 5 --prompt 'Değişiklikler uygulansın mı?'",
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

Yapay zekâ iş akışını tetikler; Lobster adımları yürütür. Onay geçitleri yan etkileri açık ve denetlenebilir tutar.

Örnek: girdi öğelerini araç çağrılarına eşleyin:

```bash
gog.gmail.search --query 'newer_than:1d' \
  | openclaw.invoke --tool message --action send --each --item-key message --args-json '{"provider":"telegram","to":"..."}'
```

## Yalnızca JSON LLM adımları (`llm-task`)

**Yapılandırılmış bir LLM adımına** ihtiyaç duyan iş akışları için isteğe bağlı
`llm-task` Plugin aracını etkinleştirin ve Lobster içinden çağırın. Bu, iş akışını
deterministik tutarken yine de bir modelle sınıflandırma/özetleme/taslak oluşturma yapmanızı sağlar.

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

Bir işlem hattında kullanın:

```lobster
openclaw.invoke --tool llm-task --action json --args-json '{
  "prompt": "Verilen e-postaya göre intent ve taslak döndür.",
  "thinking": "low",
  "input": { "subject": "Merhaba", "body": "Yardımcı olabilir misin?" },
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

Ayrıntılar ve yapılandırma seçenekleri için bkz. [LLM Task](/tr/tools/llm-task).

## İş akışı dosyaları (`.lobster`)

Lobster; `name`, `args`, `steps`, `env`, `condition` ve `approval` alanlarına sahip YAML/JSON iş akışı dosyalarını çalıştırabilir. OpenClaw araç çağrılarında `pipeline` değerini dosya yolu olarak ayarlayın.

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

- `stdin: $step.stdout` ve `stdin: $step.json`, önceki adımın çıktısını geçirir.
- `condition` (veya `when`), adımları `$step.approved` üzerinde geçitleyebilir.

## Lobster'ı kurun

Paketlenmiş Lobster iş akışları süreç içinde çalışır; ayrı bir `lobster` ikili dosyası gerekmez. Gömülü çalıştırıcı, Lobster Plugin'iyle birlikte gelir.

Geliştirme veya harici işlem hatları için bağımsız Lobster CLI'ye ihtiyacınız varsa onu [Lobster repo](https://github.com/openclaw/lobster) üzerinden kurun ve `lobster` komutunun `PATH` üzerinde olduğundan emin olun.

## Aracı etkinleştirin

Lobster **isteğe bağlı** bir Plugin aracıdır (varsayılan olarak etkin değildir).

Önerilen yöntem (eklemeli, güvenli):

```json
{
  "tools": {
    "alsoAllow": ["lobster"]
  }
}
```

Veya agent başına:

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

Kısıtlayıcı allowlist modunda çalışmak istemiyorsanız `tools.allow: ["lobster"]` kullanmaktan kaçının.

Not: allowlist'ler isteğe bağlı Plugin'ler için isteğe bağlı katılımlıdır. Allowlist'iniz yalnızca
`lobster` gibi Plugin araçlarını adlandırıyorsa OpenClaw çekirdek araçları etkin tutar. Çekirdek
araçları kısıtlamak için, istediğiniz çekirdek araçları veya grupları allowlist'e siz de ekleyin.

## Örnek: E-posta triyajı

Lobster olmadan:

```
Kullanıcı: "E-postamı kontrol et ve yanıt taslakları hazırla"
→ openclaw gmail.list çağırır
→ LLM özetler
→ Kullanıcı: "#2 ve #5 için yanıt taslakları hazırla"
→ LLM taslakları hazırlar
→ Kullanıcı: "#2'yi gönder"
→ openclaw gmail.send çağırır
(tekrar her gün, neyin triyaj edildiğine dair bellek yok)
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
  "output": [{ "summary": "5 tanesi yanıt gerektiriyor, 2 tanesi eylem gerektiriyor" }],
  "requiresApproval": {
    "type": "approval_request",
    "prompt": "2 taslak yanıt gönderilsin mi?",
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

Araç modunda bir işlem hattı çalıştırın.

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

- `cwd`: İşlem hattı için göreli çalışma dizini (Gateway çalışma dizini içinde kalmalıdır).
- `timeoutMs`: İş akışı bu süreyi aşarsa iptal edilir (varsayılan: 20000).
- `maxStdoutBytes`: Çıktı bu boyutu aşarsa iş akışı iptal edilir (varsayılan: 512000).
- `argsJson`: `lobster run --args-json` komutuna geçirilen JSON dizesi (yalnızca iş akışı dosyaları).

## Çıktı zarfı

Lobster, üç durumdan biriyle bir JSON zarfı döndürür:

- `ok` → başarıyla tamamlandı
- `needs_approval` → duraklatıldı; sürdürmek için `requiresApproval.resumeToken` gerekir
- `cancelled` → açıkça reddedildi veya iptal edildi

Araç zarfı hem `content` içinde (güzel biçimlendirilmiş JSON) hem de `details` içinde (ham nesne) gösterir.

## Onaylar

`requiresApproval` varsa istemi inceleyin ve karar verin:

- `approve: true` → sürdür ve yan etkilere devam et
- `approve: false` → iş akışını iptal et ve sonlandır

Özel `jq`/heredoc yapıştırıcıları olmadan JSON önizlemesini onay isteklerine eklemek için `approve --preview-from-stdin --limit N` kullanın. Sürdürme token'ları artık küçüktür: Lobster iş akışı sürdürme durumunu kendi state dizininde saklar ve geri küçük bir token anahtarı verir.

## OpenProse

OpenProse, Lobster ile iyi eşleşir: çok agent'lı hazırlığı orkestre etmek için `/prose` kullanın, ardından deterministik onaylar için bir Lobster işlem hattısı çalıştırın. Bir Prose programının Lobster'a ihtiyacı varsa alt agent'lar için `tools.subagents.tools` üzerinden `lobster` aracına izin verin. Bkz. [OpenProse](/tr/prose).

## Güvenlik

- **Yalnızca yerel süreç içi** — iş akışları Gateway işlemi içinde yürütülür; Plugin'in kendisinden ağ çağrısı yapılmaz.
- **Secret yok** — Lobster OAuth yönetmez; bunu yapan OpenClaw araçlarını çağırır.
- **Sandbox farkındalığı** — araç bağlamı sandbox içindeyken devre dışıdır.
- **Sertleştirilmiş** — zaman aşımları ve çıktı sınırları gömülü çalıştırıcı tarafından uygulanır.

## Sorun giderme

- **`lobster timed out`** → `timeoutMs` değerini artırın veya uzun bir işlem hattını bölün.
- **`lobster output exceeded maxStdoutBytes`** → `maxStdoutBytes` değerini artırın veya çıktı boyutunu küçültün.
- **`lobster returned invalid JSON`** → işlem hattının araç modunda çalıştığından ve yalnızca JSON yazdırdığından emin olun.
- **`lobster failed`** → gömülü çalıştırıcı hata ayrıntıları için Gateway günlüklerini kontrol edin.

## Daha fazlasını öğrenin

- [Plugin'ler](/tr/tools/plugin)
- [Plugin aracı yazımı](/tr/plugins/building-plugins#registering-agent-tools)

## Vaka çalışması: topluluk iş akışları

Genel bir örnek: üç Markdown kasasını (kişisel, partner, paylaşılan) yöneten “ikinci beyin” CLI + Lobster işlem hatları. CLI; istatistikler, gelen kutusu listeleri ve bayat taramalar için JSON üretir; Lobster ise bu komutları `weekly-review`, `inbox-triage`, `memory-consolidation` ve `shared-task-sync` gibi, her biri onay geçitlerine sahip iş akışlarında zincirler. Yapay zekâ, mümkün olduğunda yargıyı (sınıflandırma) üstlenir; mümkün olmadığında deterministik kurallara geri döner.

- Konu: [https://x.com/plattenschieber/status/2014508656335770033](https://x.com/plattenschieber/status/2014508656335770033)
- Repo: [https://github.com/bloomedai/brain-cli](https://github.com/bloomedai/brain-cli)

## İlgili

- [Automation & Tasks](/tr/automation) — Lobster iş akışlarını zamanlama
- [Automation Overview](/tr/automation) — tüm otomasyon mekanizmaları
- [Tools Overview](/tr/tools) — kullanılabilir tüm agent araçları
