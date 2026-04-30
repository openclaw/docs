---
read_when:
    - Claude Code / Codex / Gemini CLI için acpx düzeneğini yükleme veya yapılandırma
    - plugin-tools veya OpenClaw-tools MCP köprüsünü etkinleştirme
    - ACP izin modlarını yapılandırma
summary: 'ACP aracılarını ayarlama: acpx harness yapılandırması, Plugin kurulumu, izinler'
title: ACP aracıları — kurulum
x-i18n:
    generated_at: "2026-04-30T09:47:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 75b2667739311c8a7a8355967a801e7e3dde85c788b8051444f9c29c3289093b
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Genel bakış, operatör çalıştırma kitabı ve kavramlar için bkz. [ACP aracıları](/tr/tools/acp-agents).

Aşağıdaki bölümler acpx harness yapılandırmasını, MCP köprüleri için Plugin kurulumunu ve izin yapılandırmasını kapsar.

Bu sayfayı yalnızca ACP/acpx rotasını kurarken kullanın. Yerel Codex
app-server runtime yapılandırması için [Codex harness](/tr/plugins/codex-harness) kullanın. OpenAI API anahtarları veya Codex OAuth model sağlayıcı yapılandırması için
[OpenAI](/tr/providers/openai) kullanın.

Codex'in iki OpenClaw rotası vardır:

| Rota                       | Yapılandırma/komut                                    | Kurulum sayfası                         |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Yerel Codex app-server     | `/codex ...`, `agentRuntime.id: "codex"`               | [Codex harness](/tr/plugins/codex-harness) |
| Açık Codex ACP bağdaştırıcısı | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Bu sayfa                                |

Açıkça ACP/acpx davranışına ihtiyacınız yoksa yerel rotayı tercih edin.

## acpx harness desteği (geçerli)

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

OpenClaw acpx arka ucunu kullandığında, acpx yapılandırmanız özel aracı takma adları tanımlamıyorsa `agentId` için bu değerleri tercih edin.
Yerel Cursor kurulumunuz ACP'yi hâlâ `agent acp` olarak sunuyorsa yerleşik varsayılanı değiştirmek yerine acpx yapılandırmanızda `cursor` aracı komutunu geçersiz kılın.

Doğrudan acpx CLI kullanımı, `--agent <command>` aracılığıyla rastgele bağdaştırıcıları da hedefleyebilir; ancak bu ham kaçış yolu bir acpx CLI özelliğidir (normal OpenClaw `agentId` yolu değildir).

Model denetimi bağdaştırıcı yeteneğine bağlıdır. Codex ACP model referansları
başlatmadan önce OpenClaw tarafından normalleştirilir. Diğer harness'lerin ACP `models` ve
`session/set_model` desteğine ihtiyacı vardır; bir harness ne bu ACP yeteneğini
ne de kendi başlangıç model bayrağını sunuyorsa OpenClaw/acpx model seçimini zorlayamaz.

## Gerekli yapılandırma

Temel ACP tabanı:

```json5
{
  acp: {
    enabled: true,
    // Optional. Default is true; set false to pause ACP dispatch while keeping /acp controls.
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

Konu bağlama yapılandırması kanal bağdaştırıcısına özeldir. Discord için örnek:

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

Konuya bağlı ACP başlatma çalışmıyorsa önce bağdaştırıcı özellik bayrağını doğrulayın:

- Discord: `channels.discord.threadBindings.spawnAcpSessions=true`

Geçerli konuşma bağlamaları alt konu oluşturmayı gerektirmez. Etkin bir konuşma bağlamı ve ACP konuşma bağlamalarını sunan bir kanal bağdaştırıcısı gerektirir.

Bkz. [Yapılandırma Referansı](/tr/gateway/configuration-reference).

## acpx arka ucu için Plugin kurulumu

Yeni kurulumlarda paketle gelen `acpx` runtime Plugin'i varsayılan olarak etkin gelir, bu nedenle ACP
genellikle elle Plugin kurulum adımı olmadan çalışır.

Şununla başlayın:

```text
/acp doctor
```

`acpx`'i devre dışı bıraktıysanız, `plugins.allow` / `plugins.deny` ile reddettiyseniz veya
yerel bir geliştirme checkout'ına geçmek istiyorsanız açık Plugin yolunu kullanın:

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

### acpx komutu ve sürüm yapılandırması

Varsayılan olarak, paketle gelen `acpx` Plugin'i, Gateway başlangıcı sırasında
bir ACP aracısı başlatmadan gömülü ACP arka ucunu kaydeder. Açık bir
canlı yoklama için `/acp doctor` çalıştırın. `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=1` değerini yalnızca
Gateway'in yapılandırılmış aracıyı başlangıçta yoklaması gerektiğinde ayarlayın.

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

- `command` mutlak yol, göreli yol (OpenClaw çalışma alanından çözümlenir) veya komut adı kabul eder.
- `expectedVersion: "any"` katı sürüm eşleştirmesini devre dışı bırakır.
- Özel `command` yolları Plugin'e yerel otomatik kurulumu devre dışı bırakır.

Bkz. [Plugin'ler](/tr/tools/plugin).

### Otomatik bağımlılık kurulumu

OpenClaw'ı `npm install -g openclaw` ile genel olarak kurduğunuzda, acpx
runtime bağımlılıkları (platforma özel ikili dosyalar) bir postinstall hook'u
aracılığıyla otomatik olarak kurulur. Otomatik kurulum başarısız olursa gateway yine de
normal şekilde başlar ve eksik bağımlılığı `openclaw acp doctor` üzerinden bildirir.

### Plugin araçları MCP köprüsü

Varsayılan olarak, ACPX oturumları OpenClaw Plugin kayıtlı araçlarını
ACP harness'e **sunmaz**.

Codex veya Claude Code gibi ACP aracılarının bellek geri çağırma/depolama gibi kurulu
OpenClaw Plugin araçlarını çağırmasını istiyorsanız özel köprüyü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Bunun yaptığı:

- ACPX oturumu önyüklemesine `openclaw-plugin-tools` adlı yerleşik bir MCP sunucusu
  enjekte eder.
- Kurulu ve etkin OpenClaw Plugin'leri tarafından zaten kaydedilmiş Plugin araçlarını
  sunar.
- Özelliği açık ve varsayılan olarak kapalı tutar.

Güvenlik ve güven notları:

- Bu, ACP harness araç yüzeyini genişletir.
- ACP aracıları yalnızca gateway'de zaten etkin olan Plugin araçlarına erişim kazanır.
- Bunu, bu Plugin'lerin OpenClaw içinde çalıştırılmasına izin vermekle aynı güven sınırı olarak değerlendirin.
- Etkinleştirmeden önce kurulu Plugin'leri gözden geçirin.

Özel `mcpServers` eskisi gibi çalışmaya devam eder. Yerleşik Plugin araçları köprüsü,
genel MCP sunucusu yapılandırmasının yerine geçmez; ek bir isteğe bağlı kolaylıktır.

### OpenClaw araçları MCP köprüsü

Varsayılan olarak, ACPX oturumları yerleşik OpenClaw araçlarını da MCP üzerinden
**sunmaz**. Bir ACP aracısı `cron` gibi seçili yerleşik araçlara ihtiyaç duyduğunda ayrı çekirdek araçları köprüsünü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Bunun yaptığı:

- ACPX oturumu önyüklemesine `openclaw-tools` adlı yerleşik bir MCP sunucusu
  enjekte eder.
- Seçili yerleşik OpenClaw araçlarını sunar. İlk sunucu `cron` sunar.
- Çekirdek araç sunumunu açık ve varsayılan olarak kapalı tutar.

### Runtime zaman aşımı yapılandırması

Paketle gelen `acpx` Plugin'i, gömülü runtime dönüşleri için varsayılan olarak 120 saniyelik
zaman aşımı kullanır. Bu, Gemini CLI gibi daha yavaş harness'lere ACP başlangıcını
ve ilklendirmesini tamamlamak için yeterli süre verir. Ana makinenizin farklı bir
runtime sınırına ihtiyacı varsa bunu geçersiz kılın:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Bu değeri değiştirdikten sonra gateway'i yeniden başlatın.

### Sağlık yoklaması aracı yapılandırması

`/acp doctor` veya isteğe bağlı başlangıç yoklaması arka ucu denetlediğinde, paketle gelen
`acpx` Plugin'i bir harness aracısını yoklar. `acp.allowedAgents` ayarlanmışsa
varsayılan olarak izin verilen ilk aracı kullanır; aksi takdirde varsayılan olarak `codex` kullanır. Dağıtımınızın sağlık denetimleri için farklı bir ACP aracısına ihtiyacı varsa yoklama aracısını
açıkça ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Bu değeri değiştirdikten sonra gateway'i yeniden başlatın.

## İzin yapılandırması

ACP oturumları etkileşimsiz çalışır — dosya yazma ve shell-exec izin istemlerini onaylamak veya reddetmek için TTY yoktur. acpx Plugin'i izinlerin nasıl ele alınacağını denetleyen iki yapılandırma anahtarı sağlar:

Bu ACPX harness izinleri OpenClaw exec onaylarından ayrıdır ve Claude CLI `--permission-mode bypassPermissions` gibi CLI arka uç sağlayıcı bypass bayraklarından ayrıdır. ACPX `approve-all`, ACP oturumları için harness düzeyinde break-glass anahtarıdır.

### `permissionMode`

Harness aracısının istem göstermeden hangi işlemleri gerçekleştirebileceğini denetler.

| Değer           | Davranış                                                 |
| --------------- | -------------------------------------------------------- |
| `approve-all`   | Tüm dosya yazmalarını ve shell komutlarını otomatik onaylar. |
| `approve-reads` | Yalnızca okumaları otomatik onaylar; yazmalar ve exec istem gerektirir. |
| `deny-all`      | Tüm izin istemlerini reddeder.                           |

### `nonInteractivePermissions`

Bir izin istemi gösterilmesi gerektiğinde ancak etkileşimli TTY mevcut olmadığında ne olacağını denetler (ACP oturumları için her zaman durum budur).

| Değer  | Davranış                                                        |
| ------ | --------------------------------------------------------------- |
| `fail` | Oturumu `AcpRuntimeError` ile sonlandırır. **(varsayılan)**     |
| `deny` | İzni sessizce reddeder ve devam eder (zarif bozunum).           |

### Yapılandırma

Plugin yapılandırması üzerinden ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Bu değerleri değiştirdikten sonra gateway'i yeniden başlatın.

<Warning>
OpenClaw varsayılan olarak `permissionMode=approve-reads` ve `nonInteractivePermissions=fail` kullanır. Etkileşimsiz ACP oturumlarında, izin istemini tetikleyen herhangi bir yazma veya exec `AcpRuntimeError: Permission prompt unavailable in non-interactive mode` ile başarısız olabilir.

İzinleri kısıtlamanız gerekiyorsa `nonInteractivePermissions` değerini `deny` olarak ayarlayın; böylece oturumlar çökme yerine zarif şekilde bozulur.
</Warning>

## İlgili

- [ACP aracıları](/tr/tools/acp-agents) — genel bakış, operatör çalıştırma kitabı, kavramlar
- [Alt aracılar](/tr/tools/subagents)
- [Çok aracılı yönlendirme](/tr/concepts/multi-agent)
