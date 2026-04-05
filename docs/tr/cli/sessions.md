---
read_when:
    - Saklanan oturumları listelemek ve son etkinliği görmek istiyorsunuz
summary: '`openclaw sessions` için CLI başvurusu (saklanan oturumları + kullanımı listeleme)'
title: sessions
x-i18n:
    generated_at: "2026-04-05T13:49:27Z"
    model: gpt-5.4
    provider: openai
    source_hash: 47eb55d90bd0681676283310cfa50dcacc95dff7d9a39bf2bb188788c6e5e5ba
    source_path: cli/sessions.md
    workflow: 15
---

# `openclaw sessions`

Saklanan konuşma oturumlarını listeleyin.

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
- `--verbose`: ayrıntılı günlükleme
- `--agent <id>`: yapılandırılmış tek bir ajan deposu
- `--all-agents`: yapılandırılmış tüm ajan depolarını toplulaştırır
- `--store <path>`: açık depo yolu (`--agent` veya `--all-agents` ile birleştirilemez)

`openclaw sessions --all-agents`, yapılandırılmış ajan depolarını okur. Gateway ve ACP
oturum keşfi daha geniştir: varsayılan `agents/` kökü veya şablonlanmış bir `session.store` kökü altında bulunan yalnızca disk üzerindeki depoları da içerir. Bu
keşfedilen depolar, ajan kökü içindeki normal `sessions.json` dosyalarına çözülmelidir; sembolik bağlantılar ve kök dışı yollar atlanır.

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

## Temizleme bakımı

Bir sonraki yazma döngüsünü beklemek yerine bakımı şimdi çalıştırın:

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup`, yapılandırmadaki `session.maintenance` ayarlarını kullanır:

- Kapsam notu: `openclaw sessions cleanup` yalnızca oturum depoları/transkriptleri için bakım yapar. Cron çalıştırma günlüklerini (`cron/runs/<jobId>.jsonl`) budamaz; bunlar [Cron configuration](/tr/automation/cron-jobs#configuration) içinde `cron.runLog.maxBytes` ve `cron.runLog.keepLines` tarafından yönetilir ve [Cron maintenance](/tr/automation/cron-jobs#maintenance) bölümünde açıklanır.

- `--dry-run`: yazmadan önce kaç girdinin budanacağını/sınırlandırılacağını önizler.
  - Metin kipinde, dry-run neyin tutulacağını ve neyin kaldırılacağını görebilmeniz için oturum başına bir eylem tablosu (`Action`, `Key`, `Age`, `Model`, `Flags`) yazdırır.
- `--enforce`: `session.maintenance.mode` değeri `warn` olduğunda bile bakımı uygular.
- `--fix-missing`: normalde yaş/sayı sınırını aşmamış olsalar bile transkript dosyaları eksik olan girdileri kaldırır.
- `--active-key <key>`: belirli bir etkin anahtarı disk bütçesi tahliyesinden korur.
- `--agent <id>`: bir yapılandırılmış ajan deposu için temizleme çalıştırır.
- `--all-agents`: tüm yapılandırılmış ajan depoları için temizleme çalıştırır.
- `--store <path>`: belirli bir `sessions.json` dosyasına karşı çalıştırır.
- `--json`: JSON özeti yazdırır. `--all-agents` ile çıktıya depo başına bir özet dahil edilir.

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

- Oturum yapılandırması: [Configuration reference](/gateway/configuration-reference#session)
