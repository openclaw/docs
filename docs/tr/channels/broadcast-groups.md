---
read_when:
    - Yayın gruplarını yapılandırma
    - WhatsApp'ta çok aracılı yanıtları hata ayıklama
sidebarTitle: Broadcast groups
status: experimental
summary: Bir WhatsApp mesajını birden fazla aracıya yayınlayın
title: Yayın grupları
x-i18n:
    generated_at: "2026-04-26T11:22:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: b7b36710d9cc3eb4e2b8ba3d57031bd020aedbb6a502b400ec02a835a320d609
    source_path: channels/broadcast-groups.md
    workflow: 15
---

<Note>
**Durum:** Deneysel. 2026.1.9 sürümünde eklendi.
</Note>

## Genel bakış

Yayın Grupları, birden fazla aracının aynı mesajı eşzamanlı olarak işlemesini ve yanıtlamasını sağlar. Bu, tek bir WhatsApp grubunda veya DM'de birlikte çalışan, uzmanlaşmış aracı ekipleri oluşturmanıza olanak tanır — hem de tek bir telefon numarası kullanarak.

Geçerli kapsam: **yalnızca WhatsApp** (web kanalı).

Yayın grupları, kanal izin listeleri ve grup etkinleştirme kurallarından sonra değerlendirilir. WhatsApp gruplarında bu, OpenClaw'ın normalde yanıt vereceği durumlarda yayınların gerçekleştiği anlamına gelir (örneğin: grup ayarlarınıza bağlı olarak birinden bahsedildiğinde).

## Kullanım alanları

<AccordionGroup>
  <Accordion title="1. Uzmanlaşmış aracı ekipleri">
    Atomik ve odaklı sorumluluklara sahip birden fazla aracı dağıtın:

    ```
    Grup: "Geliştirme Ekibi"
    Aracılar:
      - CodeReviewer (kod parçacıklarını inceler)
      - DocumentationBot (belgeler oluşturur)
      - SecurityAuditor (güvenlik açıklarını denetler)
      - TestGenerator (test senaryoları önerir)
    ```

    Her aracı aynı mesajı işler ve kendi uzmanlık perspektifini sunar.

  </Accordion>
  <Accordion title="2. Çok dilli destek">
    ```
    Grup: "Uluslararası Destek"
    Aracılar:
      - Agent_EN (İngilizce yanıt verir)
      - Agent_DE (Almanca yanıt verir)
      - Agent_ES (İspanyolca yanıt verir)
    ```
  </Accordion>
  <Accordion title="3. Kalite güvencesi iş akışları">
    ```
    Grup: "Müşteri Desteği"
    Aracılar:
      - SupportAgent (yanıt sağlar)
      - QAAgent (kaliteyi inceler, yalnızca sorun bulursa yanıt verir)
    ```
  </Accordion>
  <Accordion title="4. Görev otomasyonu">
    ```
    Grup: "Proje Yönetimi"
    Aracılar:
      - TaskTracker (görev veritabanını günceller)
      - TimeLogger (harcanan süreyi kaydeder)
      - ReportGenerator (özetler oluşturur)
    ```
  </Accordion>
</AccordionGroup>

## Yapılandırma

### Temel kurulum

Üst düzeyde bir `broadcast` bölümü ekleyin (`bindings` yanında). Anahtarlar WhatsApp eş kimlikleridir:

- grup sohbetleri: grup JID'si (ör. `120363403215116621@g.us`)
- DM'ler: E.164 telefon numarası (ör. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Sonuç:** OpenClaw bu sohbette yanıt vereceğinde, üç aracıyı da çalıştırır.

### İşleme stratejisi

Aracıların mesajları nasıl işleyeceğini kontrol edin:

<Tabs>
  <Tab title="parallel (varsayılan)">
    Tüm aracılar aynı anda işler:

    ```json
    {
      "broadcast": {
        "strategy": "parallel",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
  <Tab title="sequential">
    Aracılar sırayla işler (biri, öncekinin bitmesini bekler):

    ```json
    {
      "broadcast": {
        "strategy": "sequential",
        "120363403215116621@g.us": ["alfred", "baerbel"]
      }
    }
    ```

  </Tab>
</Tabs>

### Tam örnek

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

## Nasıl çalışır

### Mesaj akışı

<Steps>
  <Step title="Gelen mesaj ulaşır">
    Bir WhatsApp grubu veya DM mesajı gelir.
  </Step>
  <Step title="Yayın denetimi">
    Sistem, eş kimliğinin `broadcast` içinde olup olmadığını kontrol eder.
  </Step>
  <Step title="Yayın listesinde varsa">
    - Listelenen tüm aracılar mesajı işler.
    - Her aracının kendi oturum anahtarı ve yalıtılmış bağlamı vardır.
    - Aracılar paralel (varsayılan) veya sıralı olarak işler.

  </Step>
  <Step title="Yayın listesinde değilse">
    Normal yönlendirme uygulanır (eşleşen ilk bağlama).
  </Step>
</Steps>

<Note>
Yayın grupları kanal izin listelerini veya grup etkinleştirme kurallarını (bahsetmeler/komutlar/vb.) atlamaz. Yalnızca bir mesaj işlenmeye uygunsa _hangi aracıların çalışacağını_ değiştirirler.
</Note>

### Oturum yalıtımı

Bir yayın grubundaki her aracı tamamen ayrı şu bileşenleri korur:

- **Oturum anahtarları** (`agent:alfred:whatsapp:group:120363...` ile `agent:baerbel:whatsapp:group:120363...`)
- **Konuşma geçmişi** (aracı, diğer aracıların mesajlarını görmez)
- **Çalışma alanı** (yapılandırılmışsa ayrı sandbox'lar)
- **Araç erişimi** (farklı izin/verme listeleri)
- **Bellek/bağlam** (ayrı `IDENTITY.md`, `SOUL.md`, vb.)
- **Grup bağlam arabelleği** (bağlam için kullanılan son grup mesajları) eş başına paylaşılır, bu nedenle tüm yayın aracıları tetiklendiğinde aynı bağlamı görür

Bu, her aracının şu özelliklere sahip olmasını sağlar:

- Farklı kişilikler
- Farklı araç erişimi (ör. salt okunur ile okuma-yazma)
- Farklı modeller (ör. opus ile sonnet)
- Yüklü farklı Skills

### Örnek: yalıtılmış oturumlar

`120363403215116621@g.us` grubunda `["alfred", "baerbel"]` aracılarıyla:

<Tabs>
  <Tab title="Alfred'in bağlamı">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [kullanıcı mesajı, alfred'in önceki yanıtları]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel'in bağlamı">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [kullanıcı mesajı, baerbel'in önceki yanıtları]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: yalnızca read
    ```
  </Tab>
</Tabs>

## En iyi uygulamalar

<AccordionGroup>
  <Accordion title="1. Aracıları odaklı tutun">
    Her aracıya tek ve net bir sorumluluk verin:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **İyi:** Her aracının tek bir işi var. ❌ **Kötü:** Genel amaçlı tek bir "dev-helper" aracısı.

  </Accordion>
  <Accordion title="2. Açıklayıcı adlar kullanın">
    Her aracının ne yaptığını açıkça belirtin:

    ```json
    {
      "agents": {
        "security-scanner": { "name": "Security Scanner" },
        "code-formatter": { "name": "Code Formatter" },
        "test-generator": { "name": "Test Generator" }
      }
    }
    ```

  </Accordion>
  <Accordion title="3. Farklı araç erişimlerini yapılandırın">
    Aracılara yalnızca ihtiyaç duydukları araçları verin:

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

  </Accordion>
  <Accordion title="4. Performansı izleyin">
    Çok sayıda aracıyla şunları değerlendirin:

    - Hız için `"strategy": "parallel"` (varsayılan) kullanın
    - Yayın gruplarını 5-10 aracıyla sınırlayın
    - Daha basit aracılar için daha hızlı modeller kullanın

  </Accordion>
  <Accordion title="5. Hataları zarif şekilde yönetin">
    Aracılar bağımsız olarak başarısız olur. Bir aracının hatası diğerlerini engellemez:

    ```
    Mesaj → [Aracı A ✓, Aracı B ✗ hata, Aracı C ✓]
    Sonuç: Aracı A ve C yanıt verir, Aracı B hatayı günlüğe kaydeder
    ```

  </Accordion>
</AccordionGroup>

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

- `GROUP_A`: Yalnızca alfred yanıt verir (normal yönlendirme).
- `GROUP_B`: agent1 VE agent2 yanıt verir (yayın).

<Note>
**Öncelik:** `broadcast`, `bindings` üzerinde önceliğe sahiptir.
</Note>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Aracılar yanıt vermiyor">
    **Kontrol edin:**

    1. Aracı kimlikleri `agents.list` içinde mevcut.
    2. Eş kimliği biçimi doğru (ör. `120363403215116621@g.us`).
    3. Aracılar engelleme listelerinde değil.

    **Hata ayıklama:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Yalnızca bir aracı yanıt veriyor">
    **Neden:** Eş kimliği `bindings` içinde olabilir ama `broadcast` içinde olmayabilir.

    **Düzeltme:** Yayın yapılandırmasına ekleyin veya bağlamalardan kaldırın.

  </Accordion>
  <Accordion title="Performans sorunları">
    Çok sayıda aracıyla yavaşsa:

    - Grup başına aracı sayısını azaltın.
    - Daha hafif modeller kullanın (opus yerine sonnet).
    - Sandbox başlatma süresini kontrol edin.

  </Accordion>
</AccordionGroup>

## Örnekler

<AccordionGroup>
  <Accordion title="Örnek 1: Kod inceleme ekibi">
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

    **Kullanıcı gönderir:** Kod parçacığı.

    **Yanıtlar:**

    - code-formatter: "Girintiyi düzelttim ve tür ipuçları ekledim"
    - security-scanner: "⚠️ 12. satırda SQL injection güvenlik açığı"
    - test-coverage: "Kapsam %45, hata durumları için testler eksik"
    - docs-checker: "`process_data` işlevi için docstring eksik"

  </Accordion>
  <Accordion title="Örnek 2: Çok dilli destek">
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
  </Accordion>
</AccordionGroup>

## API referansı

### Yapılandırma şeması

```typescript
interface OpenClawConfig {
  broadcast?: {
    strategy?: "parallel" | "sequential";
    [peerId: string]: string[];
  };
}
```

### Alanlar

<ParamField path="strategy" type='"parallel" | "sequential"' default='"parallel"'>
  Aracıların nasıl işleneceği. `parallel` tüm aracıları aynı anda çalıştırır; `sequential` bunları dizi sırasına göre çalıştırır.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp grup JID'si, E.164 numarası veya başka bir eş kimliği. Değer, mesajları işlemesi gereken aracı kimliklerinin dizisidir.
</ParamField>

## Sınırlamalar

1. **Maksimum aracı sayısı:** Kesin bir sınır yoktur, ancak 10+ aracı yavaş olabilir.
2. **Paylaşılan bağlam:** Aracılar birbirlerinin yanıtlarını görmez (tasarım gereği).
3. **Mesaj sıralaması:** Paralel yanıtlar herhangi bir sırada gelebilir.
4. **Oran sınırları:** Tüm aracılar WhatsApp oran sınırlarına dahil edilir.

## Gelecekteki geliştirmeler

Planlanan özellikler:

- [ ] Paylaşılan bağlam modu (aracılar birbirlerinin yanıtlarını görür)
- [ ] Aracı koordinasyonu (aracılar birbirine sinyal gönderebilir)
- [ ] Dinamik aracı seçimi (mesaj içeriğine göre aracı seçme)
- [ ] Aracı öncelikleri (bazı aracılar diğerlerinden önce yanıt verir)

## İlgili

- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Gruplar](/tr/channels/groups)
- [Çok aracılı sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
- [Eşleme](/tr/channels/pairing)
- [Oturum yönetimi](/tr/concepts/session)
