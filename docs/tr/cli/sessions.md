---
read_when:
    - Saklanan oturumları listelemek ve son etkinliği görmek istiyorsunuz
summary: '`openclaw sessions` için CLI referansı (saklanan oturumları listeleme + kullanım)'
title: Oturumlar
x-i18n:
    generated_at: "2026-05-02T20:43:04Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5c9ec3ca55f7c5b6217b481e9da62f5416df73e69405a0dc15e77d2afeac723f
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Depolanan konuşma oturumlarını listeleyin.

Oturum listeleri, kanal/sağlayıcı canlılık denetimleri değildir. Oturum depolarından kalıcılaştırılmış konuşma satırlarını gösterirler. Sessiz bir Discord, Slack, Telegram veya başka bir kanal, bir ileti işlenene kadar yeni bir oturum satırı oluşturmadan başarıyla yeniden bağlanabilir. Canlı kanal bağlantısına ihtiyacınız olduğunda `openclaw channels status --probe`, `openclaw status --deep` veya `openclaw health --verbose` kullanın.

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

Depolanan bir oturum için bir yörünge paketi dışa aktarın:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Bu, sahip exec isteğini onayladıktan sonra `/export-trajectory` eğik çizgi komutu tarafından kullanılan komut yoludur. Çıktı dizini her zaman seçilen çalışma alanı altında `.openclaw/trajectory-exports/` içinde çözümlenir.

`openclaw sessions --all-agents`, yapılandırılmış aracı depolarını okur. Gateway ve ACP oturum keşfi daha geniştir: varsayılan `agents/` kökü altında veya şablonlu bir `session.store` kökü altında bulunan yalnızca diskteki depoları da içerir. Keşfedilen bu depoların, aracı kökü içindeki normal `sessions.json` dosyalarına çözümlenmesi gerekir; sembolik bağlantılar ve kök dışı yollar atlanır.

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

- Kapsam notu: `openclaw sessions cleanup` oturum depolarını, transkriptleri ve yörünge yardımcı dosyalarını korur. `cron/runs/<jobId>.jsonl` Cron çalıştırma günlüklerini budamaz; bunlar [Cron yapılandırması](/tr/automation/cron-jobs#configuration) içindeki `cron.runLog.maxBytes` ve `cron.runLog.keepLines` tarafından yönetilir ve [Cron bakımı](/tr/automation/cron-jobs#maintenance) içinde açıklanır.

- `--dry-run`: yazmadan kaç girdinin budanacağını/sınırlandırılacağını önizleyin.
  - Metin modunda dry-run, neyin tutulup neyin kaldırılacağını görebilmeniz için oturum başına bir eylem tablosu (`Action`, `Key`, `Age`, `Model`, `Flags`) yazdırır.
- `--enforce`: `session.maintenance.mode` `warn` olduğunda bile bakımı uygula.
- `--fix-missing`: transkript dosyaları eksik olan girdileri, normalde henüz yaş/sayı sınırına takılmayacak olsalar bile kaldır.
- `--active-key <key>`: belirli bir etkin anahtarı disk bütçesi nedeniyle çıkarılmaya karşı koru. Grup oturumları ve iş parçacığı kapsamlı sohbet oturumları gibi kalıcı harici konuşma işaretçileri de yaş/sayı/disk bütçesi bakımı tarafından korunur.
- `--agent <id>`: tek bir yapılandırılmış aracı deposu için temizleme çalıştır.
- `--all-agents`: yapılandırılmış tüm aracı depoları için temizleme çalıştır.
- `--store <path>`: belirli bir `sessions.json` dosyasına karşı çalıştır.
- `--json`: JSON özeti yazdır. `--all-agents` ile çıktı depo başına bir özet içerir.

Bir Gateway erişilebilir olduğunda, yapılandırılmış aracı depoları için dry-run olmayan temizleme Gateway üzerinden gönderilir; böylece çalışma zamanı trafiğiyle aynı oturum deposu yazıcısını paylaşır. Bir depo dosyasının açık çevrimdışı onarımı için `--store <path>` kullanın.

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
