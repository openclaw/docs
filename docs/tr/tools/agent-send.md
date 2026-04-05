---
read_when:
    - Betiklerden veya komut satırından ajan çalıştırmalarını tetiklemek istiyorsunuz
    - Ajan yanıtlarını programatik olarak bir sohbet kanalına iletmeniz gerekiyor
summary: CLI üzerinden ajan turlarını çalıştırın ve isteğe bağlı olarak yanıtları kanallara iletin
title: Agent Send
x-i18n:
    generated_at: "2026-04-05T14:09:38Z"
    model: gpt-5.4
    provider: openai
    source_hash: 42ea2977e89fb28d2afd07e5f6b1560ad627aea8b72fde36d8e324215c710afc
    source_path: tools/agent-send.md
    workflow: 15
---

# Agent Send

`openclaw agent`, gelen bir sohbet mesajına ihtiyaç duymadan komut satırından
tek bir ajan turu çalıştırır. Bunu betik tabanlı iş akışları, testler ve
programatik teslimat için kullanın.

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
    # Belirli bir ajanı hedefleyin
    openclaw agent --agent ops --message "Summarize logs"

    # Bir telefon numarasını hedefleyin (oturum anahtarını türetir)
    openclaw agent --to +15555550123 --message "Status update"

    # Mevcut bir oturumu yeniden kullanın
    openclaw agent --session-id abc123 --message "Continue the task"
    ```

  </Step>

  <Step title="Yanıtı bir kanala iletin">
    ```bash
    # WhatsApp'a ilet (varsayılan kanal)
    openclaw agent --to +15555550123 --message "Report ready" --deliver

    # Slack'e ilet
    openclaw agent --agent ops --message "Generate report" \
      --deliver --reply-channel slack --reply-to "#reports"
    ```

  </Step>
</Steps>

## Bayraklar

| Bayrak                        | Açıklama                                                    |
| ----------------------------- | ----------------------------------------------------------- |
| `--message \<text\>`          | Gönderilecek mesaj (zorunlu)                                |
| `--to \<dest\>`               | Hedeften oturum anahtarı türetir (telefon, sohbet kimliği)  |
| `--agent \<id\>`              | Yapılandırılmış bir ajanı hedefler (onun `main` oturumunu kullanır) |
| `--session-id \<id\>`         | Kimliğe göre mevcut bir oturumu yeniden kullanır            |
| `--local`                     | Yerel gömülü çalışma zamanını zorlar (Gateway'i atlar)      |
| `--deliver`                   | Yanıtı bir sohbet kanalına gönderir                         |
| `--channel \<name\>`          | Teslimat kanalı (whatsapp, telegram, discord, slack vb.)    |
| `--reply-to \<target\>`       | Teslimat hedefi geçersiz kılma                              |
| `--reply-channel \<name\>`    | Teslimat kanalı geçersiz kılma                              |
| `--reply-account \<id\>`      | Teslimat hesap kimliği geçersiz kılma                       |
| `--thinking \<level\>`        | Düşünme düzeyini ayarlar (off, minimal, low, medium, high, xhigh) |
| `--verbose \<on\|full\|off\>` | Verbose düzeyini ayarlar                                    |
| `--timeout \<seconds\>`       | Ajan zaman aşımını geçersiz kılar                           |
| `--json`                      | Yapılandırılmış JSON çıktısı verir                          |

## Davranış

- Varsayılan olarak CLI **Gateway üzerinden** gider. Geçerli makinede gömülü
  çalışma zamanını zorlamak için `--local` ekleyin.
- Gateway'e ulaşılamazsa CLI, **yerel gömülü çalıştırmaya** geri düşer.
- Oturum seçimi: `--to`, oturum anahtarını türetir (grup/kanal hedefleri
  yalıtımı korur; doğrudan sohbetler `main` içine toplanır).
- Thinking ve verbose bayrakları oturum deposunda kalıcı olur.
- Çıktı: varsayılan olarak düz metin veya yapılandırılmış yük + metadata için `--json`.

## Örnekler

```bash
# JSON çıktılı basit tur
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json

# Düşünme düzeyli tur
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium

# Oturumdan farklı bir kanala ilet
openclaw agent --agent ops --message "Alert" --deliver --reply-channel telegram --reply-to "@admin"
```

## İlgili

- [Agent CLI başvurusu](/cli/agent)
- [Sub-agents](/tools/subagents) — arka planda alt ajan başlatma
- [Sessions](/tr/concepts/session) — oturum anahtarlarının nasıl çalıştığı
