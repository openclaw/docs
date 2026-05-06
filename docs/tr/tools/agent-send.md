---
read_when:
    - Ajan çalıştırmalarını betiklerden veya komut satırından tetiklemek istiyorsunuz
    - Ajan yanıtlarını program aracılığıyla bir sohbet kanalına iletmeniz gerekir
summary: Ajan turlarını CLI'dan çalıştırın ve isteğe bağlı olarak yanıtları kanallara iletin
title: Ajan gönderimi
x-i18n:
    generated_at: "2026-05-06T09:32:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1339ebd74e2349669942ff93f200b53a69ad05f2186d6ff76437c779f312a291
    source_path: tools/agent-send.md
    workflow: 16
---

`openclaw agent`, gelen bir sohbet mesajı gerektirmeden komut satırından tek bir ajan turu çalıştırır. Betikli iş akışları, testler ve programatik teslim için kullanın.

## Hızlı başlangıç

<Steps>
  <Step title="Basit bir ajan turu çalıştırın">
    ```bash
    openclaw agent --message "What is the weather today?"
    ```

    Bu, mesajı Gateway üzerinden gönderir ve yanıtı yazdırır.

  </Step>

  <Step title="Belirli bir ajanı veya oturumu hedefleyin">
    ```bash
    # Target a specific agent
    openclaw agent --agent ops --message "Summarize logs"

    # Target a phone number (derives session key)
    openclaw agent --to +15555550123 --message "Status update"

    # Reuse an existing session
    openclaw agent --session-id abc123 --message "Continue the task"
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

| Bayrak                        | Açıklama                                                   |
| ----------------------------- | ---------------------------------------------------------- |
| `--message \<text\>`          | Gönderilecek mesaj (gerekli)                               |
| `--to \<dest\>`               | Bir hedeften (telefon, sohbet kimliği) oturum anahtarı türet |
| `--agent \<id\>`              | Yapılandırılmış bir ajanı hedefle (`main` oturumunu kullanır) |
| `--session-id \<id\>`         | Mevcut bir oturumu kimliğine göre yeniden kullan           |
| `--local`                     | Yerel gömülü çalışma zamanını zorla kullan (Gateway’i atla) |
| `--deliver`                   | Yanıtı bir sohbet kanalına gönder                          |
| `--channel \<name\>`          | Teslim kanalı (whatsapp, telegram, discord, slack vb.)     |
| `--reply-to \<target\>`       | Teslim hedefi geçersiz kılması                             |
| `--reply-channel \<name\>`    | Teslim kanalı geçersiz kılması                             |
| `--reply-account \<id\>`      | Teslim hesabı kimliği geçersiz kılması                     |
| `--thinking \<level\>`        | Seçilen model profili için düşünme düzeyini ayarla         |
| `--verbose \<on\|full\|off\>` | Ayrıntılılık düzeyini ayarla                               |
| `--timeout \<seconds\>`       | Ajan zaman aşımını geçersiz kıl                            |
| `--json`                      | Yapılandırılmış JSON çıktısı ver                           |

## Davranış

- Varsayılan olarak CLI **Gateway üzerinden** gider. Geçerli makinede gömülü çalışma zamanını zorlamak için `--local` ekleyin.
- Gateway’e ulaşılamıyorsa CLI yerel gömülü çalıştırmaya **geri döner**.
- Oturum seçimi: `--to`, oturum anahtarını türetir (grup/kanal hedefleri izolasyonu korur; doğrudan sohbetler `main` altında birleşir).
- Düşünme ve ayrıntılılık bayrakları oturum deposuna kalıcı olarak yazılır.
- Çıktı: varsayılan olarak düz metin veya yapılandırılmış yük + meta veriler için `--json`.

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
  <Card title="Agent CLI referansı" href="/tr/cli/agent" icon="terminal">
    Tam `openclaw agent` bayrak ve seçenek referansı.
  </Card>
  <Card title="Alt ajanlar" href="/tr/tools/subagents" icon="users">
    Arka planda alt ajan oluşturma.
  </Card>
  <Card title="Oturumlar" href="/tr/concepts/session" icon="comments">
    Oturum anahtarlarının nasıl çalıştığı ve `--to`, `--agent` ile `--session-id` değerlerinin bunları nasıl çözdüğü.
  </Card>
  <Card title="Eğik çizgi komutları" href="/tr/tools/slash-commands" icon="slash">
    Ajan oturumlarında kullanılan yerel komut kataloğu.
  </Card>
</CardGroup>
