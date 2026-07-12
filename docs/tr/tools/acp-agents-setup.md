---
read_when:
    - Claude Code / Codex / Gemini CLI için acpx çalıştırma ortamını yükleme veya yapılandırma
    - plugin-tools veya OpenClaw-tools MCP köprüsünü etkinleştirme
    - ACP izin modlarını yapılandırma
summary: 'ACP ajanlarını ayarlama: acpx çalışma düzeneği yapılandırması, Plugin kurulumu, izinler'
title: ACP aracıları — kurulum
x-i18n:
    generated_at: "2026-07-12T12:46:25Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 6a654c7513df0bd54dc69eecc45a408df76c852bcf1d9e932b960f4944fa4239
    source_path: tools/acp-agents-setup.md
    workflow: 16
---

Genel bakış, operatör çalışma kılavuzu ve kavramlar için [ACP ajanları](/tr/tools/acp-agents) bölümüne bakın.

Bu sayfa, acpx altyapı yapılandırmasını, MCP köprüleri için Plugin kurulumunu ve izin yapılandırmasını kapsar.

Bu sayfayı yalnızca ACP/acpx yolunu kurarken kullanın. Yerel Codex
app-server çalışma zamanı yapılandırması için [Codex altyapısı](/tr/plugins/codex-harness) bölümünü kullanın.
OpenAI API anahtarları veya Codex OAuth model sağlayıcısı yapılandırması için
[OpenAI](/tr/providers/openai) bölümünü kullanın.

Codex'in iki OpenClaw yolu vardır:

| Yol                        | Yapılandırma/komut                                      | Kurulum sayfası                         |
| -------------------------- | ------------------------------------------------------ | --------------------------------------- |
| Yerel Codex app-server     | `/codex ...`, `openai/gpt-*` ajan başvuruları          | [Codex altyapısı](/tr/plugins/codex-harness) |
| Açık Codex ACP bağdaştırıcısı | `/acp spawn codex`, `runtime: "acp", agentId: "codex"` | Bu sayfa                                |

Açıkça ACP/acpx davranışına ihtiyaç duymadığınız sürece yerel yolu tercih edin.

## acpx altyapı desteği (güncel)

Yerleşik acpx altyapı diğer adları (sabitlenmiş `acpx` bağımlılığından):

| Diğer ad     | Sarmaladığı                                                                                                     |
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
| `pi`         | [Pi Kodlama Ajanı](https://github.com/mariozechner/pi)                                                          |
| `qoder`      | [Qoder CLI](https://docs.qoder.com/cli/acp)                                                                     |
| `qwen`       | [Qwen Code](https://github.com/QwenLM/qwen-code)                                                                |
| `trae`       | [Trae CLI](https://docs.trae.cn/cli)                                                                            |

`factory-droid` ve `factorydroid` de yerleşik `droid` bağdaştırıcısına çözümlenir.

OpenClaw acpx arka ucunu kullandığında, acpx yapılandırmanız özel ajan diğer adları tanımlamıyorsa `agentId` için bu değerleri tercih edin.
Yerel Cursor kurulumunuz ACP'yi hâlâ `agent acp` olarak sunuyorsa yerleşik varsayılanı değiştirmek yerine acpx yapılandırmanızdaki `cursor` ajan komutunu geçersiz kılın.

Doğrudan acpx CLI kullanımı, `--agent <command>` aracılığıyla isteğe bağlı bağdaştırıcıları da hedefleyebilir; ancak bu ham kaçış yolu bir acpx CLI özelliğidir (normal OpenClaw `agentId` yolu değildir).

Model denetimi, bağdaştırıcının yeteneklerine bağlıdır. Codex ACP model başvuruları,
başlatmadan önce OpenClaw tarafından normalleştirilir. Diğer altyapılar ACP `models` ile
`session/set_model` desteğine ihtiyaç duyar; bir altyapı ne bu ACP yeteneğini
ne de kendi başlangıç model bayrağını sunuyorsa OpenClaw/acpx bir model seçimini zorlayamaz.

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
      // Varsayılanlar coalesceIdleMs: 350, maxChunkChars: 1800 şeklindedir; burada açıkça gösterilmiştir.
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
        // Varsayılan zaten true'dur; burada açıkça gösterilmiştir.
        spawnSessions: true,
      },
    },
  },
}
```

İş parçacığına bağlı ACP başlatma çalışmıyorsa önce bağdaştırıcının özellik bayrağını doğrulayın:

- Discord: `channels.discord.threadBindings.spawnSessions=true`

Geçerli konuşmaya yapılan bağlamalar, alt iş parçacığı oluşturulmasını gerektirmez. Etkin bir konuşma bağlamı ve ACP konuşma bağlamalarını sunan bir kanal bağdaştırıcısı gerektirir.

[Yapılandırma Başvurusu](/tr/gateway/configuration-reference) bölümüne bakın.

## acpx arka ucu için Plugin kurulumu

Paketlenmiş kurulumlar ACP için resmî `@openclaw/acpx` çalışma zamanı Plugin'ini kullanır.
ACP altyapı oturumlarını kullanmadan önce bunu kurup etkinleştirin:

```bash
openclaw plugins install @openclaw/acpx
openclaw config set plugins.entries.acpx.enabled true
```

Kaynak kod kullanıma alımları, `pnpm install` sonrasında yerel çalışma alanı Plugin'ini de kullanabilir.

Şununla başlayın:

```text
/acp doctor
```

`acpx` özelliğini devre dışı bıraktıysanız, `plugins.allow` / `plugins.deny` aracılığıyla reddettiyseniz veya
paketlenmiş Plugin'e geri dönmek istiyorsanız açık paket yolunu kullanın:

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

`acpx` Plugin'i ACP çalışma zamanını doğrudan gömer (yapılandırılacak ayrı bir `acpx` ikili dosyası veya
sürümü yoktur). Varsayılan olarak Gateway başlatılırken gömülü arka ucu kaydeder ve Gateway `ready`
sinyalinden önce bir başlangıç yoklamasını bekler. Yalnızca başlangıç yoklamasını
bilerek devre dışı tutan betikler veya ortamlar için `OPENCLAW_ACPX_RUNTIME_STARTUP_PROBE=0` ya da
`OPENCLAW_SKIP_ACPX_RUNTIME_PROBE=1` ayarlayın. Açık bir
isteğe bağlı yoklama için `/acp doctor` komutunu çalıştırın.

Bir yolun veya bayrak değerinin tek bir argv belirteci olarak kalması gerektiğinde, bağımsız bir ACP ajan komutunu
yapılandırılmış bağımsız değişkenlerle geçersiz kılın:

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

- `agents.<id>.command`, söz konusu ACP ajanına ait çalıştırılabilir dosya veya mevcut komut dizesidir.
- `agents.<id>.args` isteğe bağlıdır. OpenClaw her dizi öğesini geçerli acpx komut dizesi kayıt defterinden geçirmeden önce kabuk için tırnak içine alır.

[Plugin'ler](/tr/tools/plugin) bölümüne bakın.

### Otomatik bağdaştırıcı indirme

`acpx`, ACP bağdaştırıcılarını (örneğin Claude ve Codex ACP
köprülerini) ilk kullanımda `npx` aracılığıyla otomatik olarak indirir. Bağdaştırıcı paketlerini
elle kurmanız gerekmez ve OpenClaw'ın kendisi için ayrı bir kurulum sonrası adımı yoktur. Bir
bağdaştırıcının indirilmesi veya başlatılması başarısız olursa `/acp doctor` hatayı bildirir.

### Plugin araçları MCP köprüsü

ACPX oturumları varsayılan olarak OpenClaw Plugin'leri tarafından kaydedilmiş araçları ACP
altyapısına **sunmaz**.

Codex veya Claude Code gibi ACP ajanlarının bellek geri çağırma/depolama gibi kurulu
OpenClaw Plugin araçlarını çağırmasını istiyorsanız özel köprüyü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.pluginToolsMcpBridge true
```

Bu işlem şunları yapar:

- `openclaw-plugin-tools` adlı yerleşik bir MCP sunucusunu ACPX oturum
  önyüklemesine ekler.
- Kurulu ve etkin OpenClaw Plugin'leri tarafından önceden kaydedilmiş Plugin araçlarını
  sunar.
- Özelliği açık seçimli ve varsayılan olarak kapalı tutar.

Güvenlik ve güven notları:

- Bu, ACP altyapısının araç yüzeyini genişletir.
- ACP ajanları yalnızca Gateway'de zaten etkin olan Plugin araçlarına erişir.
- Bunu, söz konusu Plugin'lerin OpenClaw'ın kendisinde çalışmasına izin vermekle
  aynı güven sınırı olarak değerlendirin.
- Etkinleştirmeden önce kurulu Plugin'leri inceleyin.

Özel `mcpServers` eskisi gibi çalışmaya devam eder. Yerleşik Plugin araçları köprüsü,
genel MCP sunucusu yapılandırmasının yerine geçen bir özellik değil, isteğe bağlı ek bir kolaylıktır.

### OpenClaw araçları MCP köprüsü

ACPX oturumları varsayılan olarak yerleşik OpenClaw araçlarını da MCP aracılığıyla
sunmaz. Bir ACP ajanı `cron` gibi seçili yerleşik araçlara ihtiyaç duyduğunda
ayrı çekirdek araçları köprüsünü etkinleştirin:

```bash
openclaw config set plugins.entries.acpx.config.openClawToolsMcpBridge true
```

Bu işlem şunları yapar:

- `openclaw-tools` adlı yerleşik bir MCP sunucusunu ACPX oturum
  önyüklemesine ekler.
- Seçili yerleşik OpenClaw araçlarını sunar. İlk sunucu `cron` aracını sunar.
- Çekirdek araçların sunulmasını açık seçimli ve varsayılan olarak kapalı tutar.

### Çalışma zamanı işlem zaman aşımı yapılandırması

`acpx` Plugin'i, gömülü çalışma zamanı başlatma ve denetim işlemlerine varsayılan olarak 120
saniye tanır. Bu, Gemini CLI gibi daha yavaş altyapıların ACP başlatma ve ilklendirme işlemlerini
tamamlaması için yeterli süre sağlar. Ana makinenizin farklı bir işlem sınırına ihtiyacı varsa
bu değeri geçersiz kılın:

```bash
openclaw config set plugins.entries.acpx.config.timeoutSeconds 180
```

Çalışma zamanı turları, `/acp timeout` dâhil olmak üzere OpenClaw ajan/çalıştırma zaman aşımlarını kullanır.
`sessions_spawn` çağrı başına zaman aşımı geçersiz kılmalarını kabul etmez; operatör yolu
`agents.defaults.subagents.runTimeoutSeconds` şeklindedir. `timeoutSeconds` değerini
değiştirdikten sonra Gateway'i yeniden başlatın.

### Durum yoklaması ajan yapılandırması

`/acp doctor` veya başlangıç yoklaması arka ucu denetlediğinde paketle gelen `acpx`
Plugin'i bir altyapı ajanını yoklar. `acp.allowedAgents` ayarlanmışsa varsayılan olarak
izin verilen ilk ajanı; aksi takdirde `codex` değerini kullanır. Dağıtımınızın
durum denetimleri için farklı bir ACP ajanına ihtiyacı varsa yoklama ajanını açıkça ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.probeAgent claude
```

Bu değeri değiştirdikten sonra Gateway'i yeniden başlatın.

## İzin yapılandırması

ACP oturumları etkileşimsiz çalışır; dosya yazma ve kabuk çalıştırma izin istemlerini onaylamak ya da reddetmek için TTY yoktur. acpx Plugin'i, izinlerin nasıl işleneceğini denetleyen iki yapılandırma anahtarı sağlar:

Bu ACPX altyapı izinleri, OpenClaw çalıştırma onaylarından ve Claude CLI `--permission-mode bypassPermissions` gibi CLI arka ucu sağlayıcı atlama bayraklarından ayrıdır. ACPX `approve-all`, ACP oturumları için altyapı düzeyindeki acil durum anahtarıdır.

OpenClaw `tools.exec.mode`, Codex Guardian
onayları ve ACPX altyapı izinleri arasındaki daha geniş karşılaştırma için
[İzin modları](/tr/tools/permission-modes) bölümüne bakın.

### `permissionMode`

Altyapı ajanının istemde bulunmadan hangi işlemleri gerçekleştirebileceğini denetler.

| Değer           | Davranış                                                            |
| --------------- | ------------------------------------------------------------------- |
| `approve-all`   | Tüm dosya yazma ve kabuk komutlarını otomatik olarak onaylar.       |
| `approve-reads` | Yalnızca okumaları otomatik onaylar; yazma ve yürütme istem gerektirir. |
| `deny-all`      | Tüm izin istemlerini reddeder.                                      |

### `nonInteractivePermissions`

Bir izin isteminin gösterilmesi gerektiğinde ancak etkileşimli bir TTY kullanılamadığında ne olacağını denetler (ACP oturumlarında her zaman böyledir).

| Değer  | Davranış                                                                 |
| ------ | ------------------------------------------------------------------------ |
| `fail` | Oturumu `PermissionPromptUnavailableError` ile sonlandırır. **(varsayılan)** |
| `deny` | İzni sessizce reddeder ve devam eder (kademeli işlev kaybı).             |

### Yapılandırma

Plugin yapılandırması üzerinden ayarlayın:

```bash
openclaw config set plugins.entries.acpx.config.permissionMode approve-all
openclaw config set plugins.entries.acpx.config.nonInteractivePermissions fail
```

Bu değerleri değiştirdikten sonra Gateway'i yeniden başlatın.

<Warning>
OpenClaw için varsayılan değerler `permissionMode=approve-reads` ve `nonInteractivePermissions=fail` şeklindedir. Etkileşimsiz ACP oturumlarında, izin istemini tetikleyen herhangi bir yazma veya yürütme işlemi `PermissionPromptUnavailableError: Permission prompt unavailable in non-interactive mode` hatasıyla başarısız olabilir.

İzinleri kısıtlamanız gerekiyorsa oturumların çökmesi yerine kademeli olarak işlev kaybetmesi için `nonInteractivePermissions` değerini `deny` olarak ayarlayın.
</Warning>

## İlgili

- [ACP ajanları](/tr/tools/acp-agents) — genel bakış, operatör çalışma kılavuzu, kavramlar
- [Alt ajanlar](/tr/tools/subagents)
- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
