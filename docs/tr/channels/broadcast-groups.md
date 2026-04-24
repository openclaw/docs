---
read_when:
    - Yayın gruplarını yapılandırma
    - WhatsApp içinde çoklu agent yanıtlarında hata ayıklama
status: experimental
summary: Bir WhatsApp mesajını birden fazla agente yayınla
title: Yayın grupları
x-i18n:
    generated_at: "2026-04-24T08:57:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: d1f3991348570170855158e82089fa073ca62b98855f443d4a227829d7c945ee
    source_path: channels/broadcast-groups.md
    workflow: 15
---

**Durum:** Deneysel  
**Sürüm:** 2026.1.9 sürümünde eklendi

## Genel Bakış

Yayın Grupları, birden fazla agent'in aynı mesajı aynı anda işlemesini ve yanıtlamasını sağlar. Bu, tek bir WhatsApp grubunda veya DM içinde birlikte çalışan uzmanlaşmış agent ekipleri oluşturmanıza olanak tanır — üstelik hepsi tek bir telefon numarası kullanır.

Geçerli kapsam: **yalnızca WhatsApp** (web kanalı).

Yayın grupları, kanal izin listeleri ve grup etkinleştirme kurallarından sonra değerlendirilir. WhatsApp gruplarında bu, yayınların OpenClaw'ın normalde yanıt vereceği durumlarda gerçekleştiği anlamına gelir (örneğin: grup ayarlarınıza bağlı olarak bahsetme olduğunda).

## Kullanım Senaryoları

### 1. Uzmanlaşmış Agent Ekipleri

Atomik, odaklı sorumluluklara sahip birden fazla agent dağıtın:

```
Group: "Development Team"
Agents:
  - CodeReviewer (kod parçacıklarını inceler)
  - DocumentationBot (belgeler üretir)
  - SecurityAuditor (güvenlik açıklarını kontrol eder)
  - TestGenerator (test senaryoları önerir)
```

Her agent aynı mesajı işler ve kendi uzmanlık bakış açısını sunar.

### 2. Çok Dilli Destek

```
Group: "International Support"
Agents:
  - Agent_EN (İngilizce yanıt verir)
  - Agent_DE (Almanca yanıt verir)
  - Agent_ES (İspanyolca yanıt verir)
```

### 3. Kalite Güvencesi İş Akışları

```
Group: "Customer Support"
Agents:
  - SupportAgent (yanıt sağlar)
  - QAAgent (kaliteyi inceler, yalnızca sorun bulunursa yanıt verir)
```

### 4. Görev Otomasyonu

```
Group: "Project Management"
Agents:
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

**Sonuç:** OpenClaw bu sohbette yanıt vereceğinde, üç agent'in tümünü çalıştırır.

### İşleme Stratejisi

Agent'lerin mesajları nasıl işleyeceğini kontrol edin:

#### Paralel (Varsayılan)

Tüm agent'ler aynı anda işler:

```json
{
  "broadcast": {
    "strategy": "parallel",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

#### Sıralı

Agent'ler sırayla işler (biri, öncekinin bitmesini bekler):

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
2. **Yayın denetimi**: Sistem, eş kimliğinin `broadcast` içinde olup olmadığını kontrol eder
3. **Yayın listesinde varsa**:
   - Listelenen tüm agent'ler mesajı işler
   - Her agent'in kendi oturum anahtarı ve yalıtılmış bağlamı vardır
   - Agent'ler paralel (varsayılan) veya sıralı olarak işler
4. **Yayın listesinde yoksa**:
   - Normal yönlendirme uygulanır (eşleşen ilk binding)

Not: yayın grupları kanal izin listelerini veya grup etkinleştirme kurallarını (bahsetmeler/komutlar/vb.) atlamaz. Yalnızca, bir mesaj işleme için uygunsa _hangi agent'lerin çalışacağını_ değiştirir.

### Oturum Yalıtımı

Bir yayın grubundaki her agent tamamen ayrı şunları korur:

- **Oturum anahtarları** (`agent:alfred:whatsapp:group:120363...` ile `agent:baerbel:whatsapp:group:120363...`)
- **Konuşma geçmişi** (agent diğer agent'lerin mesajlarını görmez)
- **Çalışma alanı** (yapılandırılmışsa ayrı sandbox'lar)
- **Araç erişimi** (farklı izin/verme listeleri)
- **Bellek/bağlam** (ayrı `IDENTITY.md`, `SOUL.md` vb.)
- **Grup bağlam arabelleği** (bağlam için kullanılan son grup mesajları) eş başına paylaşılır; bu nedenle tüm yayın agent'leri tetiklendiğinde aynı bağlamı görür

Bu, her agent'in şunlara sahip olmasına olanak tanır:

- Farklı kişilikler
- Farklı araç erişimi (ör. salt okunur ile okuma-yazma)
- Farklı modeller (ör. opus ile sonnet)
- Kurulu farklı Skills

### Örnek: Yalıtılmış Oturumlar

`["alfred", "baerbel"]` agent'leriyle `120363403215116621@g.us` grubunda:

**Alfred'in bağlamı:**

```
Session: agent:alfred:whatsapp:group:120363403215116621@g.us
History: [kullanıcı mesajı, alfred'in önceki yanıtları]
Workspace: /Users/user/openclaw-alfred/
Tools: read, write, exec
```

**Bärbel'in bağlamı:**

```
Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
History: [kullanıcı mesajı, baerbel'in önceki yanıtları]
Workspace: /Users/user/openclaw-baerbel/
Tools: yalnızca read
```

## En İyi Uygulamalar

### 1. Agent'leri Odaklı Tutun

Her agent'i tek ve net bir sorumlulukla tasarlayın:

```json
{
  "broadcast": {
    "DEV_GROUP": ["formatter", "linter", "tester"]
  }
}
```

✅ **İyi:** Her agent'in tek bir görevi var  
❌ **Kötü:** Tek bir genel "dev-helper" agent'i

### 2. Açıklayıcı Adlar Kullanın

Her agent'in ne yaptığını açık hale getirin:

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

Agent'lere yalnızca ihtiyaç duydukları araçları verin:

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

Çok sayıda agent ile şunları göz önünde bulundurun:

- Hız için `"strategy": "parallel"` (varsayılan) kullanma
- Yayın gruplarını 5-10 agent ile sınırlama
- Daha basit agent'ler için daha hızlı modeller kullanma

### 5. Hataları Zarifçe Ele Alın

Agent'ler birbirinden bağımsız başarısız olur. Bir agent'in hatası diğerlerini engellemez:

```
Message → [Agent A ✓, Agent B ✗ hata, Agent C ✓]
Result: Agent A ve C yanıt verir, Agent B hatayı günlüğe kaydeder
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

### Agent'ler Yanıt Vermiyor

**Kontrol edin:**

1. Agent kimlikleri `agents.list` içinde var
2. Eş kimliği biçimi doğru (ör. `120363403215116621@g.us`)
3. Agent'ler engelleme listelerinde değil

**Hata ayıklama:**

```bash
tail -f ~/.openclaw/logs/gateway.log | grep broadcast
```

### Yalnızca Bir Agent Yanıt Veriyor

**Neden:** Eş kimliği `bindings` içinde olabilir ancak `broadcast` içinde olmayabilir.

**Düzeltme:** Yayın yapılandırmasına ekleyin veya binding'lerden kaldırın.

### Performans Sorunları

**Çok sayıda agent ile yavaşsa:**

- Grup başına agent sayısını azaltın
- Daha hafif modeller kullanın (opus yerine sonnet)
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
- security-scanner: "⚠️ 12. satırda SQL injection güvenlik açığı"
- test-coverage: "Kapsama %45, hata durumları için testler eksik"
- docs-checker: "`process_data` fonksiyonu için docstring eksik"

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

## API Başvurusu

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

- `strategy` (isteğe bağlı): Agent'lerin nasıl işleneceği
  - `"parallel"` (varsayılan): Tüm agent'ler aynı anda işler
  - `"sequential"`: Agent'ler dizideki sırayla işler
- `[peerId]`: WhatsApp grup JID'si, E.164 numarası veya başka bir eş kimliği
  - Değer: Mesajları işlemesi gereken agent kimlikleri dizisi

## Sınırlamalar

1. **Maksimum agent sayısı:** Kesin bir sınır yoktur, ancak 10+'dan fazla agent yavaş olabilir
2. **Paylaşılan bağlam:** Agent'ler birbirlerinin yanıtlarını görmez (tasarım gereği)
3. **Mesaj sıralaması:** Paralel yanıtlar herhangi bir sırada gelebilir
4. **Hız sınırları:** Tüm agent'ler WhatsApp hız sınırlarına dahil edilir

## Gelecekteki Geliştirmeler

Planlanan özellikler:

- [ ] Paylaşılan bağlam modu (agent'ler birbirlerinin yanıtlarını görür)
- [ ] Agent koordinasyonu (agent'ler birbirine sinyal gönderebilir)
- [ ] Dinamik agent seçimi (mesaj içeriğine göre agent seçme)
- [ ] Agent öncelikleri (bazı agent'ler diğerlerinden önce yanıt verir)

## İlgili

- [Groups](/tr/channels/groups)
- [Channel routing](/tr/channels/channel-routing)
- [Pairing](/tr/channels/pairing)
- [Multi-agent sandbox tools](/tr/tools/multi-agent-sandbox-tools)
- [Session management](/tr/concepts/session)
