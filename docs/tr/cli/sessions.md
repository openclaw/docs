---
read_when:
    - Kayıtlı oturumları listelemek ve son etkinlikleri görmek istiyorsunuz
summary: '`openclaw sessions` için CLI referansı (kayıtlı oturumları listeleme + kullanım)'
title: Oturumlar
x-i18n:
    generated_at: "2026-05-05T01:44:22Z"
    model: gpt-5.5
    provider: openai
    source_hash: 6eb484ab1fa7686cf42dd00e640c4ae8616c4ea1c29873ea72694d72b9c680e7
    source_path: cli/sessions.md
    workflow: 16
---

# `openclaw sessions`

Saklanan konuşma oturumlarını listeleyin.

Oturum listeleri kanal/sağlayıcı canlılık denetimleri değildir. Oturum depolarındaki kalıcı konuşma satırlarını gösterirler. Sessiz bir Discord, Slack, Telegram veya başka bir kanal, bir ileti işlenene kadar yeni bir oturum satırı oluşturmadan başarıyla yeniden bağlanabilir. Canlı kanal bağlantısına ihtiyaç duyduğunuzda `openclaw channels status --probe`, `openclaw status --deep` veya `openclaw health --verbose` kullanın.

`openclaw sessions` ve Gateway `sessions.list` yanıtları varsayılan olarak sınırlıdır; böylece büyük ve uzun ömürlü depolar CLI sürecini veya Gateway olay döngüsünü tek başına meşgul edemez. CLI varsayılan olarak en yeni 100 oturumu döndürür; daha küçük/daha büyük bir pencere için `--limit <n>` veya özellikle tam depoya ihtiyaç duyduğunuzda `--limit all` geçirin. JSON yanıtları, çağıranların daha fazla satır bulunduğunu göstermesi gerektiğinde `totalCount`, `limitApplied` ve `hasMore` içerir.

```bash
openclaw sessions
openclaw sessions --agent work
openclaw sessions --all-agents
openclaw sessions --active 120
openclaw sessions --limit 25
openclaw sessions --verbose
openclaw sessions --json
```

Kapsam seçimi:

- varsayılan: yapılandırılmış varsayılan aracı deposu
- `--verbose`: ayrıntılı günlükleme
- `--agent <id>`: yapılandırılmış tek bir aracı deposu
- `--all-agents`: yapılandırılmış tüm aracı depolarını birleştir
- `--store <path>`: açık depo yolu (`--agent` veya `--all-agents` ile birleştirilemez)
- `--limit <n|all>`: çıktılanacak en fazla satır (varsayılan `100`; `all` tam çıktıyı geri getirir)

Saklanan bir oturum için trajectory paketini dışa aktarın:

```bash
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --workspace .
openclaw sessions export-trajectory --session-key "agent:main:telegram:direct:123" --output bug-123 --json
```

Bu, sahip exec isteğini onayladıktan sonra `/export-trajectory` slash komutu tarafından kullanılan komut yoludur. Çıktı dizini her zaman seçilen çalışma alanının altında `.openclaw/trajectory-exports/` içinde çözümlenir.

`openclaw sessions --all-agents` yapılandırılmış aracı depolarını okur. Gateway ve ACP oturum keşfi daha geniştir: varsayılan `agents/` kökü veya şablonlanmış bir `session.store` kökü altında bulunan yalnızca disk üzerindeki depoları da içerir. Keşfedilen bu depolar aracı kökü içinde normal `sessions.json` dosyalarına çözümlenmelidir; sembolik bağlantılar ve kök dışı yollar atlanır.

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
  "totalCount": 2,
  "limitApplied": 100,
  "hasMore": false,
  "activeMinutes": null,
  "sessions": [
    { "agentId": "main", "key": "agent:main:main", "model": "gpt-5" },
    { "agentId": "work", "key": "agent:work:main", "model": "claude-opus-4-6" }
  ]
}
```

## Temizlik bakımı

Bakımı şimdi çalıştırın (bir sonraki yazma döngüsünü beklemek yerine):

```bash
openclaw sessions cleanup --dry-run
openclaw sessions cleanup --agent work --dry-run
openclaw sessions cleanup --all-agents --dry-run
openclaw sessions cleanup --enforce
openclaw sessions cleanup --enforce --active-key "agent:main:telegram:direct:123"
openclaw sessions cleanup --json
```

`openclaw sessions cleanup`, config içindeki `session.maintenance` ayarlarını kullanır:

- Kapsam notu: `openclaw sessions cleanup` oturum depolarını, transkriptleri ve trajectory yan dosyalarını korur. [Cron yapılandırması](/tr/automation/cron-jobs#configuration) içinde `cron.runLog.maxBytes` ve `cron.runLog.keepLines` tarafından yönetilen ve [Cron bakımı](/tr/automation/cron-jobs#maintenance) içinde açıklanan cron çalıştırma günlüklerini (`cron/runs/<jobId>.jsonl`) budamaz.

- `--dry-run`: yazmadan kaç girdinin budanacağını/sınırlanacağını önizleyin.
  - Metin modunda dry-run, neyin tutulacağını ve neyin kaldırılacağını görebilmeniz için oturum başına bir eylem tablosu (`Action`, `Key`, `Age`, `Model`, `Flags`) yazdırır.
- `--enforce`: `session.maintenance.mode` `warn` olduğunda bile bakımı uygula.
- `--fix-missing`: transkript dosyaları eksik olan girdileri, normalde henüz yaş/sayı sınırını aşmayacak olsalar bile kaldır.
- `--active-key <key>`: belirli bir etkin anahtarı disk bütçesi tahliyesinden koru. Grup oturumları ve iş parçacığı kapsamlı sohbet oturumları gibi dayanıklı harici konuşma işaretçileri de yaş/sayı/disk bütçesi bakımı tarafından tutulur.
- `--agent <id>`: yapılandırılmış tek bir aracı deposu için temizlik çalıştır.
- `--all-agents`: yapılandırılmış tüm aracı depoları için temizlik çalıştır.
- `--store <path>`: belirli bir `sessions.json` dosyasına karşı çalıştır.
- `--json`: JSON özeti yazdır. `--all-agents` ile çıktı, depo başına bir özet içerir.

Bir Gateway erişilebilir olduğunda, yapılandırılmış aracı depoları için dry-run olmayan temizlik Gateway üzerinden gönderilir; böylece çalışma zamanı trafiğiyle aynı oturum deposu yazıcısını paylaşır. Bir depo dosyasının açık çevrimdışı onarımı için `--store <path>` kullanın.

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

- Oturum config'i: [Yapılandırma başvurusu](/tr/gateway/config-agents#session)

## İlgili

- [CLI başvurusu](/tr/cli)
- [Oturum yönetimi](/tr/concepts/session)
