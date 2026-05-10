---
read_when:
    - Ajan çalıştırmalarını betiklerden veya komut satırından tetiklemek istiyorsunuz
    - Ajan yanıtlarını programatik olarak bir sohbet kanalına iletmeniz gerekir
summary: Ajan turlarını CLI'dan çalıştırın ve isteğe bağlı olarak yanıtları kanallara iletin
title: Aracı gönderimi
x-i18n:
    generated_at: "2026-05-10T19:56:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: a2e1b05414312321e7136867bb8b998754d4a46289cc02764eb61d83f7239af1
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent`, gelen bir sohbet mesajına gerek olmadan komut satırından tek bir agent turu çalıştırır. Betikli iş akışları, test etme ve programatik teslimat için kullanın.

## Hızlı başlangıç

<Steps>
  <Step title="Run a simple agent turn">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Bu, mesajı Gateway üzerinden gönderir ve yanıtı yazdırır.

  </Step>

  <Step title="Target a specific agent or session">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
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

| Bayrak                        | Açıklama                                                    |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Gönderilecek mesaj (zorunlu)                                |
| `--to \<dest\>`               | Bir hedeften oturum anahtarı türetir (telefon, sohbet kimliği) |
| `--agent \<id\>`              | Yapılandırılmış bir agent’ı hedefler (`main` oturumunu kullanır) |
| `--session-id \<id\>`         | Mevcut bir oturumu kimliğine göre yeniden kullanır          |
| `--local`                     | Yerel gömülü çalışma zamanını zorlar (Gateway’i atlar)      |
| `--deliver`                   | Yanıtı bir sohbet kanalına gönderir                         |
| `--channel \<name\>`          | Teslimat kanalı (whatsapp, telegram, discord, slack vb.)    |
| `--reply-to \<target\>`       | Teslimat hedefi geçersiz kılma                              |
| `--reply-channel \<name\>`    | Teslimat kanalı geçersiz kılma                              |
| `--reply-account \<id\>`      | Teslimat hesabı kimliği geçersiz kılma                      |
| `--thinking \<level\>`        | Seçili model profili için düşünme düzeyini ayarlar          |
| `--verbose \<on\|full\|off\>` | Ayrıntı düzeyini ayarlar                                    |
| `--timeout \<seconds\>`       | Agent zaman aşımını geçersiz kılar                          |
| `--json`                      | Yapılandırılmış JSON çıktısı verir                          |

## Davranış

- Varsayılan olarak CLI **Gateway üzerinden** gider. Geçerli makinede gömülü çalışma zamanını zorlamak için `--local` ekleyin.
- Gateway’e ulaşılamazsa CLI yerel gömülü çalıştırmaya **geri döner**.
- Oturum seçimi: `--to` oturum anahtarını türetir (grup/kanal hedefleri yalıtımı korur; doğrudan sohbetler `main` altında birleşir).
- Düşünme ve ayrıntı bayrakları oturum deposunda kalıcı olur.
- Çıktı: varsayılan olarak düz metin ya da yapılandırılmış yük + meta veriler için `--json`.
- `--json --deliver` ile JSON; gönderilen, bastırılan, kısmi ve başarısız gönderimler için teslimat durumunu içerir. Bkz. [JSON teslimat durumu](/tr/cli/agent#json-delivery-status).

## Örnekler

```bash
# Simple turn with JSON output
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Turn with thinking level
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Deliver to a different channel than the session
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## İlgili

<CardGroup cols={2}>
  <Card title="Agent CLI reference" href="/tr/cli/agent" icon="terminal">
    Tam `openclaw agent` bayrak ve seçenek başvurusu.
  </Card>
  <Card title="Sub-agents" href="/tr/tools/subagents" icon="users">
    Arka plan alt agent oluşturma.
  </Card>
  <Card title="Sessions" href="/tr/concepts/session" icon="comments">
    Oturum anahtarlarının nasıl çalıştığı ve `--to`, `--agent` ile `--session-id` değerlerinin bunları nasıl çözdüğü.
  </Card>
  <Card title="Slash commands" href="/tr/tools/slash-commands" icon="slash">
    Agent oturumlarında kullanılan yerel komut kataloğu.
  </Card>
</CardGroup>
