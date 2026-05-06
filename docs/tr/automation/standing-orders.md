---
read_when:
    - Görev başına istem gerektirmeden çalışan otonom ajan iş akışlarını ayarlama
    - Ajanın bağımsız olarak neler yapabileceğini ve nelerin insan onayı gerektirdiğini tanımlama
    - Çok programlı ajanları net sınırlar ve yükseltme kurallarıyla yapılandırma
summary: Otonom ajan programları için kalıcı çalışma yetkisini tanımlayın
title: Kalıcı talimatlar
x-i18n:
    generated_at: "2026-05-06T09:02:16Z"
    model: gpt-5.5
    provider: openai
    source_hash: a04e871bbd3f51b50ce162576936d4b37acbdc5a94edcd73e390adc784465aa4
    source_path: automation/standing-orders.md
    workflow: 16
---

Sürekli talimatlar, tanımlı programlar için agent'ınıza **kalıcı işletim yetkisi** verir. Her seferinde ayrı görev talimatları vermek yerine, net kapsam, tetikleyiciler ve yükseltme kuralları olan programlar tanımlarsınız; agent da bu sınırlar içinde otonom olarak yürütür.

Bu, asistanınıza her cuma "haftalık raporu gönder" demek ile sürekli yetki vermek arasındaki farktır: "Haftalık rapor senin sorumluluğunda. Her cuma derle, gönder ve yalnızca bir şey yanlış görünürse yükselt."

## Neden sürekli talimatlar

**Sürekli talimatlar olmadan:**

- Her görev için agent'ı yönlendirmeniz gerekir
- Agent istekler arasında boşta bekler
- Rutin işler unutulur veya gecikir
- Darboğaz siz olursunuz

**Sürekli talimatlarla:**

- Agent tanımlı sınırlar içinde otonom olarak yürütür
- Rutin işler yönlendirme olmadan zamanında gerçekleşir
- Yalnızca istisnalar ve onaylar için dahil olursunuz
- Agent boş zamanı verimli şekilde doldurur

## Nasıl çalışırlar

Sürekli talimatlar [agent çalışma alanı](/tr/concepts/agent-workspace) dosyalarınızda tanımlanır. Önerilen yaklaşım, bunları doğrudan `AGENTS.md` içine eklemektir (`AGENTS.md` her oturumda otomatik olarak enjekte edilir); böylece agent bunları her zaman bağlamında bulundurur. Daha büyük yapılandırmalar için bunları `standing-orders.md` gibi ayrılmış bir dosyaya da koyabilir ve `AGENTS.md` içinden bu dosyaya referans verebilirsiniz.

Her program şunları belirtir:

1. **Kapsam** - agent'ın ne yapmaya yetkili olduğu
2. **Tetikleyiciler** - ne zaman yürütüleceği (zamanlama, olay veya koşul)
3. **Onay geçitleri** - işlem yapılmadan önce nelerin insan onayı gerektirdiği
4. **Yükseltme kuralları** - ne zaman durup yardım isteneceği

Agent, bu talimatları her oturumda çalışma alanı başlangıç dosyaları aracılığıyla yükler (otomatik enjekte edilen dosyaların tam listesi için [Agent Çalışma Alanı](/tr/concepts/agent-workspace) bölümüne bakın) ve zaman tabanlı uygulama için [Cron işleri](/tr/automation/cron-jobs) ile birlikte bunlara göre yürütür.

<Tip>
Her oturumda yüklendiklerinden emin olmak için sürekli talimatları `AGENTS.md` içine koyun. Çalışma alanı başlangıcı `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve `MEMORY.md` dosyalarını otomatik olarak enjekte eder; ancak alt dizinlerdeki rastgele dosyaları etmez.
</Tip>

## Bir sürekli talimatın anatomisi

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
- Do not skip delivery if metrics look bad - report accurately
```

## Sürekli talimatlar ve Cron işleri

Sürekli talimatlar, agent'ın **ne** yapmaya yetkili olduğunu tanımlar. [Cron işleri](/tr/automation/cron-jobs), bunun **ne zaman** gerçekleşeceğini tanımlar. Birlikte çalışırlar:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Cron işi istemi, talimatı çoğaltmak yerine sürekli talimata referans vermelidir:

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
- **Tuesday-Thursday:** Draft social posts, create blog content
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

Sürekli talimatlar, katı yürütme disipliniyle birleştirildiğinde en iyi şekilde çalışır. Sürekli talimattaki her görev şu döngüyü izlemelidir:

1. **Yürüt** - Asıl işi yapın (talimatı yalnızca onaylamakla kalmayın)
2. **Doğrula** - Sonucun doğru olduğunu teyit edin (dosya var, mesaj teslim edildi, veri ayrıştırıldı)
3. **Raporla** - Sahibe ne yapıldığını ve neyin doğrulandığını bildirin

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Bu kalıp, en yaygın agent hata modunu önler: bir görevi tamamlamadan kabul etmek.

## Çok programlı mimari

Birden fazla konuyu yöneten agent'lar için sürekli talimatları net sınırları olan ayrı programlar olarak düzenleyin:

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

- Kendi **tetikleyici ritmi** (haftalık, aylık, olay odaklı, sürekli)
- Kendi **onay geçitleri** (bazı programlar diğerlerinden daha fazla gözetim gerektirir)
- Net **sınırlar** (agent bir programın nerede bittiğini ve diğerinin nerede başladığını bilmelidir)

## En iyi uygulamalar

### Yapın

- Dar yetkiyle başlayın ve güven oluştukça genişletin
- Yüksek riskli eylemler için açık onay geçitleri tanımlayın
- "Ne YAPILMAMALI" bölümleri ekleyin; sınırlar izinler kadar önemlidir
- Güvenilir zaman tabanlı yürütme için Cron işleriyle birleştirin
- Sürekli talimatların izlendiğini doğrulamak için agent günlüklerini haftalık olarak gözden geçirin
- İhtiyaçlarınız geliştikçe sürekli talimatları güncelleyin; bunlar yaşayan belgelerdir

### Kaçının

- İlk günden geniş yetki vermek ("en iyi olduğunu düşündüğün şeyi yap")
- Yükseltme kurallarını atlamak; her programın bir "ne zaman durup sorulacak" maddesine ihtiyacı vardır
- Agent'ın sözlü talimatları hatırlayacağını varsaymak; her şeyi dosyaya koyun
- Konuları tek bir programda karıştırmak; ayrı alanlar için ayrı programlar kullanın
- Cron işleriyle uygulamayı unutmak; tetikleyiciler olmadan sürekli talimatlar öneriye dönüşür

## İlgili

- [Otomasyon ve görevler](/tr/automation): tüm otomasyon mekanizmalarına genel bakış.
- [Cron işleri](/tr/automation/cron-jobs): sürekli talimatlar için zamanlama uygulaması.
- [Hooks](/tr/automation/hooks): agent yaşam döngüsü olayları için olay odaklı betikler.
- [Webhooks](/tr/automation/cron-jobs#webhooks): gelen HTTP olay tetikleyicileri.
- [Agent çalışma alanı](/tr/concepts/agent-workspace): otomatik enjekte edilen başlangıç dosyalarının tam listesi (`AGENTS.md`, `SOUL.md` vb.) dahil, sürekli talimatların bulunduğu yer.
