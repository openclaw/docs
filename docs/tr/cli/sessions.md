---
read_when:
    - Depolanan oturumları listelemek ve son etkinliği görmek istiyorsunuz
summary: '`openclaw sessions` için CLI başvurusu (depolanan oturumları listeleme + kullanım)'
title: Oturumlar
x-i18n:
    generated_at: "2026-04-30T09:14:26Z"
    model: gpt-5.5
    provider: openai
    source_hash: 9fea2014f538b00a27fa0078391a421843052333c5bcfc8100fced515eed0004
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Depolanan konuşma oturumlarını listeleyin.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --verbose
openclaw sessions --json
```

Kapsam seçimi:

- varsayılan: yapılandırılmış varsayılan ajan deposu
- `--verbose`: ayrıntılı günlük kaydı
- `--agent <id>`: tek bir yapılandırılmış ajan deposu
- `--all-agents`: tüm yapılandırılmış ajan depolarını birleştir
- `--store <path>`: açık depo yolu (`--agent` veya `--all-agents` ile birleştirilemez)

Depolanan bir oturum için bir yörünge paketi dışa aktarın:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Bu, sahip exec isteğini onayladıktan sonra `/export-trajectory` slash komutu tarafından kullanılan komut yoludur. Çıktı dizini her zaman seçilen çalışma alanının altında `.openclaw/trajectory-exports/` içinde çözümlenir.

`openclaw sessions --all-agents`, yapılandırılmış ajan depolarını okur. Gateway ve ACP oturum keşfi daha geniştir: varsayılan `agents/` kökü veya şablonlu bir `session.store` kökü altında bulunan yalnızca diskteki depoları da içerir. Keşfedilen bu depolar, ajan kökünün içindeki normal `sessions.json` dosyalarına çözümlenmelidir; sembolik bağlantılar ve kök dışı yollar atlanır.

JSON örnekleri:

`openclaw sessions --all-agents --json`:

```json
{
  "path": null,
  "stores": [
    { "agentId": "main", "path": "/home/user/.openclaw/agents/main/sessions/sessions.json" },
    { "agentId": "work", "path": "/home/user/.openclaw/agents/work/sessions/sessions.json" }
  ],
  "allAgents": true,
  "count": 2,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Temizlik bakımı

Bakımı şimdi çalıştırın (sonraki yazma döngüsünü beklemek yerine):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup`, yapılandırmadaki `session.maintenance` ayarlarını kullanır:

- Kapsam notu: `openclaw sessions cleanup`, oturum depolarının, transkriptlerin ve yörünge yan dosyalarının bakımını yapar. [Cron yapılandırması](/tr/automation/cron-jobs#configuration) içinde `cron.runLog.maxBytes` ve `cron.runLog.keepLines` tarafından yönetilen ve [Cron bakımı](/tr/automation/cron-jobs#maintenance) içinde açıklanan cron çalışma günlüklerini (`cron/runs/<jobId>.jsonl`) budamaz.

- `--dry-run`: yazmadan kaç girdinin budanacağını/sınırlanacağını önizleyin.
  - Metin modunda dry-run, nelerin tutulacağını ve nelerin kaldırılacağını görebilmeniz için oturum başına bir eylem tablosu (`Action`, `Key`, `Age`, `Model`, `Flags`) yazdırır.
- `--enforce`: `session.maintenance.mode` `warn` olsa bile bakımı uygula.
- `--fix-missing`: transkript dosyaları eksik olan girdileri, normalde henüz yaş/sayı sınırına takılmayacak olsalar bile kaldır.
- `--active-key <key>`: belirli bir etkin anahtarı disk bütçesi tahliyesinden koru.
- `--agent <id>`: tek bir yapılandırılmış ajan deposu için temizlik çalıştır.
- `--all-agents`: tüm yapılandırılmış ajan depoları için temizlik çalıştır.
- `--store <path>`: belirli bir `sessions.json` dosyasına karşı çalıştır.
- `--json`: bir JSON özeti yazdır. `--all-agents` ile çıktı, depo başına bir özet içerir.

`openclaw sessions cleanup --all-agents --dry-run --json`:

```json
{
  "allAgents": true,
  "mode": "warn",
  "dryRun": true,
  "stores": [
    {
      "agentId": "main",
      "storePath": "/home/user/.openclaw/agents/main/sessions/sessions.json",
      "beforeCount": 120,
      "afterCount": 80,
      "pruned": 40,
      "capped": 0
    },
    {
      "agentId": "work",
      "storePath": "/home/user/.openclaw/agents/work/sessions/sessions.json",
      "beforeCount": 18,
      "afterCount": 18,
      "pruned": 0,
      "capped": 0
    }
  ]
}
```

İlgili:

- Oturum yapılandırması: [Yapılandırma başvurusu](/tr/gateway/config-agents#session)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Oturum yönetimi](/tr/concepts/session)
