---
read_when:
    - Betiklerden tek bir ajan turu çalıştırmak istiyorsunuz (isteğe bağlı olarak yanıtı iletme)
summary: '`openclaw agent` için CLI başvurusu (Gateway üzerinden tek bir ajan turu gönderme)'
title: Ajan
x-i18n:
    generated_at: "2026-04-24T09:00:59Z"
    model: gpt-5.4
    provider: openai
    source_hash: c4d57b8e368891a0010b053a7504d6313ad2233b5f5f43b34be1f9aa92caa86c
    source_path: cli/agent.md
    workflow: 15
---

# `openclaw agent`

Gateway üzerinden bir ajan turu çalıştırın (gömülü çalışma için `--local` kullanın).
Yapılandırılmış bir ajanı doğrudan hedeflemek için `--agent <id>` kullanın.

En az bir oturum seçici iletin:

- `--to <dest>`
- `--session-id <id>`
- `--agent <id>`

İlgili:

- Ajan gönderme aracı: [Agent send](/tr/tools/agent-send)

## Seçenekler

- `-m, --message <text>`: gerekli mesaj gövdesi
- `-t, --to <dest>`: oturum anahtarını türetmek için kullanılan alıcı
- `--session-id <id>`: açık oturum kimliği
- `--agent <id>`: ajan kimliği; yönlendirme bağlarını geçersiz kılar
- `--thinking <level>`: ajan düşünme düzeyi (`off`, `minimal`, `low`, `medium`, `high` ve `xhigh`, `adaptive` veya `max` gibi sağlayıcı tarafından desteklenen özel düzeyler)
- `--verbose <on|off>`: ayrıntılı düzeyi oturum için kalıcı yap
- `--channel <channel>`: teslimat kanalı; ana oturum kanalını kullanmak için boş bırakın
- `--reply-to <target>`: teslimat hedefi geçersiz kılması
- `--reply-channel <channel>`: teslimat kanalı geçersiz kılması
- `--reply-account <id>`: teslimat hesabı geçersiz kılması
- `--local`: gömülü ajanı doğrudan çalıştır (Plugin kayıt defteri ön yüklemesinden sonra)
- `--deliver`: yanıtı seçilen kanal/hedefe geri gönder
- `--timeout <seconds>`: ajan zaman aşımını geçersiz kıl (varsayılan 600 veya yapılandırma değeri)
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

- Gateway modu, Gateway isteği başarısız olduğunda gömülü ajana geri düşer. Baştan itibaren gömülü yürütmeyi zorlamak için `--local` kullanın.
- `--local`, Plugin tarafından sağlanan sağlayıcıların, araçların ve kanalların gömülü çalıştırmalar sırasında kullanılabilir kalması için önce yine de Plugin kayıt defterini önceden yükler.
- `--channel`, `--reply-channel` ve `--reply-account`, oturum yönlendirmesini değil, yanıt teslimatını etkiler.
- Bu komut `models.json` yeniden üretimini tetiklediğinde, SecretRef tarafından yönetilen sağlayıcı kimlik bilgileri çözülmüş düz metin gizli bilgiler olarak değil, gizli olmayan işaretçiler olarak kalıcılaştırılır (örneğin ortam değişkeni adları, `secretref-env:ENV_VAR_NAME` veya `secretref-managed`).
- İşaretçi yazımları kaynak açısından yetkilidir: OpenClaw, işaretçileri çözülmüş çalışma zamanı gizli değerlerinden değil, etkin kaynak yapılandırma anlık görüntüsünden kalıcılaştırır.

## İlgili

- [CLI başvurusu](/tr/cli)
- [Ajan çalışma zamanı](/tr/concepts/agent)
