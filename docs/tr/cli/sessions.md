---
read_when:
    - Saklanan oturumları listelemek ve son etkinliği görmek istiyorsunuz
summary: '`openclaw sessions` için CLI başvurusu (saklanan oturumları + kullanımı listeleme)'
title: Oturumlar
x-i18n:
    generated_at: "2026-04-24T09:03:49Z"
    model: gpt-5.4
    provider: openai
    source_hash: 8d9fdc5d4cc968784e6e937a1000e43650345c27765208d46611e1fe85ee9293
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

- varsayılan: yapılandırılmış varsayılan aracı deposu
- `--verbose`: ayrıntılı günlükleme
- `--agent <id>`: yapılandırılmış tek bir aracı deposu
- `--all-agents`: yapılandırılmış tüm aracı depolarını birleştir
- `--store <path>`: açık depo yolu (`--agent` veya `--all-agents` ile birlikte kullanılamaz)

`openclaw sessions --all-agents`, yapılandırılmış aracı depolarını okur. Gateway ve ACP
oturum keşfi daha geniştir: varsayılan `agents/` kökü veya şablonlu bir `session.store` kökü altında bulunan yalnızca disk üzerindeki depoları da içerir. Bu
keşfedilen depolar, aracı kökü içindeki normal `sessions.json` dosyalarına çözülmelidir; symlink'ler ve kök dışı yollar atlanır.

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

- Kapsam notu: `openclaw sessions cleanup` yalnızca oturum depoları/transcript'leri için bakım yapar. `cron.runLog.maxBytes` ve `cron.runLog.keepLines` ile [Cron configuration](/tr/automation/cron-jobs#configuration) altında yönetilen ve [Cron maintenance](/tr/automation/cron-jobs#maintenance) içinde açıklanan cron çalıştırma günlüklerini (`cron/runs/<jobId>.jsonl`) budamaz.

- `--dry-run`: yazmadan önce kaç girişin budanacağını/sınırlandırılacağını önizleyin.
  - Metin modunda dry-run, neyin tutulacağını ve neyin kaldırılacağını görebilmeniz için oturum başına bir eylem tablosu (`Action`, `Key`, `Age`, `Model`, `Flags`) yazdırır.
- `--enforce`: `session.maintenance.mode`, `warn` olduğunda bile bakımı uygula.
- `--fix-missing`: transcript dosyaları eksik olan girdileri, normalde yaş/sayı nedeniyle henüz çıkmayacak olsalar bile kaldır.
- `--active-key <key>`: belirli bir etkin anahtarı disk bütçesi tahliyesinden koru.
- `--agent <id>`: tek bir yapılandırılmış aracı deposu için temizleme çalıştır.
- `--all-agents`: tüm yapılandırılmış aracı depoları için temizleme çalıştır.
- `--store <path>`: belirli bir `sessions.json` dosyasına karşı çalıştır.
- `--json`: bir JSON özeti yazdır. `--all-agents` ile çıktıda depo başına bir özet bulunur.

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

- Oturum yapılandırması: [Configuration reference](/tr/gateway/config-agents#session)

## İlgili

- [CLI reference](/tr/cli)
- [Session management](/tr/concepts/session)
