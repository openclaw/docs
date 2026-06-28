---
read_when:
    - Ajan çalıştırmalarını betiklerden veya komut satırından tetiklemek istiyorsunuz
    - Ajan yanıtlarını programatik olarak bir sohbet kanalına iletmeniz gerekiyor
summary: Ajan turlarını CLI'den çalıştırın ve isteğe bağlı olarak yanıtları kanallara iletin
title: Ajan gönderimi
x-i18n:
    generated_at: "2026-06-28T01:20:30Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 25026258a5a47c87fbf99689de5ea16d827b11af07bc5ce4f6c3e2bda6466b46
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent`, gelen bir sohbet mesajına gerek kalmadan komut satırından tek bir agent turu çalıştırır. Bunu betiklenmiş iş akışları, test ve programatik teslim için kullanın.

## Hızlı başlangıç

<Steps>
  <Step title="Basit bir agent turu çalıştırın">
    ```bash
    openclaw agent --agent main --message "What is the weather today?"
    ```

    Bu, mesajı Gateway üzerinden gönderir ve yanıtı yazdırır.

  </Step>

  <Step title="Bir dosyadan çok satırlı prompt gönderin">
    ```bash
    openclaw agent --agent ops --message-file ./task.md
    ```

    Bu, geçerli bir UTF-8 dosyasını agent mesaj gövdesi olarak okur.

  </Step>

  <Step title="Belirli bir agent veya oturumu hedefleyin">
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

  <Step title="Yanıtı bir kanala teslim edin">
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

| Bayrak                        | Açıklama                                                    |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Gönderilecek satır içi mesaj                                |
| `--message-file \<path\>`     | Mesajı geçerli bir UTF-8 dosyasından oku                    |
| `--to \<dest\>`               | Bir hedeften (telefon, sohbet kimliği) oturum anahtarı türet |
| `--session-key \<key\>`       | Açık bir oturum anahtarı kullan                             |
| `--agent \<id\>`              | Yapılandırılmış bir agent'ı hedefle (`main` oturumunu kullanır) |
| `--session-id \<id\>`         | Mevcut bir oturumu kimliğe göre yeniden kullan              |
| `--local`                     | Yerel gömülü çalışma zamanını zorla (Gateway'i atla)        |
| `--deliver`                   | Yanıtı bir sohbet kanalına gönder                           |
| `--channel \<name\>`          | Teslim kanalı (whatsapp, telegram, discord, slack, vb.)     |
| `--reply-to \<target\>`       | Teslim hedefi geçersiz kılması                              |
| `--reply-channel \<name\>`    | Teslim kanalı geçersiz kılması                              |
| `--reply-account \<id\>`      | Teslim hesap kimliği geçersiz kılması                       |
| `--thinking \<level\>`        | Seçili model profili için düşünme düzeyini ayarla           |
| `--verbose \<on\|full\|off\>` | Ayrıntılılık düzeyini ayarla                                |
| `--timeout \<seconds\>`       | Agent zaman aşımını geçersiz kıl                            |
| `--json`                      | Yapılandırılmış JSON çıktısı üret                           |

## Davranış

- Varsayılan olarak CLI **Gateway üzerinden** gider. Mevcut makinede gömülü çalışma zamanını zorlamak için `--local` ekleyin.
- `--message` veya `--message-file` seçeneklerinden tam olarak birini geçirin. Dosya mesajları, isteğe bağlı bir UTF-8 BOM kaldırıldıktan sonra çok satırlı içeriği korur.
- Gateway'e ulaşılamazsa CLI, yerel gömülü çalıştırmaya **geri döner**.
- Oturum seçimi: `--to` oturum anahtarını türetir (grup/kanal hedefleri izolasyonu korur; doğrudan sohbetler `main` altında birleşir).
- `--session-key` açık bir anahtar seçer. Agent önekli anahtarlar `agent:<agent-id>:<session-key>` kullanmalıdır ve ikisi de sağlandığında `--agent` o agent kimliğiyle eşleşmelidir. Çıplak sentinel olmayan anahtarlar, sağlandığında `--agent` kapsamına alınır; örneğin, `--agent ops --session-key incident-42`, `agent:ops:incident-42` hedefine yönlendirilir. `--agent` olmadan, çıplak sentinel olmayan anahtarlar yapılandırılmış varsayılan agent kapsamına alınır. Gerçek `global` ve `unknown`, yalnızca `--agent` sağlanmadığında kapsamsız kalır; bu durumda gömülü geri dönüş ve depo sahipliği yapılandırılmış varsayılan agent'ı kullanır.
- Düşünme ve ayrıntılılık bayrakları oturum deposuna kalıcı olarak yazılır.
- Çıktı: varsayılan olarak düz metin veya yapılandırılmış yük + meta veriler için `--json`.
- `--json --deliver` ile JSON; gönderilen, bastırılan, kısmi ve başarısız gönderimler için teslim durumunu içerir. Bkz. [JSON teslim durumu](/tr/cli/agent#json-delivery-status).

## Örnekler

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

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

## İlgili

<CardGroup cols={2}>
  <Card title="Agent CLI başvurusu" href="/tr/cli/agent" icon="terminal">
    Tam `openclaw agent` bayrak ve seçenek başvurusu.
  </Card>
  <Card title="Alt agent'lar" href="/tr/tools/subagents" icon="users">
    Arka planda alt agent oluşturma.
  </Card>
  <Card title="Oturumlar" href="/tr/concepts/session" icon="comments">
    Oturum anahtarlarının nasıl çalıştığı ve `--to`, `--agent` ile `--session-id` seçeneklerinin bunları nasıl çözümlediği.
  </Card>
  <Card title="Slash komutları" href="/tr/tools/slash-commands" icon="slash">
    Agent oturumları içinde kullanılan yerel komut kataloğu.
  </Card>
</CardGroup>
