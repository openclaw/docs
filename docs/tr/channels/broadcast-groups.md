---
read_when:
    - Yayın gruplarını yapılandırma
    - WhatsApp'ta çoklu ajan yanıtlarında hata ayıklama
sidebarTitle: Broadcast groups
status: experimental
summary: Bir WhatsApp mesajını birden çok ajana yayınlama
title: Yayın grupları
x-i18n:
    generated_at: "2026-07-12T12:02:31Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2771c15b31592f11293385498b9c89decf84747a9172caafb994a5dca4bbdc06
    source_path: channels/broadcast-groups.md
    workflow: 16
---

<Note>
**Durum:** Deneysel. 2026.1.9 sürümünde eklendi. Yalnızca WhatsApp (web kanalı).
</Note>

## Genel bakış

Yayın grupları, aynı gelen ileti için **birden fazla agent** çalıştırır. Her agent iletiyi kendi yalıtılmış oturumunda işler ve kendi yanıtını gönderir; böylece tek bir WhatsApp numarası, tek bir grup sohbetinde veya doğrudan mesajda uzmanlaşmış agent'lardan oluşan bir ekibi barındırabilir.

Yayın grupları, kanal izin listeleri ve grup etkinleştirme kurallarından sonra değerlendirilir. WhatsApp gruplarında yayınlar, OpenClaw normalde yanıt vereceği zaman gerçekleşir (örneğin grup ayarlarınıza bağlı olarak bahsedildiğinde). Yalnızca **hangi agent'ların çalışacağını** değiştirirler; bir iletinin işlenmeye uygun olup olmadığını hiçbir zaman değiştirmezler.

Canlı WhatsApp kalite güvencesi hattı, bahsetme içeren tek bir grup iletisinin yapılandırılmış iki agent'dan farklı ve görünür yanıtlar üretebildiğini doğrulayan `whatsapp-broadcast-group-fanout` senaryosunu içerir.

## Yapılandırma

### Temel kurulum

Üst düzey bir `broadcast` bölümü (`bindings` ile aynı düzeyde) ekleyin. Anahtarlar WhatsApp eş kimlikleri, değerler ise agent kimliği dizileridir:

- grup sohbetleri: grup JID'si (ör. `120363403215116621@g.us`)
- doğrudan mesajlar: gönderenin E.164 telefon numarası (ör. `+15551234567`)

```json
{
  "broadcast": {
    "120363403215116621@g.us": ["alfred", "baerbel", "assistant3"]
  }
}
```

**Sonuç:** OpenClaw bu sohbette yanıt vereceği zaman üç agent'ı da çalıştırır.

Listelenen her agent kimliği `agents.list` içinde bulunmalıdır: yapılandırma doğrulaması bilinmeyen kimlikleri bildirir ve çalışma zamanı bunları `Broadcast agent <id> not found in agents.list; skipping` uyarısıyla atlar.

### İşleme stratejisi

`broadcast.strategy`, agent'ların iletiyi nasıl işleyeceğini belirler:

| Strateji             | Davranış                                                                       |
| -------------------- | ------------------------------------------------------------------------------ |
| `parallel` (varsayılan) | Tüm agent'lar eşzamanlı işler; yanıtlar herhangi bir sırada gelebilir.       |
| `sequential`         | Agent'lar dizi sırasıyla işler; her biri öncekinin tamamlanmasını bekler.       |

```json
{
  "broadcast": {
    "strategy": "sequential",
    "120363403215116621@g.us": ["alfred", "baerbel"]
  }
}
```

### Eksiksiz örnek

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

## Nasıl çalışır?

### İleti akışı

<Steps>
  <Step title="Gelen ileti ulaşır">
    Bir WhatsApp grup iletisi veya doğrudan mesaj ulaşır.
  </Step>
  <Step title="Yönlendirme ve kabul">
    OpenClaw kanal izin listelerini, grup etkinleştirme kurallarını ve yapılandırılmış ACP bağlama sahipliğini uygular.
  </Step>
  <Step title="Yayın denetimi">
    Yapılandırılmış hiçbir ACP bağlaması yönlendirmenin sahibi değilse OpenClaw, eş kimliğinin `broadcast` içinde bulunup bulunmadığını denetler.
  </Step>
  <Step title="Yayın uygulanırsa">
    - Listelenen tüm agent'lar iletiyi işler.
    - Her agent'ın kendi oturum anahtarı ve yalıtılmış bağlamı vardır.
    - Agent'lar paralel (varsayılan) veya sıralı biçimde işler.
    - Ses ekleri dağıtımdan önce bir kez metne dönüştürülür; böylece agent'lar ayrı STT çağrıları yapmak yerine tek bir dökümü paylaşır.

  </Step>
  <Step title="Yayın uygulanmazsa">
    OpenClaw, sıradan yönlendirmeyi veya yönlendirme sırasında seçilen yapılandırılmış ACP oturum yönlendirmesini gönderir.
  </Step>
</Steps>

<Note>
Yayın grupları, kanal izin listelerini veya grup etkinleştirme kurallarını (bahsetmeler/komutlar/vb.) atlamaz. Yalnızca bir ileti işlenmeye uygun olduğunda _hangi agent'ların çalışacağını_ değiştirir.
</Note>

### Oturum yalıtımı

Bir yayın grubundaki her agent aşağıdakileri tamamen ayrı tutar:

- **Oturum anahtarları** (`agent:alfred:whatsapp:group:120363...` ile `agent:baerbel:whatsapp:group:120363...`)
- **Konuşma geçmişi** (bir agent diğer agent'ların yanıtlarını görmez)
- **Çalışma alanı** (yapılandırılmışsa ayrı korumalı alanlar)
- **Araç erişimi** (farklı izin/verme listeleri)
- **Bellek/bağlam** (ayrı `IDENTITY.md`, `SOUL.md` vb.)

Bir istisna kasıtlı olarak paylaşılır: **grup bağlam arabelleği** (bağlam için kullanılan son grup iletileri) eş başına paylaşılır; böylece tüm yayın agent'ları tetiklendiklerinde aynı bağlamı görür. Dağıtım tamamlandıktan sonra bir kez temizlenir.

Bu, her agent'ın farklı kişiliklere, modellere, becerilere ve araç erişimine (örneğin salt okunur veya okuma-yazma) sahip olmasını sağlar.

### Örnek: yalıtılmış oturumlar

`["alfred", "baerbel"]` agent'larının bulunduğu `120363403215116621@g.us` grubunda:

<Tabs>
  <Tab title="Alfred'ın bağlamı">
    ```text
    Session: agent:alfred:whatsapp:group:120363403215116621@g.us
    History: [user message, alfred's previous responses]
    Workspace: ~/openclaw-alfred/
    Tools: read, write, exec
    ```
  </Tab>
  <Tab title="Baerbel'in bağlamı">
    ```text
    Session: agent:baerbel:whatsapp:group:120363403215116621@g.us
    History: [user message, baerbel's previous responses]
    Workspace: ~/openclaw-baerbel/
    Tools: read only
    ```
  </Tab>
</Tabs>

## Kullanım alanları

- **Uzmanlaşmış agent ekipleri**: `code-reviewer`, `security-auditor`, `test-generator` ve `docs-checker` agent'larının aynı iletiyi kendi bakış açılarından yanıtladığı bir geliştirme grubu.
- **Çok dilli destek**: `support-en`, `support-de` ve `support-es` agent'larının kendi dillerinde yanıt verdiği tek bir destek sohbeti.
- **Kalite güvencesi**: `support-agent` yanıt verirken `qa-agent` inceleme yapar ve yalnızca sorun bulduğunda yanıt verir.
- **Görev otomasyonu**: `task-tracker`, `time-logger` ve `report-generator` agent'larının tümü aynı durum güncellemesini işler.

## En iyi uygulamalar

<AccordionGroup>
  <Accordion title="1. Agent'ları odaklı tutun">
    Tek bir genel "dev-helper" agent'ı yerine her agent'a tek ve açık bir sorumluluk (`formatter`, `linter`, `tester`) verin.
  </Accordion>
  <Accordion title="2. Açıklayıcı kimlikler ve adlar kullanın">
    ```json
    {
      "agents": {
        "list": [
          { "id": "security-scanner", "name": "Security Scanner" },
          { "id": "code-formatter", "name": "Code Formatter" },
          { "id": "test-generator", "name": "Test Generator" }
        ]
      }
    }
    ```
  </Accordion>
  <Accordion title="3. Farklı araç erişimleri yapılandırın">
    ```json
    {
      "agents": {
        "list": [
          { "id": "reviewer", "tools": { "allow": ["read", "exec"] } },
          { "id": "fixer", "tools": { "allow": ["read", "write", "edit", "exec"] } }
        ]
      }
    }
    ```

    `reviewer` salt okunurdur. `fixer` okuyabilir ve yazabilir.

  </Accordion>
  <Accordion title="4. Performansı izleyin">
    Çok sayıda agent kullanırken `"strategy": "parallel"` (varsayılan) seçeneğini tercih edin, yayın gruplarını birkaç agent ile sınırlı tutun ve daha basit agent'lar için daha hızlı modeller kullanın.
  </Accordion>
  <Accordion title="5. Hatalar yalıtılmış kalır">
    Agent'lar birbirinden bağımsız olarak başarısız olur. Bir agent'ın hatası günlüğe kaydedilir (`Broadcast agent <id> failed: ...`) ve diğerlerini engellemez.
  </Accordion>
</AccordionGroup>

## Uyumluluk

### Sağlayıcılar

Yayın grupları şu anda yalnızca WhatsApp (web kanalı) için uygulanmıştır. Diğer kanallar `broadcast` yapılandırmasını yok sayar.

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

- `GROUP_A`: yalnızca alfred yanıt verir (normal yönlendirme).
- `GROUP_B`: agent1 VE agent2 yanıt verir (yayın).

<Note>
**Öncelik:** `broadcast`, sıradan yönlendirme bağlamalarından önceliklidir. Yapılandırılmış ACP bağlamaları (`bindings[].type="acp"`) özeldir: biri eşleştiğinde OpenClaw, dağıtımlı yayın yerine yapılandırılmış ACP oturumuna gönderir.
</Note>

## Sorun giderme

<AccordionGroup>
  <Accordion title="Agent'lar yanıt vermiyor">
    **Denetleyin:**

    1. Agent kimlikleri `agents.list` içinde bulunuyor (yapılandırma doğrulaması bilinmeyen kimlikleri reddeder).
    2. Eş kimliği biçimi doğru (gruplar için `120363403215116621@g.us` gibi bir grup JID'si veya doğrudan mesajlar için `+15551234567` gibi bir E.164 numarası).
    3. İleti normal geçiş denetimlerini geçti (bahsetme/etkinleştirme kuralları geçerliliğini korur).

    **Hata ayıklama:**

    ```bash
    openclaw logs --follow | grep -i broadcast
    ```

    Başarılı bir dağıtım, günlüğe `Broadcasting message to <n> agents (<strategy>)` kaydını yazar.

  </Accordion>
  <Accordion title="Yalnızca bir agent yanıt veriyor">
    **Neden:** eş kimliği sıradan yönlendirme bağlamalarında bulunuyor ancak `broadcast` içinde bulunmuyor olabilir veya özel bir yapılandırılmış ACP bağlamasıyla eşleşebilir.

    **Düzeltme:** sıradan yönlendirmeye bağlı eşleri yayın yapılandırmasına ekleyin veya dağıtımlı yayın isteniyorsa yapılandırılmış ACP bağlamasını kaldırın/değiştirin.

  </Accordion>
  <Accordion title="Performans sorunları">
    Çok sayıda agent kullanıldığında yavaşsa grup başına agent sayısını azaltın, daha hafif modeller kullanın ve korumalı alan başlatma süresini denetleyin.
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

    Gruptaki tek bir kod parçacığı dört yanıt üretir: biçimlendirme düzeltmeleri, bir güvenlik bulgusu, bir kapsam eksikliği ve küçük bir dokümantasyon sorunu.

  </Accordion>
  <Accordion title="Örnek 2: Çok dilli işlem hattı">
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
  Agent'ların nasıl işleneceğini belirler. `parallel` tüm agent'ları eşzamanlı çalıştırır; `sequential` ise onları dizi sırasıyla çalıştırır.
</ParamField>
<ParamField path="[peerId]" type="string[]">
  WhatsApp grup JID'si veya E.164 telefon numarası. Değer, bu eşten gelen iletileri işlemesi gereken tüm agent kimliklerinin dizisidir.
</ParamField>

## Sınırlamalar

1. **En fazla agent sayısı:** kesin bir sınır yoktur ancak çok sayıda agent (10+) yavaş olabilir.
2. **Paylaşılan bağlam:** agent'lar birbirlerinin yanıtlarını görmez (tasarım gereği).
3. **İleti sıralaması:** paralel yanıtlar herhangi bir sırada gelebilir.
4. **Hız sınırları:** tüm yanıtlar tek bir WhatsApp hesabından gelir; bu nedenle her agent'ın yanıtı aynı WhatsApp hız sınırlarına dâhil edilir.

## İlgili

- [Kanal yönlendirme](/tr/channels/channel-routing)
- [Gruplar](/tr/channels/groups)
- [Çok aracılı korumalı alan araçları](/tr/tools/multi-agent-sandbox-tools)
- [Eşleştirme](/tr/channels/pairing)
- [Oturum yönetimi](/tr/concepts/session)
