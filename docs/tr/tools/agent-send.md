---
read_when:
    - Ajan çalıştırmalarını script'lerden veya komut satırından tetiklemek istiyorsunuz
    - Ajan yanıtlarını programatik olarak bir sohbet kanalına teslim etmeniz gerekiyor
summary: Ajan turlarını CLI'den çalıştırın ve isteğe bağlı olarak yanıtları kanallara teslim edin
title: Ajan gönderimi
x-i18n:
    generated_at: "2026-04-24T09:32:56Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8f29ab906ed8179b265138ee27312c8f4b318d09b73ad61843fca6809c32bd31
    source_path: tools/agent-send.md
    workflow: 15
---

`openclaw agent`, gelen bir sohbet mesajına ihtiyaç duymadan komut satırından tek bir ajan turu çalıştırır. Bunu script'lenmiş iş akışları, test ve programatik teslim için kullanın.

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
    # Belirli bir ajanı hedefle
    openclaw agent --agent ops --message "Summarize logs"

    # Bir telefon numarasını hedefle (oturum anahtarını türetir)
    openclaw agent --to +15555550123 --message "Status update"

    # Mevcut bir oturumu yeniden kullan
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Yanıtı bir kanala teslim edin">
    ```bash
    # WhatsApp'a teslim et (varsayılan kanal)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Slack'e teslim et
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Bayraklar

| Bayrak                        | Açıklama                                                    |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Gönderilecek mesaj (gerekli)                                |
| `--to \<dest\>`               | Bir hedeften oturum anahtarı türetir (telefon, sohbet kimliği) |
| `--agent \<id\>`              | Yapılandırılmış bir ajanı hedefler (`main` oturumunu kullanır) |
| `--session-id \<id\>`         | Kimliğe göre mevcut bir oturumu yeniden kullanır            |
| `--local`                     | Yerel gömülü çalışma zamanını zorlar (Gateway'i atlar)      |
| `--deliver`                   | Yanıtı bir sohbet kanalına gönderir                         |
| `--channel \<name\>`          | Teslim kanalı (whatsapp, telegram, discord, slack, vb.)    |
| `--reply-to \<target\>`       | Teslim hedefi geçersiz kılması                              |
| `--reply-channel \<name\>`    | Teslim kanalı geçersiz kılması                              |
| `--reply-account \<id\>`      | Teslim hesap kimliği geçersiz kılması                       |
| `--thinking \<level\>`        | Seçilen model profile'ı için thinking düzeyini ayarlar      |
| `--verbose \<on\|full\|off\>` | Verbose düzeyini ayarlar                                    |
| `--timeout \<seconds\>`       | Ajan zaman aşımını geçersiz kılar                           |
| `--json`                      | Yapılandırılmış JSON çıktısı                                |

## Davranış

- Varsayılan olarak CLI, **Gateway üzerinden** gider. Bunu geçerli makinedeki gömülü çalışma zamanına zorlamak için `--local` ekleyin.
- Gateway'e erişilemezse CLI, **yerel gömülü çalıştırmaya geri düşer**.
- Oturum seçimi: `--to`, oturum anahtarını türetir (grup/kanal hedefleri yalıtımı korur; doğrudan sohbetler `main` içine çöker).
- Thinking ve verbose bayrakları oturum deposunda kalıcı olur.
- Çıktı: varsayılan olarak düz metin veya yapılandırılmış payload + meta veri için `--json`.

## Örnekler

```bash
# JSON çıktılı basit tur
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Thinking düzeyi ile tur
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Oturumdan farklı bir kanala teslim et
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## İlgili

- [Agent CLI başvurusu](/tr/cli/agent)
- [Alt ajanlar](/tr/tools/subagents) — arka plan alt ajan başlatma
- [Oturumlar](/tr/concepts/session) — oturum anahtarlarının nasıl çalıştığı
