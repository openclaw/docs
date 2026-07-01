---
read_when:
    - Yayın gruplarını yapılandırma
    - WhatsApp'ta çoklu ajan yanıtlarında hata ayıklama
sidebarTitle: Broadcast groups
status: experimental
summary: Bir WhatsApp mesajını birden fazla agente yayınlayın
title: Yayın grupları
x-i18n:
    generated_at: "2026-07-01T08:26:11Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97e8c2ade5d12a437864e6aca0d475e586289f71155188afed216881ebf89f88
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Durum:** Deneysel. 2026.1.9'da eklendi.
</Note>

## Genel Bakış

Yayın Grupları, birden fazla ajanın aynı iletiyi eş zamanlı olarak işlemesini ve yanıtlamasını sağlar. Bu, tek bir WhatsApp grubunda veya DM'de birlikte çalışan uzmanlaşmış ajan ekipleri oluşturmanıza olanak tanır — hepsi tek bir telefon numarasıyla.

Geçerli kapsam: **yalnızca WhatsApp** (web kanalı).

Yayın grupları, kanal izin listeleri ve grup etkinleştirme kurallarından sonra değerlendirilir. WhatsApp gruplarında bu, yayınların OpenClaw normalde yanıt vereceği durumda gerçekleştiği anlamına gelir (örneğin: grup ayarlarınıza bağlı olarak bahsedildiğinde).

Canlı WhatsApp QA hattı, bahsedilen tek bir grup iletisinin yapılandırılmış iki ajandan farklı görünür yanıtlar üretebildiğini doğrulayan `whatsapp-broadcast-group-fanout` içerir.

## Kullanım alanları

<AccordionGroup>
  <Accordion title="1. Uzmanlaşmış ajan ekipleri">
    Atomik, odaklı sorumluluklara sahip birden fazla ajan dağıtın:

    ```
    Group: "Development Team"
    Agents:
      - CodeReviewer (reviews code snippets)
      - DocumentationBot (generates docs)
      - SecurityAuditor (checks for vulnerabilities)
      - TestGenerator (suggests test cases)
    ```

    Her ajan aynı iletiyi işler ve kendi uzman bakış açısını sunar.

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
  <Accordion title="3. Kalite güvencesi iş akışları">
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

Üst düzey bir `broadcast` bölümü ekleyin (`bindings` yanında). Anahtarlar WhatsApp eş id'leridir:

- grup sohbetleri: grup JID'si (örn. `120363403215116621@g.us`)
- DM'ler: E.164 telefon numarası (örn. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Sonuç:** OpenClaw bu sohbette yanıt vereceği zaman, üç ajanın tamamını çalıştırır.

### İşleme stratejisi

Ajanların iletileri nasıl işleyeceğini denetleyin:

<Tabs>
  <Tab title="parallel (varsayılan)">
    Tüm ajanlar eş zamanlı işler:

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
    Ajanlar sırayla işler (biri öncekinin bitmesini bekler):

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
    Bir WhatsApp grubu veya DM iletisi ulaşır.
  </Step>
  <Step title="Yönlendirme ve kabul">
    OpenClaw kanal izin listelerini, grup etkinleştirme kurallarını ve yapılandırılmış ACP bağlama sahipliğini uygular.
  </Step>
  <Step title="Yayın denetimi">
    Yapılandırılmış hiçbir ACP bağlaması rotanın sahibi değilse OpenClaw, eş ID'nin `broadcast` içinde olup olmadığını denetler.
  </Step>
  <Step title="Yayın uygulanırsa">
    - Listelenen tüm ajanlar iletiyi işler.
    - Her ajanın kendi oturum anahtarı ve yalıtılmış bağlamı vardır.
    - Ajanlar paralel (varsayılan) veya sıralı olarak işler.

  </Step>
  <Step title="Yayın uygulanmazsa">
    OpenClaw, yönlendirme sırasında seçilen olağan rotayı veya yapılandırılmış ACP oturum rotasını gönderir.
  </Step>
</Steps>

<Note>
Yayın grupları, kanal izin listelerini veya grup etkinleştirme kurallarını (bahsetmeler/komutlar/vb.) atlamaz. Yalnızca bir ileti işlenmeye uygun olduğunda _hangi ajanların çalışacağını_ değiştirir.
</Note>

### Oturum yalıtımı

Bir yayın grubundaki her ajan tamamen ayrı şunları korur:

- **Oturum anahtarları** (`agent:alfred:whatsapp:group:120363...` ile `agent:baerbel:whatsapp:group:120363...` karşılaştırması)
- **Konuşma geçmişi** (ajan diğer ajanların iletilerini görmez)
- **Çalışma alanı** (yapılandırılmışsa ayrı sandbox'lar)
- **Araç erişimi** (farklı izin/verme listeleri)
- **Bellek/bağlam** (ayrı IDENTITY.md, SOUL.md, vb.)
- **Grup bağlam arabelleği** (bağlam için kullanılan son grup iletileri) eş başına paylaşılır; bu nedenle tüm yayın ajanları tetiklendiğinde aynı bağlamı görür

Bu, her ajanın şunlara sahip olmasını sağlar:

- Farklı kişilikler
- Farklı araç erişimi (örn. salt okunur ile okuma-yazma)
- Farklı modeller (örn. opus ile sonnet)
- Yüklü farklı Skills

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

    ✅ **İyi:** Her ajanın tek bir işi vardır. ❌ **Kötü:** Tek bir genel "dev-helper" ajanı.

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
    Çok sayıda ajanla şunları değerlendirin:

    - Hız için `"strategy": "parallel"` (varsayılan) kullanma
    - Yayın gruplarını 5-10 ajanla sınırlama
    - Daha basit ajanlar için daha hızlı modeller kullanma

  </Accordion>
  <Accordion title="5. Hataları zarifçe yönetin">
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
**Öncelik:** `broadcast`, olağan rota bağlamalarına göre önceliklidir. Yapılandırılmış ACP bağlamaları (`bindings[].type="acp"`) özeldir: biri eşleştiğinde OpenClaw, fan-out yayın yerine yapılandırılmış ACP oturumuna gönderir.
</Note>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Ajanlar yanıt vermiyor">
    **Denetleyin:**

    1. Ajan ID'leri `agents.list` içinde var.
    2. Eş ID biçimi doğru (örn. `120363403215116621@g.us`).
    3. Ajanlar engelleme listelerinde değil.

    **Hata ayıklama:**

    ```bash
    tail -f ~/.openclaw/logs/gateway.log | grep broadcast
    ```

  </Accordion>
  <Accordion title="Yalnızca bir ajan yanıt veriyor">
    **Neden:** Eş ID olağan rota bağlamalarında olabilir ancak `broadcast` içinde olmayabilir veya özel yapılandırılmış bir ACP bağlamasıyla eşleşiyor olabilir.

    **Düzeltme:** Olağan rotaya bağlı eşleri yayın yapılandırmasına ekleyin veya fan-out yayın isteniyorsa yapılandırılmış ACP bağlamasını kaldırın/değiştirin.

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

    - code-formatter: "Girinti düzeltildi ve tür ipuçları eklendi"
    - security-scanner: "⚠️ 12. satırda SQL enjeksiyonu güvenlik açığı"
    - test-coverage: "Kapsama %45, hata durumları için testler eksik"
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
  Agentlerin nasıl işleneceği. `parallel` tüm agentleri eşzamanlı çalıştırır; `sequential` bunları dizi sırasına göre çalıştırır.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp grup JID'si, E.164 numarası veya başka bir peer ID. Değer, mesajları işlemesi gereken agent ID'lerinin dizisidir.
</ParamField>

## Sınırlamalar

1. **Maksimum agent sayısı:** Kesin bir sınır yoktur, ancak 10+ agent yavaş olabilir.
2. **Paylaşılan bağlam:** Agentler birbirlerinin yanıtlarını görmez (tasarım gereği).
3. **Mesaj sıralaması:** Paralel yanıtlar herhangi bir sırada gelebilir.
4. **Hız sınırları:** Tüm agentler WhatsApp hız sınırlarına dahil edilir.

## Gelecekteki iyileştirmeler

Planlanan özellikler:

- [ ] Paylaşılan bağlam modu (agentler birbirlerinin yanıtlarını görür)
- [ ] Agent koordinasyonu (agentler birbirlerine sinyal gönderebilir)
- [ ] Dinamik agent seçimi (mesaj içeriğine göre agentleri seçin)
- [ ] Agent öncelikleri (bazı agentler diğerlerinden önce yanıt verir)

## İlgili

- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Gruplar](/tr/channels/groups)
- [Çok agentli sandbox araçları](/tr/tools/multi-agent-sandbox-tools)
- [Eşleştirme](/tr/channels/pairing)
- [Oturum yönetimi](/tr/concepts/session)
