---
read_when:
    - Görev başına istem gerektirmeden çalışan otonom ajan iş akışlarını kurma
    - Ajanın bağımsız olarak neler yapabileceğini ve nelerin insan onayı gerektirdiğini tanımlama
    - Net sınırlar ve yükseltme kurallarıyla çok programlı ajanları yapılandırma
summary: Otonom ajan programları için kalıcı çalışma yetkisini tanımlayın
title: Sürekli talimatlar
x-i18n:
    generated_at: "2026-04-30T09:05:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: ff895378cbd53f7e8058137389037ab40201ce2cdfb34c135f480dfef775919b
    source_path: automation/standing-orders.md
    workflow: 16
---

Sürekli talimatlar, tanımlı programlar için ajanınıza **kalıcı çalışma yetkisi** verir. Her seferinde tek tek görev talimatları vermek yerine, net kapsam, tetikleyiciler ve eskalasyon kuralları olan programlar tanımlarsınız; ajan da bu sınırlar içinde otonom olarak yürütür.

Bu, asistanınıza her cuma "haftalık raporu gönder" demek ile sürekli yetki vermek arasındaki farktır: "Haftalık rapor senden sorumlu. Her cuma derle, gönder ve yalnızca bir şey yanlış görünüyorsa eskale et."

## Neden sürekli talimatlar

**Sürekli talimatlar olmadan:**

- Her görev için ajanı yönlendirmeniz gerekir
- Ajan istekler arasında boşta kalır
- Rutin işler unutulur veya gecikir
- Darboğaz siz olursunuz

**Sürekli talimatlarla:**

- Ajan, tanımlı sınırlar içinde otonom olarak yürütür
- Rutin işler yönlendirme olmadan zamanında gerçekleşir
- Siz yalnızca istisnalar ve onaylar için dahil olursunuz
- Ajan boş zamanı verimli şekilde değerlendirir

## Nasıl çalışırlar

Sürekli talimatlar [ajan çalışma alanı](/tr/concepts/agent-workspace) dosyalarınızda tanımlanır. Önerilen yaklaşım, bunları doğrudan `AGENTS.md` içine eklemektir (`AGENTS.md` her oturuma otomatik olarak enjekte edilir); böylece ajan bunları her zaman bağlamında bulundurur. Daha büyük yapılandırmalar için bunları `standing-orders.md` gibi özel bir dosyaya da koyabilir ve `AGENTS.md` içinden buna başvurabilirsiniz.

Her program şunları belirtir:

1. **Kapsam** — ajanın ne yapmaya yetkili olduğu
2. **Tetikleyiciler** — ne zaman yürütüleceği (zamanlama, olay veya koşul)
3. **Onay kapıları** — eyleme geçmeden önce nelerin insan onayı gerektirdiği
4. **Eskalasyon kuralları** — ne zaman durup yardım isteneceği

Ajan bu talimatları her oturumda çalışma alanı önyükleme dosyaları aracılığıyla yükler (otomatik enjekte edilen dosyaların tam listesi için bkz. [Ajan Çalışma Alanı](/tr/concepts/agent-workspace)) ve zaman tabanlı uygulama için [Cron işleri](/tr/automation/cron-jobs) ile birlikte bunlara göre yürütür.

<Tip>
Her oturumda yüklendiklerini garanti etmek için sürekli talimatları `AGENTS.md` içine koyun. Çalışma alanı önyüklemesi `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve `MEMORY.md` dosyalarını otomatik olarak enjekte eder; ancak alt dizinlerdeki rastgele dosyaları etmez.
</Tip>

## Sürekli talimatın anatomisi

```markdown
## Program: Weekly Status Report

**Authority:** Compile data, generate report, deliver to stakeholders
**Trigger:** Every Friday at 4 PM (enforced via cron job)
**Approval gate:** None for standard reports. Flag anomalies for human review.
**Escalation:** If data source is unavailable or metrics look unusual (>2σ from norm)

### Execution steps

1. Pull metrics from configured sources
2. Compare to prior week and targets
3. Generate report in Reports/weekly/YYYY-MM-DD.md
4. Deliver summary via configured channel
5. Log completion to Agent/Logs/

### What NOT to do

- Do not send reports to external parties
- Do not modify source data
- Do not skip delivery if metrics look bad — report accurately
```

## Sürekli talimatlar artı Cron işleri

Sürekli talimatlar ajanın **ne** yapmaya yetkili olduğunu tanımlar. [Cron işleri](/tr/automation/cron-jobs) bunun **ne zaman** gerçekleşeceğini tanımlar. Birlikte çalışırlar:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Cron işi istemi, bunu çoğaltmak yerine sürekli talimata başvurmalıdır:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel bluebubbles \
  --to "+1XXXXXXXXXX" \
  --message "Execute daily inbox triage per standing orders. Check mail for new alerts. Parse, categorize, and persist each item. Report summary to owner. Escalate unknowns."
```

## Örnekler

### Örnek 1: içerik ve sosyal medya (haftalık döngü)

```markdown
## Program: Content & Social Media

**Authority:** Draft content, schedule posts, compile engagement reports
**Approval gate:** All posts require owner review for first 30 days, then standing approval
**Trigger:** Weekly cycle (Monday review → mid-week drafts → Friday brief)

### Weekly cycle

- **Monday:** Review platform metrics and audience engagement
- **Tuesday–Thursday:** Draft social posts, create blog content
- **Friday:** Compile weekly marketing brief → deliver to owner

### Content rules

- Voice must match the brand (see SOUL.md or brand voice guide)
- Never identify as AI in public-facing content
- Include metrics when available
- Focus on value to audience, not self-promotion
```

### Örnek 2: finans operasyonları (olay tetiklemeli)

```markdown
## Program: Financial Processing

**Authority:** Process transaction data, generate reports, send summaries
**Approval gate:** None for analysis. Recommendations require owner approval.
**Trigger:** New data file detected OR scheduled monthly cycle

### When new data arrives

1. Detect new file in designated input directory
2. Parse and categorize all transactions
3. Compare against budget targets
4. Flag: unusual items, threshold breaches, new recurring charges
5. Generate report in designated output directory
6. Deliver summary to owner via configured channel

### Escalation rules

- Single item > $500: immediate alert
- Category > budget by 20%: flag in report
- Unrecognizable transaction: ask owner for categorization
- Failed processing after 2 retries: report failure, do not guess
```

### Örnek 3: izleme ve uyarılar (sürekli)

```markdown
## Program: System Monitoring

**Authority:** Check system health, restart services, send alerts
**Approval gate:** Restart services automatically. Escalate if restart fails twice.
**Trigger:** Every heartbeat cycle

### Checks

- Service health endpoints responding
- Disk space above threshold
- Pending tasks not stale (>24 hours)
- Delivery channels operational

### Response matrix

| Condition        | Action                   | Escalate?                |
| ---------------- | ------------------------ | ------------------------ |
| Service down     | Restart automatically    | Only if restart fails 2x |
| Disk space < 10% | Alert owner              | Yes                      |
| Stale task > 24h | Remind owner             | No                       |
| Channel offline  | Log and retry next cycle | If offline > 2 hours     |
```

## Yürüt-doğrula-raporla kalıbı

Sürekli talimatlar, sıkı yürütme disipliniyle birleştirildiğinde en iyi sonucu verir. Sürekli talimattaki her görev şu döngüyü izlemelidir:

1. **Yürüt** — Asıl işi yapın (yalnızca talimatı kabul etmekle kalmayın)
2. **Doğrula** — Sonucun doğru olduğunu onaylayın (dosya var, mesaj teslim edildi, veri ayrıştırıldı)
3. **Raporla** — Sahibine ne yapıldığını ve neyin doğrulandığını söyleyin

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely — 3 attempts max, then escalate.
```

Bu kalıp en yaygın ajan hata modunu önler: bir görevi tamamlamadan kabul etmek.

## Çok programlı mimari

Birden fazla konuyu yöneten ajanlar için sürekli talimatları net sınırları olan ayrı programlar olarak düzenleyin:

```markdown
## Program 1: [Domain A] (Weekly)

...

## Program 2: [Domain B] (Monthly + On-Demand)

...

## Program 3: [Domain C] (As-Needed)

...

## Escalation Rules (All Programs)

- [Common escalation criteria]
- [Approval gates that apply across programs]
```

Her programda şunlar olmalıdır:

- Kendine ait **tetikleme periyodu** (haftalık, aylık, olay odaklı, sürekli)
- Kendine ait **onay kapıları** (bazı programlar diğerlerinden daha fazla gözetim gerektirir)
- Net **sınırlar** (ajan bir programın nerede bittiğini ve diğerinin nerede başladığını bilmelidir)

## En iyi uygulamalar

### Yapın

- Dar yetkiyle başlayın ve güven oluştukça genişletin
- Yüksek riskli eylemler için açık onay kapıları tanımlayın
- "Ne YAPILMAMALI" bölümleri ekleyin; sınırlar izinler kadar önemlidir
- Güvenilir zaman tabanlı yürütme için Cron işleriyle birleştirin
- Sürekli talimatların izlendiğini doğrulamak için ajan günlüklerini haftalık inceleyin
- İhtiyaçlarınız geliştikçe sürekli talimatları güncelleyin; bunlar yaşayan belgelerdir

### Kaçının

- İlk günden geniş yetki vermek ("en iyi olduğunu düşündüğün her şeyi yap")
- Eskalasyon kurallarını atlamak; her programın "ne zaman durup sormalı" maddesine ihtiyacı vardır
- Ajanın sözlü talimatları hatırlayacağını varsaymak; her şeyi dosyaya koyun
- Konuları tek bir programda karıştırmak; ayrı alanlar için ayrı programlar kullanın
- Cron işleriyle zorlamayı unutmak; tetikleyicisiz sürekli talimatlar öneriye dönüşür

## İlgili

- [Otomasyon ve görevler](/tr/automation): tüm otomasyon mekanizmalarına genel bakış.
- [Cron işleri](/tr/automation/cron-jobs): sürekli talimatlar için zamanlama uygulaması.
- [Kancalar](/tr/automation/hooks): ajan yaşam döngüsü olayları için olay odaklı betikler.
- [Webhook’lar](/tr/automation/cron-jobs#webhooks): gelen HTTP olay tetikleyicileri.
- [Ajan çalışma alanı](/tr/concepts/agent-workspace): otomatik enjekte edilen önyükleme dosyalarının tam listesi (`AGENTS.md`, `SOUL.md` vb.) dahil, sürekli talimatların bulunduğu yer.
