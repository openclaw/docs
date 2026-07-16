---
read_when:
    - Claude Code / Codex / Gemini CLI için acpx koşum takımını yükleme veya yapılandırma
    - plugin-tools veya OpenClaw-tools MCP köprüsünü etkinleştirme
    - ACP izin modlarını yapılandırma
summary: 'ACP agentlarını ayarlama: acpx çalışma düzeneği yapılandırması, Plugin kurulumu, izinler'
title: ACP aracıları — kurulum
x-i18n:
    generated_at: "2026-07-16T17:58:03Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 437c7b9ddeeb28aa68e6ef14cf64a32cd1a9d28cd1cdb1a597a5e8bd6c45c5ae
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Genel bakış, operatör çalışma kılavuzu ve kavramlar için [ACP agent'ları](/tr/tools/acp-agents) bölümüne bakın.

Bu sayfa, acpx harness yapılandırmasını, MCP köprüleri için plugin kurulumunu ve izin yapılandırmasını kapsar.

Bu sayfayı yalnızca ACP/acpx rotasını ayarlarken kullanın. Yerel Codex
app-server çalışma zamanı yapılandırması için [Codex harness](/tr/plugins/codex-harness) sayfasını kullanın.
OpenAI API anahtarları veya Codex OAuth model sağlayıcısı yapılandırması için
[OpenAI](/tr/providers/openai) sayfasını kullanın.

Codex'in iki OpenClaw rotası vardır:

| Rota                       | Yapılandırma/komut                                      | Kurulum sayfası                          |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Yerel Codex app-server     | `/codex ...`, `openai/gpt-*` agent referansları       | [Codex harness](/tr/plugins/codex-harness) |
| Açık Codex ACP bağdaştırıcısı | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Bu sayfa                                |

ACP/acpx davranışına açıkça ihtiyaç duymadığınız sürece yerel rotayı tercih edin.

## acpx harness desteği (güncel)

Yerleşik acpx harness takma adları (sabitlenmiş `acpx` bağımlılığından):

| Takma ad     | Sarmaladığı                                                                                                      |
| ------------ | --------------------------------------------------------------------------------------------------------------- |
| `claude`     | [Claude Code](https://claude.ai/code)                                                                           |
| `codex`      | [Codex CLI](https://codex.openai.com)                                                                           |
| `copilot`    | [GitHub Copilot CLI](https://docs.github.com/copilot/how-tos/copilot-chat/use-copilot-chat-in-the-command-line) |
| `cursor`     | [Cursor CLI](https://cursor.com/docs/cli/acp) (`cursor-agent acp`)                                              |
| `droid`      | [Factory Droid](https://www.factory.ai)                                                                         |
| `fast-agent` | [fast-agent](https://fast-agent.ai)                                                                             |
| `gemini`     | [Gemini CLI](https://github.com/google/gemini-cli)                                                              |
| `iflow`      | [iFlow CLI](https://github.com/iflow-ai/iflow-cli)                                                              |
| `kilocode`   | [Kilocode](https://kilocode.ai)                                                                                 |
| `kimi`       | [Kimi CLI](https://github.com/MoonshotAI/kimi-cli)                                                              |
| `kiro`       | [Kiro CLI](https://kiro.dev)                                                                                    |
| `mux`        | [Mux](https://mux.coder.com)                                                                                    |
| `opencode`   | [OpenCode](https://opencode.ai)                                                                                 |
| `openclaw`   | OpenClaw ACP köprüsü (yerel `openclaw acp`)                                                                     |
| `pi`         | [Pi Coding Agent](https://github.com/mariozechner/pi)                                                           |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` ve `factorydroid` de yerleşik `droid` bağdaştırıcısına çözümlenir.

OpenClaw acpx arka ucunu kullandığında, acpx yapılandırmanız özel agent takma adları tanımlamıyorsa `agentId` için bu değerleri tercih edin.
Yerel Cursor kurulumunuz ACP'yi hâlâ `agent acp` olarak sunuyorsa yerleşik varsayılanı değiştirmek yerine acpx yapılandırmanızdaki `cursor` agent komutunu geçersiz kılın.

Doğrudan acpx CLI kullanımı, `--agent <command>` aracılığıyla rastgele bağdaştırıcıları da hedefleyebilir; ancak bu ham kaçış yolu bir acpx CLI özelliğidir (normal OpenClaw `agentId` yolu değildir).

Model denetimi, bağdaştırıcı yeteneğine bağlıdır. Codex ACP model referansları
başlatılmadan önce OpenClaw tarafından normalleştirilir. Diğer harness'ler ACP `models` ile
`session/set_model` desteğine ihtiyaç duyar; bir harness ne bu ACP yeteneğini
ne de kendi başlangıç model bayrağını sunuyorsa OpenClaw/acpx model seçimini zorlayamaz.

## Gerekli yapılandırma

Temel ACP yapılandırması:

```json5
{
  acp: {
    enabled: true,
    // İsteğe bağlı. Varsayılan değer true'dur; /acp denetimlerini korurken ACP yönlendirmesini duraklatmak için false olarak ayarlayın.
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
      "qwen",
    ],
    maxConcurrentSessions: 8,
    stream: {
      // Varsayılanlar coalesceIdleMs: 350, maxChunkChars: 1800 değerleridir; burada açıkça gösterilmiştir.
      coalesceIdleMs: 350,
      maxChunkChars: 1800,
    },
    runtime: {
      ttlMinutes: 120,
    },
  },
}
```

İş parçacığı bağlama yapılandırması, kanal bağdaştırıcısına özeldir. Discord örneği:

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
        // Varsayılan değer zaten true'dur; burada açıkça gösterilmiştir.
        spawnSessions: true,
      },
    },
  },
}
```

İş parçacığına bağlı ACP oluşturma çalışmıyorsa önce bağdaştırıcı özellik bayrağını doğrulayın:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Geçerli konuşma bağlamaları, alt iş parçacığı oluşturulmasını gerektirmez. Etkin bir konuşma bağlamı ve ACP konuşma bağlamalarını sunan bir kanal bağdaştırıcısı gerektirir.

[Yapılandırma Referansı](/tr/gateway/configuration-reference) bölümüne bakın.

## acpx arka ucu için plugin kurulumu

Paketlenmiş kurulumlar, ACP için resmî `@openclaw/acpx` çalışma zamanı plugin'ini kullanır.
ACP harness oturumlarını kullanmadan önce bunu kurun ve etkinleştirin:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kaynak kod teslim almaları da `pnpm install` sonrasında yerel çalışma alanı plugin'ini kullanabilir.

Şununla başlayın:

```text
/acp doctor
```

`acpx` özelliğini devre dışı bıraktıysanız, `plugins.allow` / `plugins.deny` aracılığıyla reddettiyseniz veya
paketlenmiş plugin'e geri dönmek istiyorsanız açık paket yolunu kullanın:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Geliştirme sırasında yerel çalışma alanı kurulumu:

```bash
openclaw plugins install ./path/to/local/acpx-plugin
```

Ardından arka uç durumunu doğrulayın:

```text
/acp doctor
```

### acpx çalışma zamanı başlangıç yoklaması

`acpx` plugin'i ACP çalışma zamanını doğrudan gömer (yapılandırılacak ayrı bir `acpx` ikili dosyası veya
sürümü yoktur). Varsayılan olarak gömülü arka ucu
Gateway başlatılırken kaydeder ve gateway `ready`
sinyalinden önce bir başlangıç yoklamasını bekler. `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` veya
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` değerlerini yalnızca başlangıç yoklamasını
bilerek devre dışı tutan betikler veya ortamlar için ayarlayın. Açık bir
isteğe bağlı yoklama için `/acp doctor` komutunu çalıştırın.

Bir yolun veya bayrak değerinin tek bir argv belirteci olarak kalması gerektiğinde,
tek bir ACP agent komutunu yapılandırılmış bağımsız değişkenlerle geçersiz kılın:

```json
{
  "plugins": {
    "entries": {
      "acpx": {
        "enabled": true,
        "config": {
          "agents": {
            "claude": {
              "command": "node",
              "args": ["/path/to/custom adapter.mjs", "--verbose"]
            }
          }
        }
      }
    }
  }
}
```

- `agents.<id>.command`, bu ACP agent'ının yürütülebilir dosyası veya mevcut komut dizesidir.
- `agents.<id>.args` isteğe bağlıdır. OpenClaw her dizi öğesini geçerli acpx komut dizesi kayıt defteri üzerinden geçirmeden önce kabuk için tırnak içine alır.

[Plugin'ler](/tr/tools/plugin) bölümüne bakın.

### Otomatik bağdaştırıcı indirme

`acpx`, ACP bağdaştırıcılarını (örneğin Claude ve Codex ACP
köprülerini) ilk kullanımda `npx` aracılığıyla otomatik olarak indirir. Bağdaştırıcı paketlerini
elle kurmanız gerekmez ve OpenClaw'ın kendisi için ayrı bir kurulum sonrası adımı yoktur. Bir
bağdaştırıcı indirme veya oluşturma işlemi başarısız olursa `/acp doctor` hatayı bildirir.

### Plugin araçları MCP köprüsü

Varsayılan olarak ACPX oturumları, OpenClaw plugin'leri tarafından kaydedilen araçları
ACP harness'ine **sunmaz**.

Codex veya Claude Code gibi ACP agent'larının bellek geri çağırma/depolama gibi
kurulu OpenClaw plugin araçlarını çağırmasını istiyorsanız özel köprüyü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Bunun yaptıkları:

- ACPX oturum başlangıcına `openclaw-plugin-tools` adlı yerleşik bir MCP sunucusu
  ekler.
- Kurulu ve etkin OpenClaw plugin'leri tarafından zaten kaydedilmiş plugin araçlarını
  sunar.
- Etkin ACP oturum kimliğini plugin araç fabrikalarına iletir; böylece
  agent kapsamındaki araçlar ilgili agent'ın ad alanında kalır.
- Özelliği açıkça etkinleştirilebilir ve varsayılan olarak kapalı tutar.

Güvenlik ve güven notları:

- Bu, ACP harness araç yüzeyini genişletir.
- ACP agent'ları yalnızca gateway'de zaten etkin olan plugin araçlarına erişebilir.
- Bunu, söz konusu plugin'lerin OpenClaw'ın kendisinde yürütülmesine izin vermekle
  aynı güven sınırı olarak değerlendirin.
- Etkinleştirmeden önce kurulu plugin'leri inceleyin.

Özel `mcpServers` daha önce olduğu gibi çalışmaya devam eder. Yerleşik plugin araçları köprüsü,
genel MCP sunucusu yapılandırmasının yerine geçen bir özellik değil, ek ve isteğe bağlı bir kolaylıktır.

### OpenClaw araçları MCP köprüsü

Varsayılan olarak ACPX oturumları, yerleşik OpenClaw araçlarını da MCP üzerinden
**sunmaz**. Bir ACP agent'ının `cron` gibi seçilmiş
yerleşik araçlara ihtiyacı olduğunda ayrı temel araçlar köprüsünü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Bunun yaptıkları:

- ACPX oturum başlangıcına `openclaw-tools` adlı yerleşik bir MCP sunucusu
  ekler.
- Seçilmiş yerleşik OpenClaw araçlarını sunar. İlk sunucu `cron` aracını sunar.
- Temel araçların sunulmasını açıkça etkinleştirilebilir ve varsayılan olarak kapalı tutar.

### Çalışma zamanı işlemi zaman aşımı yapılandırması

`acpx` plugin'i, gömülü çalışma zamanı başlangıç ve denetim işlemlerine varsayılan olarak 120
saniye tanır. Bu, Gemini CLI gibi daha yavaş harness'lere ACP başlangıç ve ilklendirme
işlemlerini tamamlamaları için yeterli süre verir. Ana makineniz farklı bir
işlem sınırına ihtiyaç duyuyorsa bu değeri geçersiz kılın:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Çalışma zamanı turları, `/acp timeout` dâhil olmak üzere OpenClaw agent/çalıştırma zaman aşımlarını kullanır.
`sessions_spawn` çağrı başına zaman aşımı geçersiz kılmalarını kabul etmez; operatör yolu
`agents.defaults.subagents.runTimeoutSeconds` şeklindedir. `timeoutSeconds` değerini
değiştirdikten sonra gateway'i yeniden başlatın.

### Durum yoklaması agent yapılandırması

`/acp doctor` veya başlangıç yoklaması arka ucu denetlediğinde, paketle birlikte gelen `acpx`
plugin'i bir harness agent'ını yoklar. `acp.allowedAgents` ayarlanmışsa varsayılan olarak
izin verilen ilk agent'ı kullanır; aksi takdirde varsayılan değer `codex` olur. Dağıtımınız
durum denetimleri için farklı bir ACP agent'ına ihtiyaç duyuyorsa yoklama agent'ını açıkça ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Bu değeri değiştirdikten sonra gateway'i yeniden başlatın.

## İzin yapılandırması

ACP oturumları etkileşimsiz çalışır — dosya yazma ve kabuk yürütme izin istemlerini onaylamak veya reddetmek için TTY yoktur. acpx Plugin'i, izinlerin nasıl işleneceğini denetleyen iki yapılandırma anahtarı sağlar:

Bu ACPX çalıştırma düzeneği izinleri, OpenClaw yürütme onaylarından ve Claude CLI `--permission-mode bypassPermissions` gibi CLI arka ucu sağlayıcılarının atlama bayraklarından ayrıdır. ACPX `approve-all`, ACP oturumları için çalıştırma düzeneği düzeyindeki acil durum anahtarıdır.

OpenClaw `tools.exec.mode`, Codex Guardian
onayları ve ACPX çalıştırma düzeneği izinleri arasındaki daha kapsamlı karşılaştırma için
[İzin modları](/tr/tools/permission-modes) bölümüne bakın.

### `permissionMode`

Çalıştırma düzeneği aracısının istem göstermeden hangi işlemleri gerçekleştirebileceğini denetler.

| Değer           | Davranış                                                  |
| --------------- | --------------------------------------------------------- |
| `approve-all`   | Tüm dosya yazma işlemlerini ve kabuk komutlarını otomatik olarak onaylar.          |
| `approve-reads` | Yalnızca okumaları otomatik olarak onaylar; yazma ve yürütme için istem gerekir. |
| `deny-all`      | Tüm izin istemlerini reddeder.                              |

### `nonInteractivePermissions`

Bir izin isteminin gösterilmesi gerektiğinde ancak etkileşimli TTY bulunmadığında (ACP oturumlarında her zaman böyledir) ne olacağını denetler.

| Değer  | Davranış                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Oturumu `PermissionPromptUnavailableError` ile sonlandırır. **(varsayılan)** |
| `deny` | İzni sessizce reddedip devam eder (zarif işlev kaybı).        |

### Yapılandırma

Plugin yapılandırması aracılığıyla ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Bu değerleri değiştirdikten sonra Gateway'i yeniden başlatın.

<Warning>
OpenClaw varsayılan olarak `permissionMode=approve-reads` ve `nonInteractivePermissions=fail` kullanır. Etkileşimsiz ACP oturumlarında izin istemini tetikleyen herhangi bir yazma veya yürütme işlemi `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` ile başarısız olabilir.

İzinleri kısıtlamanız gerekiyorsa oturumların çökmesi yerine işlev kaybıyla çalışmaya devam etmesi için `nonInteractivePermissions` değerini `deny` olarak ayarlayın.
</Warning>

## İlgili

- [ACP aracıları](/tr/tools/acp-agents) — genel bakış, operatör çalışma kılavuzu, kavramlar
- [Alt aracılar](/tr/tools/subagents)
- [Çok aracılı yönlendirme](/tr/concepts/multi-agent)
