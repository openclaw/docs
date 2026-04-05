---
read_when:
    - Betiklerden tek bir agent turu çalıştırmak istediğinizde (isteğe bağlı olarak yanıtı iletme)
summary: '`openclaw agent` için CLI başvurusu (Gateway üzerinden tek bir agent turu gönderin)'
title: agent
x-i18n:
    generated_at: "2026-04-05T13:47:36Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0627f943bc7f3556318008f76dc6150788cf06927dccdc7d2681acb98f257d56
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Gateway üzerinden bir agent turu çalıştırın (gömülü kullanım için `--local` kullanın).
Yapılandırılmış bir agent'ı doğrudan hedeflemek için `--agent <id>` kullanın.

En az bir oturum seçici belirtin:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

İlgili:

- Agent gönderme aracı: [Agent send](/tools/agent-send)

## Seçenekler

- `-m, --message <text>`: gerekli ileti gövdesi
- `-t, --to <dest>`: oturum anahtarını türetmek için kullanılan alıcı
- `--session-id <id>`: açık oturum kimliği
- `--agent <id>`: agent kimliği; yönlendirme bağlarını geçersiz kılar
- `--thinking <off|minimal|low|medium|high|xhigh>`: agent düşünme seviyesi
- `--verbose <on|off>`: ayrıntı düzeyini oturum için kalıcı hale getir
- `--channel <channel>`: teslimat kanalı; ana oturum kanalını kullanmak için boş bırakın
- `--reply-to <target>`: teslimat hedefi geçersiz kılması
- `--reply-channel <channel>`: teslimat kanalı geçersiz kılması
- `--reply-account <id>`: teslimat hesabı geçersiz kılması
- `--local`: gömülü agent'ı doğrudan çalıştır (eklenti kayıt defteri ön yüklemesinden sonra)
- `--deliver`: yanıtı seçilen kanal/hedefe geri gönder
- `--timeout <seconds>`: agent zaman aşımını geçersiz kıl (varsayılan 600 veya yapılandırma değeri)
- `--json`: JSON çıktısı ver

## Örnekler

```bash
openclaw agent --to +15555550123 --message "status update" --deliver
openclaw agent --agent ops --message "Summarize logs"
openclaw agent --session-id 1234 --message "Summarize inbox" --thinking medium
openclaw agent --to +15555550123 --message "Trace logs" --verbose on --json
openclaw agent --agent ops --message "Generate report" --deliver --reply-channel slack --reply-to "#reports"
openclaw agent --agent ops --message "Run locally" --local
```

## Notlar

- Gateway modu, Gateway isteği başarısız olduğunda gömülü agent'a geri döner. Baştan itibaren gömülü yürütmeyi zorlamak için `--local` kullanın.
- `--local` yine de önce eklenti kayıt defterini önceden yükler; böylece eklenti tarafından sağlanan sağlayıcılar, araçlar ve kanallar gömülü çalıştırmalar sırasında kullanılabilir kalır.
- `--channel`, `--reply-channel` ve `--reply-account`, oturum yönlendirmesini değil, yanıt teslimini etkiler.
- Bu komut `models.json` yeniden oluşturmayı tetiklediğinde, SecretRef tarafından yönetilen sağlayıcı kimlik bilgileri çözülmüş düz gizli metin olarak değil, gizli olmayan işaretleyiciler olarak kalıcı hale getirilir (örneğin ortam değişkeni adları, `secretref-env:ENV_VAR_NAME` veya `secretref-managed`).
- İşaretleyici yazımları kaynak açısından yetkilidir: OpenClaw, çözülmüş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsündeki işaretleyicileri kalıcı hale getirir.
