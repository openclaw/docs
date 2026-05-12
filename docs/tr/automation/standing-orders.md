---
read_when:
    - Görev başına istem gerektirmeden çalışan otonom ajan iş akışlarını ayarlama
    - Ajanın bağımsız olarak neler yapabileceğini ve nelerin insan onayı gerektirdiğini tanımlama
    - Net sınırlar ve eskalasyon kurallarıyla çok programlı ajanları yapılandırma
summary: Otonom ajan programları için kalıcı çalışma yetkisini tanımlayın
title: Daimi talimatlar
x-i18n:
    generated_at: "2026-05-12T00:56:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 3a51baa7aca31cb34b682983374d4d551ed6ab57ae54a5c63e7d044bffeef756
    source_path: automation/standing-orders.md
    workflow: 16
---

Daimi emirler, tanımlanmış programlar için ajanınıza **kalıcı işletim yetkisi** verir. Her seferinde tek tek görev talimatları vermek yerine, kapsamı, tetikleyicileri ve yükseltme kuralları net olan programlar tanımlarsınız; ajan da bu sınırlar içinde otonom olarak yürütür.

Bu, yardımcınıza her Cuma "haftalık raporu gönder" demek ile daimi yetki vermek arasındaki farktır: "Haftalık rapor senden sorumlu. Her Cuma derle, gönder ve yalnızca bir şey yanlış görünürse yükselt."

## Neden daimi emirler

**Daimi emirler olmadan:**

- Her görev için ajanı istemlemeniz gerekir
- Ajan istekler arasında boşta kalır
- Rutin işler unutulur veya gecikir
- Darboğaz siz olursunuz

**Daimi emirlerle:**

- Ajan, tanımlı sınırlar içinde otonom olarak yürütür
- Rutin işler istem gerektirmeden zamanında gerçekleşir
- Siz yalnızca istisnalar ve onaylar için devreye girersiniz
- Ajan boş zamanı verimli şekilde değerlendirir

## Nasıl çalışırlar

Daimi emirler, [ajan çalışma alanı](/tr/concepts/agent-workspace) dosyalarınızda tanımlanır. Önerilen yaklaşım, bunları doğrudan `AGENTS.md` içine eklemektir (`AGENTS.md` her oturumda otomatik olarak enjekte edilir); böylece ajan bunları her zaman bağlamında bulundurur. Daha büyük yapılandırmalar için bunları `standing-orders.md` gibi ayrılmış bir dosyaya da koyabilir ve `AGENTS.md` içinden referans verebilirsiniz.

Her program şunları belirtir:

1. **Kapsam** - ajanın ne yapmaya yetkili olduğu
2. **Tetikleyiciler** - ne zaman yürütüleceği (zamanlama, olay veya koşul)
3. **Onay kapıları** - işlemden önce nelerin insan onayı gerektirdiği
4. **Yükseltme kuralları** - ne zaman durup yardım isteneceği

Ajan bu talimatları her oturumda çalışma alanı başlatma dosyaları üzerinden yükler (otomatik enjekte edilen dosyaların tam listesi için bkz. [Agent Workspace](/tr/concepts/agent-workspace)) ve zaman temelli uygulama için [cron işleri](/tr/automation/cron-jobs) ile birlikte bunlara göre yürütür.

<Tip>
Daimi emirleri her oturumda yükleneceklerini garanti etmek için `AGENTS.md` içine koyun. Çalışma alanı başlatması `AGENTS.md`, `SOUL.md`, `TOOLS.md`, `IDENTITY.md`, `USER.md`, `HEARTBEAT.md`, `BOOTSTRAP.md` ve `MEMORY.md` dosyalarını otomatik olarak enjekte eder; ancak alt dizinlerdeki rastgele dosyaları enjekte etmez.
</Tip>

## Bir daimi emrin anatomisi

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

## Daimi emirler artı cron işleri

Daimi emirler, ajanın **ne** yapmaya yetkili olduğunu tanımlar. [Cron işleri](/tr/automation/cron-jobs) bunun **ne zaman** gerçekleşeceğini tanımlar. Birlikte çalışırlar:

```
Standing Order: "You own the daily inbox triage"
    ↓
Cron Job (8 AM daily): "Execute inbox triage per standing orders"
    ↓
Agent: Reads standing orders → executes steps → reports results
```

Cron işi istemi, daimi emri kopyalamak yerine ona referans vermelidir:

```bash
openclaw cron add \
  --name daily-inbox-triage \
  --cron "0 8 * * 1-5" \
  --tz America/New_York \
  --timeout-seconds 300 \
  --announce \
  --channel imessage \
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

## Yürüt-doğrula-raporla deseni

Daimi emirler, katı yürütme disipliniyle birleştirildiğinde en iyi şekilde çalışır. Bir daimi emirdeki her görev şu döngüyü izlemelidir:

1. **Yürüt** - Asıl işi yap (talimatı yalnızca onaylamakla kalma)
2. **Doğrula** - Sonucun doğru olduğunu onayla (dosya var, mesaj teslim edildi, veri ayrıştırıldı)
3. **Raporla** - Sahibe ne yapıldığını ve neyin doğrulandığını söyle

```markdown
### Execution rules

- Every task follows Execute-Verify-Report. No exceptions.
- "I'll do that" is not execution. Do it, then report.
- "Done" without verification is not acceptable. Prove it.
- If execution fails: retry once with adjusted approach.
- If still fails: report failure with diagnosis. Never silently fail.
- Never retry indefinitely - 3 attempts max, then escalate.
```

Bu desen, en yaygın ajan hata modunu önler: bir görevi tamamlamadan onaylamak.

## Çok programlı mimari

Birden çok konuyu yöneten ajanlar için daimi emirleri net sınırlara sahip ayrı programlar olarak düzenleyin:

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

- Kendine ait **tetikleme ritmi** (haftalık, aylık, olay odaklı, sürekli)
- Kendine ait **onay kapıları** (bazı programlar diğerlerinden daha fazla gözetim gerektirir)
- Net **sınırlar** (ajan bir programın nerede bitip diğerinin nerede başladığını bilmelidir)

## En iyi uygulamalar

### Yapılması gerekenler

- Dar yetkiyle başlayın ve güven arttıkça genişletin
- Yüksek riskli eylemler için açık onay kapıları tanımlayın
- "Ne yapılmamalı" bölümleri ekleyin; sınırlar izinler kadar önemlidir
- Güvenilir zaman temelli yürütme için cron işleriyle birleştirin
- Daimi emirlere uyulduğunu doğrulamak için ajan günlüklerini haftalık inceleyin
- İhtiyaçlarınız değiştikçe daimi emirleri güncelleyin; bunlar yaşayan belgelerdir

### Kaçının

- İlk günden geniş yetki vermek ("en iyi olduğunu düşündüğün şeyi yap")
- Yükseltme kurallarını atlamak; her programın "ne zaman durup sormalı" maddesine ihtiyacı vardır
- Ajanın sözlü talimatları hatırlayacağını varsaymak; her şeyi dosyaya koyun
- Konuları tek bir programda karıştırmak; ayrı alanlar için ayrı programlar kullanın
- Cron işleriyle uygulamayı unutmak; tetikleyicisiz daimi emirler öneriye dönüşür

## İlgili

- [Otomasyon](/tr/automation): tüm otomasyon mekanizmalarına genel bakış.
- [Cron işleri](/tr/automation/cron-jobs): daimi emirler için zamanlama uygulaması.
- [Kancalar](/tr/automation/hooks): ajan yaşam döngüsü olayları için olay odaklı betikler.
- [Webhook’lar](/tr/automation/cron-jobs#webhooks): gelen HTTP olay tetikleyicileri.
- [Ajan çalışma alanı](/tr/concepts/agent-workspace): otomatik enjekte edilen başlatma dosyalarının tam listesi (`AGENTS.md`, `SOUL.md` vb.) dahil, daimi emirlerin bulunduğu yer.
