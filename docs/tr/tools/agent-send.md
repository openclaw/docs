---
read_when:
    - Aracı çalıştırmalarını betiklerden veya komut satırından tetiklemek istiyorsunuz
    - Agent yanıtlarını programlı olarak bir sohbet kanalına iletmeniz gerekir.
summary: CLI üzerinden agent turlarını çalıştırın ve isteğe bağlı olarak yanıtları kanallara iletin
title: Ajan gönderimi
x-i18n:
    generated_at: "2026-07-12T12:51:09Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 23ad57735bd43a2bba5add571e9572da0fbe7b516a70515c674e1ababaab081a
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent`, gelen bir sohbet mesajı olmadan komut satırından tek bir ajan turu çalıştırır. Betik tabanlı iş akışları, testler ve programlı teslimat için kullanın. Tüm bayrakların ve davranışların başvurusu:
[Ajan CLI başvurusu](/tr/cli/agent).

## Hızlı başlangıç

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Mesajı Gateway üzerinden gönderir ve yanıtı yazdırır.

  </Step>

  <Step title="Send a multiline prompt from a file">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Geçerli bir UTF-8 dosyasını ajan mesajının gövdesi olarak okur.

  </Step>

  <Step title="Target a specific agent or session">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"

    # Target an exact session key
    openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"
    ```

  </Step>

  <Step title="Deliver the reply to a channel">
    ```bash
    # Deliver to WhatsApp (default channel)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Deliver to Slack
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Bayraklar

| Bayrak                      | Açıklama                                                             |
| --------------------------- | -------------------------------------------------------------------- |
| `--message <text>`          | Gönderilecek satır içi mesaj                                         |
| `--message-file <path>`     | Mesajı geçerli bir UTF-8 dosyasından oku                             |
| `--to <dest>`               | Oturum anahtarını bir hedeften (telefon, sohbet kimliği) türet       |
| `--session-key <key>`       | Açıkça belirtilen bir oturum anahtarı kullan                          |
| `--agent <id>`              | Yapılandırılmış bir ajanı hedefle (`main` oturumunu kullanır)        |
| `--session-id <id>`         | Mevcut bir oturumu kimliğine göre yeniden kullan                     |
| `--model <id>`              | Bu çalıştırma için model geçersiz kılması (`provider/model` veya model kimliği) |
| `--local`                   | Yerel gömülü çalışma zamanını zorla (Gateway'i atla)                 |
| `--deliver`                 | Yanıtı bir sohbet kanalına gönder                                    |
| `--channel <name>`          | Teslimat kanalı; `--agent` + `--to` ile doğrudan mesaj kapsamına da uygulanır |
| `--reply-to <target>`       | Teslimat hedefini geçersiz kıl                                       |
| `--reply-channel <name>`    | Teslimat kanalını geçersiz kıl                                       |
| `--reply-account <id>`      | Teslimat hesabı kimliğini geçersiz kıl                               |
| `--thinking <level>`        | Seçilen model profili için düşünme düzeyini ayarla                   |
| `--verbose <on\|full\|off>` | Ayrıntı düzeyini oturum için kalıcı hâle getir (`full`, araç çıktısını da günlüğe kaydeder) |
| `--timeout <seconds>`       | Ajan zaman aşımını geçersiz kıl (varsayılan 600 veya yapılandırma değeri) |
| `--json`                    | Yapılandırılmış JSON çıktısı üret                                    |

## Davranış

- CLI varsayılan olarak **Gateway üzerinden** çalışır. Geçerli makinedeki gömülü çalışma zamanını zorlamak için `--local` ekleyin.
- `--message` veya `--message-file` seçeneklerinden tam olarak birini iletin. Dosya mesajları, isteğe bağlı UTF-8 BOM kaldırıldıktan sonra çok satırlı içeriği korur.
- Gateway isteği başarısız olursa CLI, yerel gömülü çalıştırmaya **geri döner**; Gateway zaman aşımında, özgün transkriptle yarışmak yerine yeni bir oturumla geri dönüş yapılır.
- Oturum seçimi: `--to`, oturum anahtarını türetir (grup/kanal hedefleri yalıtımı korur; doğrudan sohbetler `main` altında birleştirilir). `--agent`, `--channel` ve `--to` birlikte kullanıldığında yönlendirme, kanalın standart alıcısını ve `session.dmScope` değerini izler. Yalnızca giden iletiler için kullanılan kararlı kimlikler, ajanın ana oturumundan yalıtılmış ve sağlayıcıya ait bir oturum kullanır.
- `--session-key`, açıkça belirtilen bir anahtarı seçer. Ajan önekli anahtarlar `agent:<agent-id>:<session-key>` biçimini kullanmalıdır ve her ikisi de sağlandığında `--agent` bu ajan kimliğiyle eşleşmelidir. Özel işaretçi olmayan yalın anahtarlar, sağlandığında `--agent` kapsamına alınır; örneğin `--agent ops --session-key incident-42`, `agent:ops:incident-42` hedefine yönlendirilir. `--agent` olmadan, özel işaretçi olmayan yalın anahtarlar yapılandırılmış varsayılan ajanın kapsamına alınır. Değişmez `global` ve `unknown` değerleri, yalnızca `--agent` sağlanmadığında kapsam dışı kalır; gömülü geri dönüş yolu bu özel işaretçi oturumlarını yapılandırılmış varsayılan ajana çözümler.
- `--reply-channel` ve `--reply-account` yalnızca teslimatı etkiler.
- Düşünme ve ayrıntı bayrakları oturum deposunda kalıcı hâle getirilir.
- Çıktı varsayılan olarak düz metindir; yapılandırılmış yük ve meta veriler için `--json` kullanılır.
- `--json --deliver` ile JSON; gönderilen, engellenen, kısmen tamamlanan ve başarısız gönderimlerin teslimat durumunu içerir. Bkz. [JSON teslimat durumu](/tr/cli/agent#json-delivery-status).

## Örnekler

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with a model override
openclaw agent --agent ops --model openai/gpt-5.4 --message "Summarize logs"

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Multiline prompt from a file
openclaw agent --agent ops --message-file ./task.md

# Exact session key
openclaw agent --session-key agent:ops:incident-42 --message "Summarize status"

# Legacy key scoped to an agent
openclaw agent --agent ops --session-key incident-42 --message "Summarize status"

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## İlgili içerikler

<CardGroup cols={2}>
  <Card title="Agent CLI reference" href="/tr/cli/agent" icon="terminal">
    Tüm `openclaw agent` bayraklarının ve seçeneklerinin başvurusu.
  </Card>
  <Card title="Sub-agents" href="/tr/tools/subagents" icon="users">
    Arka planda alt ajan oluşturma.
  </Card>
  <Card title="Sessions" href="/tr/concepts/session" icon="comments">
    Oturum anahtarlarının nasıl çalıştığı ve `--to`, `--agent` ile `--session-id` seçeneklerinin bunları nasıl çözümlediği.
  </Card>
  <Card title="Slash commands" href="/tr/tools/slash-commands" icon="slash">
    Ajan oturumlarında kullanılan yerel komut kataloğu.
  </Card>
</CardGroup>
