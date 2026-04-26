---
read_when:
    - Claude Code / Codex / Gemini CLI için acpx harness'ini yükleme veya yapılandırma
    - plugin-tools veya OpenClaw-tools MCP köprüsünü etkinleştirme
    - ACP izin modlarını yapılandırma
summary: 'ACP aracılarını ayarlama: acpx harness yapılandırması, Plugin kurulumu, izinler'
title: ACP aracıları — kurulum
x-i18n:
    generated_at: "2026-04-26T11:41:29Z"
    model: gpt-5.4
    provider: openai
    source_hash: 5c7a638dd26b9343ea5a183954dd3ce3822b904bd2f46dd24f13a6785a646ea3
    source_path: tools/acp-agents-setup.md
    workflow: 15
---

Genel bakış, operatör runbook'u ve kavramlar için bkz. [ACP agents](/tr/tools/acp-agents).

Aşağıdaki bölümler, acpx harness yapılandırmasını, MCP köprüleri için Plugin kurulumunu ve izin yapılandırmasını kapsar.

Bu sayfayı yalnızca ACP/acpx yolunu kurarken kullanın. Yerel Codex
app-server çalışma zamanı yapılandırması için [Codex harness](/tr/plugins/codex-harness) kullanın. OpenAI API anahtarları veya Codex OAuth model-sağlayıcı yapılandırması için
[OpenAI](/tr/providers/openai) kullanın.

Codex için iki OpenClaw yolu vardır:

| Yol                       | Yapılandırma/komut                                     | Kurulum sayfası                         |
| ------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Yerel Codex app-server    | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/tr/plugins/codex-harness) |
| Açık Codex ACP bağdaştırıcısı | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Bu sayfa                               |

ACP/acpx davranışına açıkça ihtiyacınız yoksa yerel yolu tercih edin.

## acpx harness desteği (güncel)

Geçerli acpx yerleşik harness takma adları:

- `claude`
- `codex`
- `copilot`
- `cursor` (Cursor CLI: `cursor-agent acp`)
- `droid`
- `gemini`
- `iflow`
- `kilocode`
- `kimi`
- `kiro`
- `openclaw`
- `opencode`
- `pi`
- `qwen`

OpenClaw, acpx arka ucunu kullandığında, acpx yapılandırmanız özel aracı takma adları tanımlamıyorsa `agentId` için bu değerleri tercih edin.
Yerel Cursor kurulumunuz hâlâ ACP'yi `agent acp` olarak açığa çıkarıyorsa, yerleşik varsayılanı değiştirmek yerine acpx yapılandırmanızda `cursor` aracı komutunu geçersiz kılın.

Doğrudan acpx CLI kullanımı da `--agent <command>` ile rastgele bağdaştırıcıları hedefleyebilir, ancak bu ham kaçış kapağı bir acpx CLI özelliğidir (normal OpenClaw `agentId` yolu değil).

Model denetimi bağdaştırıcı yeteneğine bağlıdır. Codex ACP model başvuruları,
başlatmadan önce OpenClaw tarafından normalize edilir. Diğer harness'ler ACP `models` artı
`session/set_model` desteğine ihtiyaç duyar; bir harness ne bu ACP yeteneğini
ne de kendi başlangıç model bayrağını sunuyorsa, OpenClaw/acpx bir model seçimini zorlayamaz.

## Gerekli yapılandırma

Çekirdek ACP temeli:

```json5
{
  acp: {
    enabled: true,
    // İsteğe bağlı. Varsayılan true'dur; /acp denetimlerini korurken ACP sevkini duraklatmak için false ayarlayın.
    dispatch: { enabled: true },
    backend: "acpx",
    defaultAgent: "codex",
    allowedAgents: [
      "claude",
      "codex",
      "copilot",
      "cursor",
      "droid",
      "gemini",
      "iflow",
      "kilocode",
      "kimi",
      "kiro",
      "openclaw",
      "opencode",
      "pi",
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      coalesceIdleMs: 300,
      maxChunkChars: 1200,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

İş parçacığı bağlama yapılandırması kanal bağdaştırıcısına özeldir. Discord için örnek:

```json5
{
  session: {
    threadBindings: {
      enabled: true,
      idleHours: 24,
      maxAgeHours: 0,
    },
  },
  channels: {
    discord: {
      threadBindings: {
        enabled: true,
        spawnAcpSessions: true,
      },
    },
  },
}
```

İş parçacığına bağlı ACP oluşturma çalışmıyorsa önce bağdaştırıcı özellik bayrağını doğrulayın:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Geçerli sohbet bağlamaları alt iş parçacığı oluşturmayı gerektirmez. Bunlar etkin bir sohbet bağlamı ve ACP sohbet bağlamalarını açığa çıkaran bir kanal bağdaştırıcısı gerektirir.

Bkz. [Yapılandırma Başvurusu](/tr/gateway/configuration-reference).

## acpx arka ucu için Plugin kurulumu

Yeni kurulumlar, paketlenmiş `acpx` çalışma zamanı Plugin'i varsayılan olarak etkin halde gelir, bu yüzden ACP
genellikle el ile bir Plugin kurulum adımı olmadan çalışır.

Şununla başlayın:

```text
/acp doctor
```

`acpx` devre dışı bıraktıysanız, `plugins.allow` / `plugins.deny` ile engellediyseniz veya
yerel geliştirme checkout'una geçmek istiyorsanız, açık Plugin yolunu kullanın:

```bash
openclaw plugins install acpx
openclaw config set plugins.entries.acpx.enabled true
```

Geliştirme sırasında yerel çalışma alanı kurulumu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Ardından arka uç sağlığını doğrulayın:

```text
/acp doctor
```

### acpx komut ve sürüm yapılandırması

Varsayılan olarak, paketlenmiş `acpx` Plugin'i, Gateway başlatma sırasında
bir ACP aracı oluşturmadan gömülü ACP arka ucunu kaydeder. Açık bir canlı yoklama için `/acp doctor` çalıştırın. Gateway'in yapılandırılmış aracı başlatma sırasında yoklamasını yalnızca ihtiyaç duyduğunuzda `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` ayarlayın.

Plugin yapılandırmasında komutu veya sürümü geçersiz kılın:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "command": "../acpx/dist/cli.js",
          "expectedVersion": "any"
        }
      }
    }
  }
}
```

- `command`; mutlak bir yol, göreli bir yol (OpenClaw çalışma alanından çözülür) veya komut adı kabul eder.
- `expectedVersion: "any"`, katı sürüm eşleşmesini devre dışı bırakır.
- Özel `command` yolları, Plugin yerel otomatik kurulumu devre dışı bırakır.

Bkz. [Plugins](/tr/tools/plugin).

### Otomatik bağımlılık kurulumu

OpenClaw'ı `npm install -g openclaw` ile genel olarak kurduğunuzda, acpx
çalışma zamanı bağımlılıkları (platforma özgü ikili dosyalar) bir postinstall kancası aracılığıyla otomatik olarak kurulur. Otomatik kurulum başarısız olursa gateway yine de normal şekilde başlar
ve eksik bağımlılığı `openclaw acp doctor` üzerinden bildirir.

### Plugin araçları MCP köprüsü

Varsayılan olarak ACPX oturumları, OpenClaw Plugin'leri tarafından kaydedilen araçları
ACP harness'e açığa çıkarmaz.

Codex veya Claude Code gibi ACP aracıların, memory recall/store gibi yüklü
OpenClaw Plugin araçlarını çağırmasını istiyorsanız, ayrılmış köprüyü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Bunun yaptığı:

- ACPX oturum başlangıcına `openclaw-plugin-tools` adlı yerleşik bir MCP sunucusu enjekte eder.
- Yüklü ve etkin OpenClaw
  Plugin'leri tarafından zaten kaydedilmiş Plugin araçlarını açığa çıkarır.
- Özelliği açık ve varsayılan olarak kapalı tutar.

Güvenlik ve güven notları:

- Bu, ACP harness araç yüzeyini genişletir.
- ACP aracılar yalnızca gateway içinde zaten etkin olan Plugin araçlarına erişir.
- Bunu, bu Plugin'lerin
  OpenClaw içinde yürütülmesine izin vermekle aynı güven sınırı olarak değerlendirin.
- Etkinleştirmeden önce yüklü Plugin'leri gözden geçirin.

Özel `mcpServers` eskisi gibi çalışmaya devam eder. Yerleşik plugin-tools köprüsü,
genel MCP sunucusu yapılandırmasının yerine geçen bir şey değil, ek bir isteğe bağlı kolaylıktır.

### OpenClaw araçları MCP köprüsü

Varsayılan olarak ACPX oturumları ayrıca yerleşik OpenClaw araçlarını da
MCP üzerinden açığa çıkarmaz. Bir ACP aracının `cron` gibi seçili
yerleşik araçlara ihtiyacı olduğunda ayrı çekirdek araçlar köprüsünü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Bunun yaptığı:

- ACPX oturum başlangıcına `openclaw-tools` adlı yerleşik bir MCP sunucusu enjekte eder.
- Seçili yerleşik OpenClaw araçlarını açığa çıkarır. İlk sunucu `cron` aracını açığa çıkarır.
- Çekirdek araç açığa çıkarımını açık ve varsayılan olarak kapalı tutar.

### Çalışma zamanı zaman aşımı yapılandırması

Paketlenmiş `acpx` Plugin'i, gömülü çalışma zamanı turlarında varsayılan olarak 120 saniyelik
bir zaman aşımı kullanır. Bu, Gemini CLI gibi daha yavaş harness'lere
ACP başlatma ve ilklendirmeyi tamamlamak için yeterli süre verir. Ana makineniz farklı
bir çalışma zamanı sınırına ihtiyaç duyuyorsa bunu geçersiz kılın:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Bu değeri değiştirdikten sonra gateway'i yeniden başlatın.

### Sağlık yoklaması aracı yapılandırması

`/acp doctor` veya isteğe bağlı başlatma yoklaması arka ucu denetlediğinde, paketlenmiş
`acpx` Plugin'i bir harness aracını yoklar. `acp.allowedAgents` ayarlanmışsa varsayılan olarak
izin verilen ilk aracı kullanır; aksi halde varsayılan `codex` olur. Dağıtımınız sağlık denetimleri için farklı bir ACP aracına ihtiyaç duyuyorsa, yoklama aracını açıkça ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Bu değeri değiştirdikten sonra gateway'i yeniden başlatın.

## İzin yapılandırması

ACP oturumları etkileşimsiz çalışır — dosya yazma ve kabuk yürütme izin istemlerini onaylamak veya reddetmek için TTY yoktur. acpx Plugin'i, izinlerin nasıl ele alınacağını denetleyen iki yapılandırma anahtarı sağlar:

Bu ACPX harness izinleri, OpenClaw yürütme onaylarından ve Claude CLI `--permission-mode bypassPermissions` gibi CLI arka ucu üretici geçiş bayraklarından ayrıdır. ACPX `approve-all`, ACP oturumları için harness düzeyi acil durum anahtarıdır.

### `permissionMode`

Harness aracının istem göstermeden hangi işlemleri gerçekleştirebileceğini denetler.

| Değer           | Davranış                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Tüm dosya yazmalarını ve kabuk komutlarını otomatik onaylar. |
| `approve-reads` | Yalnızca okumaları otomatik onaylar; yazma ve yürütme istem gerektirir. |
| `deny-all`      | Tüm izin istemlerini reddeder.                            |

### `nonInteractivePermissions`

Bir izin istemi gösterilmesi gerektiğinde ancak etkileşimli TTY bulunmadığında ne olacağını denetler (ACP oturumları için durum her zaman böyledir).

| Değer  | Davranış                                                          |
| ------ | ----------------------------------------------------------------- |
| `fail` | Oturumu `AcpRuntimeError` ile sonlandırır. **(varsayılan)**       |
| `deny` | İzni sessizce reddeder ve devam eder (zarif bozulma).             |

### Yapılandırma

Plugin yapılandırması üzerinden ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Bu değerleri değiştirdikten sonra gateway'i yeniden başlatın.

> **Önemli:** OpenClaw şu anda varsayılan olarak `permissionMode=approve-reads` ve `nonInteractivePermissions=fail` kullanır. Etkileşimsiz ACP oturumlarında, izin istemi tetikleyen herhangi bir yazma veya yürütme işlemi `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` ile başarısız olabilir.
>
> İzinleri kısıtlamanız gerekiyorsa, oturumlar çökme yerine zarif biçimde bozulsun diye `nonInteractivePermissions` değerini `deny` olarak ayarlayın.

## İlgili

- [ACP agents](/tr/tools/acp-agents) — genel bakış, operatör runbook'u, kavramlar
- [Sub-agents](/tr/tools/subagents)
- [Multi-agent routing](/tr/concepts/multi-agent)
