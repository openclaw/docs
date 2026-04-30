---
read_when:
    - Yayın gruplarını yapılandırma
    - WhatsApp'ta çoklu ajan yanıtlarında hata ayıklama
sidebarTitle: Broadcast groups
status: experimental
summary: Bir WhatsApp mesajını birden fazla ajana yayınlayın
title: Yayın grupları
x-i18n:
    generated_at: "2026-04-30T09:05:39Z"
    model: gpt-5.5
    provider: openai
    source_hash: b0de4ccc85bf79e2ceb1dddd60db067309b15b7f876c92e7d591ff0b4b4315ec
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Durum:** Deneysel. 2026.1.9 sürümünde eklendi.
</Note>

## Genel Bakış

Yayın Grupları, birden çok ajanın aynı iletiyi aynı anda işlemesini ve yanıtlamasını sağlar. Bu, tek bir WhatsApp grubunda veya DM'de birlikte çalışan uzmanlaşmış ajan ekipleri oluşturmanıza olanak tanır — hepsi tek bir telefon numarası kullanılarak.

Geçerli kapsam: **Yalnızca WhatsApp** (web kanalı).

Yayın grupları, kanal izin listelerinden ve grup etkinleştirme kurallarından sonra değerlendirilir. WhatsApp gruplarında bu, yayınların OpenClaw normalde yanıt vereceği durumlarda gerçekleştiği anlamına gelir (örneğin: grup ayarlarınıza bağlı olarak bahsedildiğinde).

## Kullanım örnekleri

<AccordionGroup>
  <Accordion title="1. Uzmanlaşmış ajan ekipleri">
    Atomik, odaklanmış sorumluluklara sahip birden çok ajan dağıtın:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Her ajan aynı iletiyi işler ve kendi uzmanlık perspektifini sunar.

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

**Sonuç:** OpenClaw bu sohbette yanıt vereceği zaman üç ajanın tamamını çalıştırır.

### İşleme stratejisi

Ajanların iletileri nasıl işleyeceğini denetleyin:

<Tabs>
  <Tab title="parallel (varsayılan)">
    Tüm ajanlar aynı anda işler:

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
    Ajanlar sırayla işler (biri, öncekinin bitmesini bekler):

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
    Bir WhatsApp grup veya DM iletisi ulaşır.
  </Step>
  <Step title="Yayın denetimi">
    Sistem, eş kimliğinin `broadcast` içinde olup olmadığını denetler.
  </Step>
  <Step title="Yayın listesindeyse">
    - Listelenen tüm ajanlar iletiyi işler.
    - Her ajanın kendi oturum anahtarı ve yalıtılmış bağlamı vardır.
    - Ajanlar paralel (varsayılan) veya sıralı olarak işler.

  </Step>
  <Step title="Yayın listesinde değilse">
    Normal yönlendirme uygulanır (ilk eşleşen bağlama).
  </Step>
</Steps>

<Note>
Yayın grupları kanal izin listelerini veya grup etkinleştirme kurallarını (bahsetmeler/komutlar/vb.) atlamaz. Yalnızca bir ileti işlenmeye uygun olduğunda _hangi ajanların çalışacağını_ değiştirir.
</Note>

### Oturum yalıtımı

Bir yayın grubundaki her ajan tamamen ayrı şunları korur:

- **Oturum anahtarları** (`agent:alfred:whatsapp:group:120363...` ve `agent:baerbel:whatsapp:group:120363...`)
- **Konuşma geçmişi** (ajan diğer ajanların iletilerini görmez)
- **Çalışma alanı** (yapılandırılmışsa ayrı sandbox'lar)
- **Araç erişimi** (farklı izin/red listeleri)
- **Bellek/bağlam** (ayrı IDENTITY.md, SOUL.md, vb.)
- **Grup bağlam arabelleği** (bağlam için kullanılan son grup iletileri) eş başına paylaşılır, böylece tüm yayın ajanları tetiklendiğinde aynı bağlamı görür

Bu, her ajanın şunlara sahip olmasını sağlar:

- Farklı kişilikler
- Farklı araç erişimi (örn. salt okunur ve okuma-yazma)
- Farklı modeller (örn. opus ve sonnet)
- Farklı Skills kurulu

### Örnek: yalıtılmış oturumlar

`120363403215116621@g.us` grubunda `["alfred", "baerbel"]` ajanlarıyla:

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
  <Accordion title="1. Ajanları odaklı tutun">
    Her ajanı tek ve net bir sorumlulukla tasarlayın:

    ```json
    {
      "broadcast": {
        "DEV_GROUP": ["formatter", "linter", "tester"]
      }
    }
    ```

    ✅ **İyi:** Her ajanın bir işi vardır. ❌ **Kötü:** Tek bir genel "dev-helper" ajanı.

  </Accordion>
  <Accordion title="2. Açıklayıcı adlar kullanın">
    Her ajanın ne yaptığını netleştirin:

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
    Ajanlara yalnızca ihtiyaç duydukları araçları verin:

    ```json
    {
      "agents": {
        "reviewer": {
          "tools": { "allow": ["read", "exec"] } // Read-only
        },
        "fixer": {
          "tools": { "allow": ["read", "write", "edit", "exec"] } // Read-write
        }
      }
    }
    ```

  </Accordion>
  <Accordion title="4. Performansı izleyin">
    Çok sayıda ajanla şunları göz önünde bulundurun:

    - Hız için `"strategy": "parallel"` (varsayılan) kullanmak
    - Yayın gruplarını 5-10 ajanla sınırlamak
    - Daha basit ajanlar için daha hızlı modeller kullanmak

  </Accordion>
  <Accordion title="5. Hataları zarifçe ele alın">
    Ajanlar bağımsız olarak başarısız olur. Bir ajanın hatası diğerlerini engellemez:

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
- 🚧 Telegram (planlanıyor)
- 🚧 Discord (planlanıyor)
- 🚧 Slack (planlanıyor)

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
  <Accordion title="Ajanlar yanıt vermiyor">
    **Denetleyin:**

    1. Ajan kimlikleri `agents.list` içinde mevcut.
    2. Eş kimliği biçimi doğru (örn. `120363403215116621@g.us`).
    3. Ajanlar red listelerinde değil.

    **Hata ayıklama:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Yalnızca bir ajan yanıt veriyor">
    **Neden:** Eş kimliği `bindings` içinde olabilir ancak `broadcast` içinde olmayabilir.

    **Düzeltme:** Yayın yapılandırmasına ekleyin veya bağlamalardan kaldırın.

  </Accordion>
  <Accordion title="Performans sorunları">
    Çok sayıda ajanla yavaşsa:

    - Grup başına ajan sayısını azaltın.
    - Daha hafif modeller kullanın (opus yerine sonnet).
    - Sandbox başlatma süresini denetleyin.

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

    - code-formatter: "Girintileme düzeltildi ve tür ipuçları eklendi"
    - security-scanner: "⚠️ 12. satırda SQL enjeksiyonu açığı"
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
  Ajanların nasıl işleneceği. `parallel` tüm ajanları aynı anda çalıştırır; `sequential` onları dizi sırasına göre çalıştırır.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp grup JID'si, E.164 numarası veya başka bir eş kimliği. Değer, iletileri işlemesi gereken ajan kimliklerinin dizisidir.
</ParamField>

## Sınırlamalar

1. **Maksimum ajan:** Katı bir sınır yoktur, ancak 10+ ajan yavaş olabilir.
2. **Paylaşılan bağlam:** Ajanlar birbirlerinin yanıtlarını görmez (tasarım gereği).
3. **İleti sıralaması:** Paralel yanıtlar herhangi bir sırada gelebilir.
4. **Hız sınırları:** Tüm ajanlar WhatsApp hız sınırlarına dahil edilir.

## Gelecekteki geliştirmeler

Planlanan özellikler:

- [ ] Paylaşılan bağlam modu (ajanlar birbirlerinin yanıtlarını görür)
- [ ] Ajan koordinasyonu (ajanlar birbirlerine sinyal gönderebilir)
- [ ] Dinamik ajan seçimi (ileti içeriğine göre ajan seçme)
- [ ] Ajan öncelikleri (bazı ajanlar diğerlerinden önce yanıt verir)

## İlgili

- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Gruplar](/tr/channels/groups)
- [Çok ajanlı korumalı alan araçları](/tr/tools/multi-agent-sandbox-tools)
- [Eşleştirme](/tr/channels/pairing)
- [Oturum yönetimi](/tr/concepts/session)
