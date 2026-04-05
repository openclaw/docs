---
read_when:
    - Yayın gruplarını yapılandırma
    - WhatsApp'ta çok agentlı yanıtları hata ayıklama
status: experimental
summary: Bir WhatsApp mesajını birden fazla agente yayınla
title: Yayın Grupları
x-i18n:
    generated_at: "2026-04-05T13:43:07Z"
    model: gpt-5.4
    provider: openai
    source_hash: 1d117ae65ec3b63c2bd4b3c215d96f32d7eafa0f99a9cd7378e502c15e56ca56
    source_path: channels/broadcast-groups.md
    workflow: 15
---

# Yayın Grupları

**Durum:** Deneysel  
**Sürüm:** 2026.1.9 sürümünde eklendi

## Genel Bakış

Yayın Grupları, birden fazla agentin aynı mesajı eşzamanlı olarak işlemesini ve yanıtlamasını sağlar. Bu, tek bir WhatsApp grubu veya DM içinde birlikte çalışan uzmanlaşmış agent ekipleri oluşturmanıza olanak tanır — üstelik hepsi tek bir telefon numarası kullanır.

Geçerli kapsam: yalnızca **WhatsApp** (web kanalı).

Yayın grupları, kanal izin listeleri ve grup etkinleştirme kurallarından sonra değerlendirilir. WhatsApp gruplarında bu, OpenClaw'ın normalde yanıt vereceği durumlarda yayınların gerçekleştiği anlamına gelir (örneğin: grup ayarlarınıza bağlı olarak bir bahsetme olduğunda).

## Kullanım Durumları

### 1. Uzmanlaşmış Agent Ekipleri

Atomik ve odaklı sorumluluklara sahip birden fazla agent dağıtın:

```
Grup: "Geliştirme Ekibi"
Agentler:
  - CodeReviewer (kod parçacıklarını inceler)
  - DocumentationBot (belgeler üretir)
  - SecurityAuditor (güvenlik açıklarını kontrol eder)
  - TestGenerator (test senaryoları önerir)
```

Her agent aynı mesajı işler ve kendi uzman bakış açısını sunar.

### 2. Çok Dilli Destek

```
Grup: "Uluslararası Destek"
Agentler:
  - Agent_EN (İngilizce yanıt verir)
  - Agent_DE (Almanca yanıt verir)
  - Agent_ES (İspanyolca yanıt verir)
```

### 3. Kalite Güvencesi İş Akışları

```
Grup: "Müşteri Desteği"
Agentler:
  - SupportAgent (yanıt sağlar)
  - QAAgent (kaliteyi inceler, yalnızca sorun bulunursa yanıt verir)
```

### 4. Görev Otomasyonu

```
Grup: "Proje Yönetimi"
Agentler:
  - TaskTracker (görev veritabanını günceller)
  - TimeLogger (harcanan zamanı kaydeder)
  - ReportGenerator (özetler oluşturur)
```

## Yapılandırma

### Temel Kurulum

Üst düzey bir `broadcast` bölümü ekleyin (`bindings` ile aynı seviyede). Anahtarlar WhatsApp eş kimlikleridir:

- grup sohbetleri: grup JID'si (ör. `120363403215116621@g.us`)
- DM'ler: E.164 telefon numarası (ör. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Sonuç:** OpenClaw bu sohbette yanıt vereceğinde, üç agentin tamamını çalıştırır.

### İşleme Stratejisi

Agentlerin mesajları nasıl işleyeceğini kontrol edin:

#### Paralel (Varsayılan)

Tüm agentler eşzamanlı işler:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Sıralı

Agentler sırayla işler (biri, öncekinin bitmesini bekler):

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Tam Örnek

```json
{
  "agents": {
    "list": [
      {
        "id": "code-reviewer",
        "name": "Code Reviewer",
        "workspace": "/path/to/code-reviewer",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "security-auditor",
        "name": "Security Auditor",
        "workspace": "/path/to/security-auditor",
        "sandbox": { "mode": "all" }
      },
      {
        "id": "docs-generator",
        "name": "Documentation Generator",
        "workspace": "/path/to/docs-generator",
        "sandbox": { "mode": "all" }
      }
    ]
  },
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["code-reviewer", "security-auditor", "docs-generator"],
    "120363424282127706@g.us": ["support-en", "support-de"],
    "+15555550123": ["assistant", "logger"]
  }
}
```

## Nasıl Çalışır

### Mesaj Akışı

1. **Gelen mesaj** bir WhatsApp grubuna ulaşır
2. **Yayın denetimi**: Sistem, eş kimliğin `broadcast` içinde olup olmadığını kontrol eder
3. **Yayın listesinde varsa**:
   - Listelenen tüm agentler mesajı işler
   - Her agentin kendi oturum anahtarı ve yalıtılmış bağlamı vardır
   - Agentler paralel (varsayılan) veya sıralı olarak işler
4. **Yayın listesinde değilse**:
   - Normal yönlendirme uygulanır (ilk eşleşen bağlama)

Not: yayın grupları kanal izin listelerini veya grup etkinleştirme kurallarını (bahsetmeler/komutlar/vb.) atlamaz. Yalnızca bir mesaj işlenmeye uygun olduğunda _hangi agentlerin çalıştığını_ değiştirirler.

### Oturum Yalıtımı

Bir yayın grubundaki her agent şu öğeleri tamamen ayrı tutar:

- **Oturum anahtarları** (`agent:alfred:whatsapp:group:120363...` ve `agent:baerbel:whatsapp:group:120363...`)
- **Konuşma geçmişi** (agent diğer agentlerin mesajlarını görmez)
- **Çalışma alanı** (yapılandırılmışsa ayrı sandbox'lar)
- **Araç erişimi** (farklı izin/verme listeleri)
- **Bellek/bağlam** (ayrı `IDENTITY.md`, `SOUL.md` vb.)
- **Grup bağlam arabelleği** (bağlam için kullanılan son grup mesajları) eş başına paylaşılır; bu nedenle tüm yayın agentleri tetiklendiğinde aynı bağlamı görür

Bu, her agentin şu özelliklere sahip olmasını sağlar:

- Farklı kişilikler
- Farklı araç erişimi (ör. salt okunur ve okuma-yazma)
- Farklı modeller (ör. opus ve sonnet)
- Kurulu farklı Skills

### Örnek: Yalıtılmış Oturumlar

`120363403215116621@g.us` grubunda `["alfred", "baerbel"]` agentleriyle:

**Alfred'in bağlamı:**

```
Oturum: agent:alfred:whatsapp:group:120363403215116621@g.us
Geçmiş: [kullanıcı mesajı, alfred'in önceki yanıtları]
Çalışma alanı: /Users/user/openclaw-alfred/
Araçlar: read, write, exec
```

**Bärbel'in bağlamı:**

```
Oturum: agent:baerbel:whatsapp:group:120363403215116621@g.us
Geçmiş: [kullanıcı mesajı, baerbel'in önceki yanıtları]
Çalışma alanı: /Users/user/openclaw-baerbel/
Araçlar: yalnızca read
```

## En İyi Uygulamalar

### 1. Agentleri Odaklı Tutun

Her agenti tek ve net bir sorumlulukla tasarlayın:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **İyi:** Her agentin tek bir işi vardır  
❌ **Kötü:** Tek bir genel "dev-helper" agenti

### 2. Açıklayıcı Adlar Kullanın

Her agentin ne yaptığını netleştirin:

```json
{
  "agents": {
    "security-scanner": { "name": "Security Scanner" },
    "code-formatter": { "name": "Code Formatter" },
    "test-generator": { "name": "Test Generator" }
  }
}
```

### 3. Farklı Araç Erişimi Yapılandırın

Agentlere yalnızca ihtiyaç duydukları araçları verin:

```json
{
  "agents": {
    "reviewer": {
      "tools": { "allow": ["read", "exec"] } // Salt okunur
    },
    "fixer": {
      "tools": { "allow": ["read", "write", "edit", "exec"] } // Okuma-yazma
    }
  }
}
```

### 4. Performansı İzleyin

Birçok agent ile şunları göz önünde bulundurun:

- Hız için `"strategy": "parallel"` (varsayılan) kullanın
- Yayın gruplarını 5-10 agent ile sınırlayın
- Daha basit agentler için daha hızlı modeller kullanın

### 5. Hataları Zarifçe Ele Alın

Agentler bağımsız olarak başarısız olur. Bir agentin hatası diğerlerini engellemez:

```
Mesaj → [Agent A ✓, Agent B ✗ hata, Agent C ✓]
Sonuç: Agent A ve C yanıt verir, Agent B hatayı günlüğe kaydeder
```

## Uyumluluk

### Sağlayıcılar

Yayın grupları şu anda şunlarla çalışır:

- ✅ WhatsApp (uygulandı)
- 🚧 Telegram (planlandı)
- 🚧 Discord (planlandı)
- 🚧 Slack (planlandı)

### Yönlendirme

Yayın grupları mevcut yönlendirmeyle birlikte çalışır:

```json
{
  "bindings": [
    {
      "match": { "channel": "whatsapp", "peer": { "kind": "group", "id": "GROUP_A" } },
      "agentId": "alfred"
    }
  ],
  "broadcast": {
    "GROUP_B": ["agent1", "agent2"]
  }
}
```

- `GROUP_A`: Yalnızca alfred yanıt verir (normal yönlendirme)
- `GROUP_B`: agent1 VE agent2 yanıt verir (yayın)

**Öncelik:** `broadcast`, `bindings` üzerinde önceliğe sahiptir.

## Sorun Giderme

### Agentler Yanıt Vermiyor

**Kontrol edin:**

1. Agent kimlikleri `agents.list` içinde mevcut
2. Eş kimlik biçimi doğru (ör. `120363403215116621@g.us`)
3. Agentler engelleme listelerinde değil

**Hata ayıklama:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Yalnızca Bir Agent Yanıt Veriyor

**Neden:** Eş kimlik `bindings` içinde olabilir ancak `broadcast` içinde olmayabilir.

**Düzeltme:** Yayın yapılandırmasına ekleyin veya bindings içinden kaldırın.

### Performans Sorunları

**Birçok agent ile yavaşsa:**

- Grup başına agent sayısını azaltın
- Daha hafif modeller kullanın (`opus` yerine `sonnet`)
- Sandbox başlatma süresini kontrol edin

## Örnekler

### Örnek 1: Kod İnceleme Ekibi

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": [
      "code-formatter",
      "security-scanner",
      "test-coverage",
      "docs-checker"
    ]
  },
  "agents": {
    "list": [
      {
        "id": "code-formatter",
        "workspace": "~/agents/formatter",
        "tools": { "allow": ["read", "write"] }
      },
      {
        "id": "security-scanner",
        "workspace": "~/agents/security",
        "tools": { "allow": ["read", "exec"] }
      },
      {
        "id": "test-coverage",
        "workspace": "~/agents/testing",
        "tools": { "allow": ["read", "exec"] }
      },
      { "id": "docs-checker", "workspace": "~/agents/docs", "tools": { "allow": ["read"] } }
    ]
  }
}
```

**Kullanıcı gönderir:** Kod parçacığı  
**Yanıtlar:**

- code-formatter: "Girintiyi düzelttim ve tür ipuçları ekledim"
- security-scanner: "⚠️ 12. satırda SQL enjeksiyonu güvenlik açığı"
- test-coverage: "Kapsama %45, hata durumları için testler eksik"
- docs-checker: "`process_data` işlevi için docstring eksik"

### Örnek 2: Çok Dilli Destek

```json
{
  "broadcast": {
    "strategy": "sequential",
    "+15555550123": ["detect-language", "translator-en", "translator-de"]
  },
  "agents": {
    "list": [
      { "id": "detect-language", "workspace": "~/agents/lang-detect" },
      { "id": "translator-en", "workspace": "~/agents/translate-en" },
      { "id": "translator-de", "workspace": "~/agents/translate-de" }
    ]
  }
}
```

## API Referansı

### Yapılandırma Şeması

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Alanlar

- `strategy` (isteğe bağlı): Agentlerin nasıl işleneceği
  - `"parallel"` (varsayılan): Tüm agentler eşzamanlı işler
  - `"sequential"`: Agentler dizideki sıraya göre işler
- `[peerId]`: WhatsApp grup JID'si, E.164 numarası veya başka bir eş kimlik
  - Değer: Mesajları işlemesi gereken agent kimliklerinin dizisi

## Sınırlamalar

1. **Maksimum agent:** Kesin bir sınır yoktur, ancak 10+ agent yavaş olabilir
2. **Paylaşılan bağlam:** Agentler birbirlerinin yanıtlarını görmez (tasarım gereği)
3. **Mesaj sıralaması:** Paralel yanıtlar herhangi bir sırada gelebilir
4. **Oran sınırları:** Tüm agentler WhatsApp oran sınırlarına dahil edilir

## Gelecekteki Geliştirmeler

Planlanan özellikler:

- [ ] Paylaşılan bağlam modu (agentler birbirlerinin yanıtlarını görür)
- [ ] Agent koordinasyonu (agentler birbirlerine sinyal verebilir)
- [ ] Dinamik agent seçimi (mesaj içeriğine göre agent seçme)
- [ ] Agent öncelikleri (bazı agentler diğerlerinden önce yanıt verir)

## Ayrıca Bakın

- [Çok Agentli Yapılandırma](/tools/multi-agent-sandbox-tools)
- [Yönlendirme Yapılandırması](/channels/channel-routing)
- [Oturum Yönetimi](/concepts/session)
