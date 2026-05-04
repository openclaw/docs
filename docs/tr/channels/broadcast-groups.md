---
read_when:
    - Yayın gruplarını yapılandırma
    - WhatsApp'ta çoklu ajan yanıtlarında hata ayıklama
sidebarTitle: Broadcast groups
status: experimental
summary: Bir WhatsApp mesajını birden fazla ajana yayınla
title: Yayın grupları
x-i18n:
    generated_at: "2026-05-04T02:21:31Z"
    model: gpt-5.5
    provider: openai
    source_hash: eab43d3c3ffddb360340469433d74a380fbab98e662b2463a54f62eafc375b55
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Durum:** Deneysel. 2026.1.9 sürümünde eklendi.
</Note>

## Genel bakış

Yayın Grupları, birden fazla aracının aynı iletiyi eşzamanlı olarak işlemesini ve yanıtlamasını sağlar. Bu, tek bir WhatsApp grubunda veya DM'de birlikte çalışan özelleşmiş aracı ekipleri oluşturmanıza olanak tanır — hepsi tek bir telefon numarası kullanarak.

Geçerli kapsam: **yalnızca WhatsApp** (web kanalı).

Yayın grupları, kanal izin listelerinden ve grup etkinleştirme kurallarından sonra değerlendirilir. WhatsApp gruplarında bu, yayınların OpenClaw'ın normalde yanıt vereceği durumlarda gerçekleştiği anlamına gelir (örneğin: grup ayarlarınıza bağlı olarak bahsedildiğinde).

## Kullanım örnekleri

<AccordionGroup>
  <Accordion title="1. Özelleşmiş aracı ekipleri">
    Atomik ve odaklanmış sorumluluklara sahip birden fazla aracı dağıtın:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Her aracı aynı iletiyi işler ve kendi uzman bakış açısını sunar.

  </Accordion>
  <Accordion title="2. Çok dilli destek">
    ```
    Group: "International Support"
    Agents:
      - Agent_EN (responds in English)
      - Agent_DE (responds in German)
      - Agent_ES (responds in Spanish)
    ```
  </Accordion>
  <Accordion title="3. Kalite güvence iş akışları">
    ```
    Group: "Customer Support"
    Agents:
      - SupportAgent (provides answer)
      - QAAgent (reviews quality, only responds if issues found)
    ```
  </Accordion>
  <Accordion title="4. Görev otomasyonu">
    ```
    Group: "Project Management"
    Agents:
      - TaskTracker (updates task database)
      - TimeLogger (logs time spent)
      - ReportGenerator (creates summaries)
    ```
  </Accordion>
</AccordionGroup>

## Yapılandırma

### Temel kurulum

Üst düzey bir `broadcast` bölümü ekleyin (`bindings` yanında). Anahtarlar WhatsApp eş kimlikleridir:

- grup sohbetleri: grup JID'si (örn. `120363403215116621@g.us`)
- DM'ler: E.164 telefon numarası (örn. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Sonuç:** OpenClaw bu sohbette yanıt vereceği zaman üç aracının tamamını çalıştırır.

### İşleme stratejisi

Aracıların iletileri nasıl işlediğini denetleyin:

<Tabs>
  <Tab title="parallel (varsayılan)">
    Tüm aracılar eşzamanlı olarak işler:

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
    Aracılar sırayla işler (biri öncekinin bitmesini bekler):

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

### İleti akışı

<Steps>
  <Step title="Gelen ileti ulaşır">
    Bir WhatsApp grup veya DM iletisi gelir.
  </Step>
  <Step title="Yayın denetimi">
    Sistem, eş kimliğinin `broadcast` içinde olup olmadığını denetler.
  </Step>
  <Step title="Yayın listesindeyse">
    - Listelenen tüm aracılar iletiyi işler.
    - Her aracının kendi oturum anahtarı ve yalıtılmış bağlamı vardır.
    - Aracılar paralel (varsayılan) veya sıralı olarak işler.

  </Step>
  <Step title="Yayın listesinde değilse">
    Normal yönlendirme uygulanır (ilk eşleşen bağlama).
  </Step>
</Steps>

<Note>
Yayın grupları kanal izin listelerini veya grup etkinleştirme kurallarını (bahsetmeler/komutlar/vb.) atlamaz. Yalnızca bir ileti işlemeye uygun olduğunda _hangi aracıların çalışacağını_ değiştirir.
</Note>

### Oturum yalıtımı

Bir yayın grubundaki her aracı tamamen ayrı şunları korur:

- **Oturum anahtarları** (`agent:alfred:whatsapp:group:120363...` ve `agent:baerbel:whatsapp:group:120363...`)
- **Konuşma geçmişi** (aracı diğer aracıların iletilerini görmez)
- **Çalışma alanı** (yapılandırıldıysa ayrı korumalı alanlar)
- **Araç erişimi** (farklı izin/verme listeleri)
- **Bellek/bağlam** (ayrı IDENTITY.md, SOUL.md, vb.)
- **Grup bağlam arabelleği** (bağlam için kullanılan son grup iletileri) eş başına paylaşılır, böylece tüm yayın aracıları tetiklendiğinde aynı bağlamı görür

Bu, her aracının şunlara sahip olmasını sağlar:

- Farklı kişilikler
- Farklı araç erişimi (örn. salt okunur ve okuma-yazma)
- Farklı modeller (örn. opus ve sonnet)
- Farklı Skills kurulu

### Örnek: yalıtılmış oturumlar

`["alfred", "baerbel"]` aracılarıyla `120363403215116621@g.us` grubunda:

<Tabs>
  <Tab title="Alfred'in bağlamı">
    ```
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: /Users/user/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Bärbel'in bağlamı">
    ```
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: /Users/user/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## En iyi uygulamalar

<AccordionGroup>
  <Accordion title="1. Aracıları odaklı tutun">
    Her aracıyı tek ve net bir sorumlulukla tasarlayın:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **İyi:** Her aracının bir işi vardır. ❌ **Kötü:** Tek bir genel "dev-helper" aracısı.

  </Accordion>
  <Accordion title="2. Açıklayıcı adlar kullanın">
    Her aracının ne yaptığını netleştirin:

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
  <Accordion title="3. Farklı araç erişimi yapılandırın">
    Aracılara yalnızca ihtiyaç duydukları araçları verin:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] }
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] }
        }
      }
    }
    ```

    `reviewer` salt okunurdur. `fixer` okuyabilir ve yazabilir.

  </Accordion>
  <Accordion title="4. Performansı izleyin">
    Çok sayıda aracıyla şunları göz önünde bulundurun:

    - Hız için `"strategy": "parallel"` (varsayılan) kullanma
    - Yayın gruplarını 5-10 aracıyla sınırlama
    - Daha basit aracılar için daha hızlı modeller kullanma

  </Accordion>
  <Accordion title="5. Hataları zarifçe yönetin">
    Aracılar bağımsız olarak başarısız olur. Bir aracının hatası diğerlerini engellemez:

    ```
    Message → [Agent A ✓, Agent B ✗ error, Agent C ✓]
    Result: Agent A and C respond, Agent B logs error
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
**Öncelik:** `broadcast`, `bindings` üzerinde önceliklidir.
</Note>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Aracılar yanıt vermiyor">
    **Denetleyin:**

    1. Aracı kimlikleri `agents.list` içinde mevcut.
    2. Eş kimliği biçimi doğru (örn. `120363403215116621@g.us`).
    3. Aracılar engelleme listelerinde değil.

    **Hata ayıklama:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Yalnızca bir aracı yanıt veriyor">
    **Neden:** Eş kimliği `bindings` içinde olabilir ancak `broadcast` içinde olmayabilir.

    **Çözüm:** Yayın yapılandırmasına ekleyin veya bağlamalardan kaldırın.

  </Accordion>
  <Accordion title="Performans sorunları">
    Çok sayıda aracıyla yavaşsa:

    - Grup başına aracı sayısını azaltın.
    - Daha hafif modeller kullanın (opus yerine sonnet).
    - Korumalı alan başlatma süresini denetleyin.

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

    - code-formatter: "Girinti düzeltildi ve type hint'ler eklendi"
    - security-scanner: "⚠️ 12. satırda SQL injection açığı"
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

## API başvurusu

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
  Aracıların nasıl işleneceği. `parallel` tüm aracıları eşzamanlı olarak çalıştırır; `sequential` onları dizi sırasına göre çalıştırır.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp grup JID'si, E.164 numarası veya başka bir eş kimliği. Değer, iletileri işlemesi gereken aracı kimlikleri dizisidir.
</ParamField>

## Sınırlamalar

1. **Maksimum aracı:** Katı bir sınır yok, ancak 10+ aracı yavaş olabilir.
2. **Paylaşılan bağlam:** Aracılar birbirlerinin yanıtlarını görmez (tasarım gereği).
3. **İleti sıralaması:** Paralel yanıtlar herhangi bir sırada gelebilir.
4. **Hız sınırları:** Tüm aracılar WhatsApp hız sınırlarına dahil edilir.

## Gelecekteki geliştirmeler

Planlanan özellikler:

- [ ] Paylaşılan bağlam modu (aracılar birbirlerinin yanıtlarını görür)
- [ ] Aracı koordinasyonu (aracılar birbirlerine sinyal verebilir)
- [ ] Dinamik aracı seçimi (ileti içeriğine göre aracı seçme)
- [ ] Aracı öncelikleri (bazı aracılar diğerlerinden önce yanıt verir)

## İlgili

- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Gruplar](/tr/channels/groups)
- [Çok ajanlı korumalı alan araçları](/tr/tools/multi-agent-sandbox-tools)
- [Eşleştirme](/tr/channels/pairing)
- [Oturum yönetimi](/tr/concepts/session)
