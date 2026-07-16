---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir yedek mekanizma istiyorsunuz
    - Yerel AI CLI'ları çalıştırıyorsunuz ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka uç araç erişimi için MCP geri döngü köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsüyle yerel AI CLI yedek çözümü'
title: CLI arka uçları
x-i18n:
    generated_at: "2026-07-16T17:08:21Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: ffeb19e582819f511212326da83381ba2c52e9f5743263f1ef9e0dc0fbbaf08e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw, API sağlayıcıları çalışmadığında, hız sınırına takıldığında veya hatalı davrandığında yalnızca metin tabanlı bir geri dönüş olarak yerel bir yapay zekâ CLI'ı çalıştırabilir. Bu özellik kasıtlı olarak muhafazakâr tasarlanmıştır:

- OpenClaw araçları doğrudan enjekte edilmez, ancak `bundleMcp: true` özelliğine sahip bir arka uç, geri döngü MCP köprüsü üzerinden Gateway araçlarını alabilir.
- Destekleyen CLI'lar için JSONL akışı.
- Oturumlar desteklenir; böylece sonraki etkileşimler tutarlı kalır.
- CLI görüntü yollarını kabul ediyorsa görüntüler iletilir.

Bunu birincil yol olarak değil, "her zaman çalışan" metin yanıtları için bir güvenlik ağı olarak kullanın. ACP oturum denetimleri, arka plan görevleri, iş parçacığı/konuşma bağlama ve kalıcı harici kodlama oturumları içeren eksiksiz bir çalıştırma ortamı için bunun yerine [ACP Agent'larını](/tr/tools/acp-agents) kullanın; CLI arka uçları ACP değildir.

<Tip>
  Yeni bir arka uç Plugin'i mi oluşturuyorsunuz? [CLI arka uç Plugin'lerine](/tr/plugins/cli-backend-plugins) bakın. Bu sayfa, önceden kaydedilmiş bir arka ucun yapılandırılmasını ve işletilmesini kapsar.
</Tip>

## Hızlı başlangıç

Paketle gelen Anthropic Plugin'i varsayılan bir `claude-cli` arka ucu kaydeder; dolayısıyla Claude Code'un kurulu olması ve oturumunun açık olması dışında herhangi bir yapılandırma gerektirmeden çalışır:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

Açık bir agent listesi yapılandırılmadığında varsayılan agent kimliği `main` olur; aksi takdirde bunu kendi agent kimliğinizle değiştirin.

Gateway, minimum düzeyde bir `PATH` ile launchd/systemd altında çalışıyorsa ikili dosyayı açıkça belirtin:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "claude-cli": {
          command: "/opt/homebrew/bin/claude",
        },
      },
    },
  },
}
```

Paketle gelen bir CLI arka ucunu bir Gateway ana makinesinde birincil mesaj sağlayıcısı olarak kullanırsanız yapılandırmanız bir model başvurusunda veya `agents.defaults.cliBackends` altında bu arka uca başvurduğunda OpenClaw, arka ucun sahibi olan paketlenmiş Plugin'i otomatik olarak yükler.

## Geri dönüş olarak kullanma

CLI arka ucunu geri dönüş listenize ekleyerek yalnızca birincil modeller başarısız olduğunda çalışmasını sağlayın:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["claude-cli/claude-sonnet-4-6"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "claude-cli/claude-sonnet-4-6": {},
      },
    },
  },
}
```

`agents.defaults.models` değerini izin verilenler listesi olarak kullanıyorsanız CLI arka uç modellerinizi de buraya ekleyin. Birincil sağlayıcı başarısız olduğunda (kimlik doğrulama, hız sınırları, zaman aşımları) OpenClaw sıradaki CLI arka ucunu dener.

## Yapılandırma

Tüm CLI arka uçları, sağlayıcı kimliğine göre anahtarlanmış biçimde `agents.defaults.cliBackends` altında bulunur (ör. `claude-cli`, `my-cli`). Sağlayıcı kimliği, model başvurusunun sol tarafı olur: `<provider>/<model>`.

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "my-cli": {
          command: "my-cli",
          args: ["--json"],
          output: "json",
          input: "arg",
          modelArg: "--model",
          modelAliases: {
            "claude-opus-4-6": "opus",
            "claude-sonnet-4-6": "sonnet",
          },
          sessionArg: "--session",
          sessionMode: "existing",
          sessionIdFields: ["session_id", "conversation_id"],
          systemPromptArg: "--system",
          // Özel istem dosyası bayrağı:
          // systemPromptFileArg: "--system-file",
          // Bunun yerine Codex tarzı yapılandırma geçersiz kılma bayrağı:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Yalnızca bu arka uç, Compaction öncesinde geçersiz kılınan oturumları
          // sınırlı ham OpenClaw transkript geçmişinden yeniden başlatabiliyorsa etkinleştirin.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Nasıl çalışır?

1. Sağlayıcı önekine göre bir arka uç seçer (`claude-cli/...`).
2. Aynı OpenClaw istemini ve çalışma alanı bağlamını kullanarak bir sistem istemi oluşturur.
3. Geçmişin tutarlı kalması için CLI'ı bir oturum kimliğiyle (destekleniyorsa) çalıştırır. Paketle gelen `claude-cli` arka ucu, her OpenClaw oturumu için bir Claude stdio işlemini çalışır durumda tutar ve sonraki etkileşimleri stream-json stdin üzerinden gönderir.
4. Çıktıyı (JSON veya düz metin) ayrıştırır ve son metni döndürür.
5. Sonraki etkileşimlerin aynı CLI oturumunu yeniden kullanması için oturum kimliklerini arka uç bazında kalıcı hâle getirir.

### Claude CLI özellikleri

Paketle gelen `claude-cli` arka ucu, Claude Code'un yerel Skills çözümleyicisini tercih eder. Geçerli Skills anlık görüntüsünde somutlaştırılmış bir yola sahip en az bir seçili Skill bulunduğunda OpenClaw, `--plugin-dir` üzerinden geçici bir Claude Code Plugin'i iletir ve yinelenen OpenClaw Skills kataloğunu eklenen sistem isteminden çıkarır. Somutlaştırılmış bir Plugin Skill'i olmadığında OpenClaw, istem kataloğunu geri dönüş olarak tutar. Skill ortamı/API anahtarı geçersiz kılmaları, çalıştırma sırasında alt işlem ortamına uygulanmaya devam eder.

Claude CLI'ın kendi etkileşimsiz izin modu vardır; OpenClaw, Claude'a özgü yapılandırma eklemek yerine bunu mevcut yürütme politikasına eşler. OpenClaw tarafından yönetilen canlı Claude oturumlarında etkin yürütme politikası belirleyicidir: YOLO (`tools.exec.security: "full"` ve `tools.exec.ask: "off"`) normalde Claude'u `--permission-mode bypassPermissions` ile başlatırken kısıtlayıcı bir politika onu `--permission-mode default` ile başlatır. Root olarak çalışan Gateway'ler de `default` kullanır; çünkü Claude Code, root için atlama modunu reddeder. OpenClaw yine de Claude'un stdio araç denetimi isteklerini yapılandırılmış yürütme politikasına göre yanıtlar. Agent başına `agents.list[].tools.exec` ayarları, söz konusu agent için genel `tools.exec` ayarlarını geçersiz kılar. Ham arka uç bağımsız değişkenleri yine de `--permission-mode` içerebilir; ancak canlı Claude başlatmaları bu bayrağı etkin politikaya ve ana makine kısıtlamasına uyacak şekilde normalleştirir.

Arka uç ayrıca OpenClaw `/think` düzeylerini Claude Code'un yerel `--effort` bayrağına eşler: `minimal`/`low` -> `low`, `medium` -> `medium` ve `high`/`xhigh`/`max` doğrudan aktarılır. Bu, desteklenen Fable 5 efor düzeylerini abonelik destekli Claude CLI ve API anahtarı yollarında aynı tutar. `adaptive`, yapılandırılmış `--effort` bayraklarını kaldırır ve yerine başka bir değer sağlamaz; böylece Claude Code etkin eforu kendi ortamından, ayarlarından ve model varsayılanlarından belirler. `/think` başlatılan CLI'ı etkilemeden önce diğer CLI arka uçlarının sahibi olan Plugin'in eşdeğer bir argv eşleyicisi bildirmesi gerekir.

OpenClaw'ın `claude-cli` kullanabilmesi için önce aynı ana makinede Claude Code oturumu açılmış olmalıdır:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker kurulumlarında Claude Code'un yalnızca ana makinede değil, kalıcı kapsayıcı ana dizininin içinde kurulmuş ve oturumunun açılmış olması gerekir; [Docker'da Claude CLI arka ucuna](/tr/install/docker#claude-cli-backend-in-docker) bakın.

`agents.defaults.cliBackends.claude-cli.command` değerini yalnızca `claude` ikili dosyası zaten `PATH` üzerinde değilse ayarlayın.

## Oturumlar

- CLI oturumları destekliyorsa `sessionArg` değerini (ör. `--session-id`) veya kimliğin birden fazla bayrağa yerleştirilmesi gerektiğinde `sessionArgs` değerini (`{sessionId}` yer tutucusu) ayarlayın.
- CLI, farklı bayrakları olan bir sürdürme alt komutu kullanıyorsa `resumeArgs` değerini (sürdürme sırasında `args` yerine geçer) ve JSON dışı sürdürmeler için isteğe bağlı olarak `resumeOutput` değerini ayarlayın.
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönderir (depolanmış bir kimlik yoksa yeni UUID).
  - `existing`: yalnızca daha önce depolanmış bir oturum kimliği varsa gönderir.
  - `none`: hiçbir zaman oturum kimliği göndermez.
- `claude-cli` varsayılan olarak `liveSession: "claude-stdio"`, `output: "jsonl"` ve `input: "stdin"` değerlerini kullanır; böylece aktarım alanlarını atlayan özel yapılandırmalar dâhil olmak üzere sonraki etkileşimler, etkin olduğu sürece canlı Claude işlemini yeniden kullanır. Gateway yeniden başlatılırsa veya boşta olan işlem kapanırsa OpenClaw, depolanmış Claude oturum kimliğinden devam eder. Depolanmış oturum kimlikleri, sürdürülmeden önce okunabilir bir proje transkriptine göre doğrulanır; transkript eksikse `--resume` altında sessizce yeni bir oturum başlatmak yerine bağlama temizlenir (`reason=transcript-missing` olarak günlüğe kaydedilir).
- Canlı Claude oturumları sınırlı JSONL çıktı korumalarını sürdürür: varsayılan olarak etkileşim başına 8 MiB ve 20,000 ham JSONL satırı. Bunları arka uç bazında `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` ve `maxTurnLines` ile artırabilirsiniz; OpenClaw bu ayarları 64 MiB ve 100,000 satırla sınırlar.
- Depolanmış CLI oturumları, sağlayıcının sahip olduğu sürekliliktir. Örtük günlük oturum sıfırlaması bunları kesmez; `/reset` ve açık `session.reset` politikaları kesmeye devam eder.
- Yeni CLI oturumları normalde yalnızca OpenClaw'ın Compaction özeti ve Compaction sonrasındaki kuyruktan yeniden başlatılır. Compaction öncesinde geçersiz kılınmış kısa oturumları kurtarmak için bir arka uç `reseedFromRawTranscriptWhenUncompacted: true` ile etkinleştirilebilir. Ham transkriptten yeniden başlatma sınırlı kalır ve eksik CLI transkripti, sahipsiz araç kullanımı kuyruğu, mesaj politikası/sistem istemi/cwd/MCP değişiklikleri veya süresi dolmuş oturumu yeniden deneme gibi güvenli geçersiz kılmalarla kısıtlanır; kimlik doğrulama profili veya kimlik bilgisi dönemi değişiklikleri ham transkript geçmişini hiçbir zaman yeniden başlatmaz.

Serileştirme: `serialize: true`, aynı şeritteki çalıştırmaları sıralı tutar (çoğu CLI, tek bir sağlayıcı şeridinde serileştirme yapar). Seçili kimlik doğrulama kimliği değiştiğinde OpenClaw, depolanmış CLI oturumunun yeniden kullanımını da bırakır; buna değişen kimlik doğrulama profili kimliği, statik API anahtarı, statik token veya CLI'ın sunduğu OAuth hesap kimliği dâhildir. Yalnızca OAuth erişim/yenileme token'larının döndürülmesi oturumu kesmez. Bir CLI'ın kararlı bir OAuth hesap kimliği yoksa OpenClaw, söz konusu CLI'ın kendi sürdürme izinlerini uygulamasına olanak tanır.

## claude-cli oturumlarından geri dönüş başlangıcı

Bir `claude-cli` denemesi [`agents.defaults.model.fallbacks`](/tr/concepts/model-failover) içindeki CLI olmayan bir adaya geçtiğinde OpenClaw, sonraki denemeyi Claude Code'un yerel JSONL transkriptinden (`~/.claude/projects/` altında, çalışma alanına göre anahtarlanmış) toplanan bir bağlam başlangıcıyla besler. Bu başlangıç olmadan geri dönüş sağlayıcısı soğuk başlar; çünkü OpenClaw'ın kendi oturum transkripti `claude-cli` çalıştırmaları için boştur.

- Başlangıç, en son `/compact` özetini veya `compact_boundary` işaretçisini tercih eder ve ardından karakter bütçesine kadar sınır sonrasındaki en yeni etkileşimleri ekler. Sınır öncesindeki etkileşimler, özet zaten bunları temsil ettiği için çıkarılır.
- Araç blokları, istem bütçesini doğru tutmak için kompakt `(tool call: name)` ve `(tool result: …)` ipuçları hâlinde birleştirilir; aşırı büyük bir özet kısaltılır ve `(truncated)` olarak etiketlenir.
- Aynı sağlayıcıdaki `claude-cli` ile `claude-cli` arasındaki geri dönüşler Claude'un kendi `--resume` özelliğine dayanır ve başlangıcı atlar.
- Başlangıç, mevcut Claude oturum dosyası yolu doğrulamasını yeniden kullanır; böylece rastgele yollar okunamaz.

## Görüntüler

CLI'ınız görüntü yollarını kabul ediyorsa `imageArg` değerini ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw, base64 görüntülerini geçici dosyalara yazar. `imageArg` ayarlanmışsa bu yollar CLI bağımsız değişkenleri olarak iletilir; ayarlanmamışsa OpenClaw dosya yollarını isteme ekler (yol enjeksiyonu). Bu, yerel dosyaları düz yollardan otomatik olarak yükleyen CLI'larda çalışır.

## Girdiler ve çıktılar

- `output: "text"` (varsayılan), stdout'u son yanıt olarak kabul eder.
- `output: "json"`, JSON'ı ayrıştırmayı ve metin ile bir oturum kimliğini çıkarmayı dener.
- `output: "jsonl"`, bir JSONL akışını ayrıştırır ve mevcut olduğunda oturum tanımlayıcılarıyla birlikte son agent mesajını çıkarır.
- Gemini CLI JSON çıktısında OpenClaw, `usage` eksik veya boş olduğunda yanıt metnini `response` değerinden, kullanımı ise `stats` değerinden okur. Paketle gelen Gemini CLI varsayılanı `stream-json` kullanır; eski `--output-format json` geçersiz kılmaları JSON ayrıştırıcısını kullanmaya devam eder.

Girdi modları:

- `input: "arg"` (varsayılan), istemi son CLI argümanı olarak geçirir.
- `input: "stdin"`, istemi stdin üzerinden gönderir.
- İstem çok uzunsa ve `maxPromptArgChars` ayarlanmışsa bunun yerine stdin kullanılır.

## Plugin tarafından yönetilen varsayılanlar

CLI arka uç varsayılanları, plugin yüzeyinin bir parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id`, model referanslarında sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması, plugin varsayılanını yine geçersiz kılar.
- Arka uca özgü yapılandırma temizliği, isteğe bağlı `normalizeConfig` kancası aracılığıyla plugin tarafından yönetilmeye devam eder.

`claude-cli`, Anthropic tarafından; `google-gemini-cli` ise Google tarafından yönetilir. OpenAI Codex ajan çalıştırmaları, `openai/*` aracılığıyla Codex app-server düzeneğini kullanır; OpenClaw artık paketle birlikte gelen bir `codex-cli` arka ucu kaydetmez.

Paketle birlikte gelen Anthropic plugin'i, `claude-cli` için şunları kaydeder:

| Anahtar               | Değer                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `command`             | `claude`                                                                                                                                                                                                      |
| `args`                | `-p --output-format stream-json --include-partial-messages --verbose --setting-sources user --allowedTools mcp__openclaw__* --disallowedTools ScheduleWakeup,CronCreate,Bash(run_in_background:true),Monitor` |
| `output`              | `jsonl`                                                                                                                                                                                                       |
| `input`               | `stdin`                                                                                                                                                                                                       |
| `modelArg`            | `--model`                                                                                                                                                                                                     |
| `sessionArg`          | `--session-id`                                                                                                                                                                                                |
| `sessionMode`         | `always`                                                                                                                                                                                                      |
| `imageArg`            | `@`                                                                                                                                                                                                           |
| `imagePathScope`      | `workspace`                                                                                                                                                                                                   |
| `systemPromptFileArg` | `--append-system-prompt-file`                                                                                                                                                                                 |
| `systemPromptMode`    | `append`                                                                                                                                                                                                      |

Paketle birlikte gelen Google plugin'i, `google-gemini-cli` için şunları kaydeder:

| Anahtar                   | Değer                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------- |
| `command`                 | `gemini`                                                                               |
| `args`                    | `--skip-trust --approval-mode auto_edit --output-format stream-json --prompt {prompt}` |
| `resumeArgs`              | aynı, `--resume {sessionId}` ile                                                      |
| `output` / `resumeOutput` | `jsonl`                                                                                |
| `jsonlDialect`            | `gemini-stream-json`                                                                   |
| `imageArg`                | `@`                                                                                    |
| `imagePathScope`          | `workspace`                                                                            |
| `modelArg`                | `--model`                                                                              |
| `sessionMode`             | `existing`                                                                             |
| `sessionIdFields`         | `["session_id", "sessionId"]`                                                          |

Ön koşul: Yerel Gemini CLI, `gemini` olarak (`brew install gemini-cli` veya `npm install -g @google/gemini-cli`) yüklenmiş ve `PATH` üzerinde bulunmalıdır.

Gemini CLI çıktısıyla ilgili notlar:

- Varsayılan `stream-json` ayrıştırıcısı; asistan `message` olaylarını, araç olaylarını, nihai `result` kullanımını ve önemli Gemini hata olaylarını okur.
- Gemini argümanlarını `--output-format json` olarak geçersiz kılarsanız OpenClaw, bu arka ucu yeniden `output: "json"` olarak normalleştirir ve yanıt metnini JSON `response` alanından okur.
- `usage` yoksa veya boşsa kullanım, `stats` değerine geri döner; `stats.cached`, OpenClaw `cacheRead` biçimine normalleştirilir ve `stats.input` eksikse giriş token'ları `stats.input_tokens - stats.cached` değerinden türetilir.

Varsayılanları yalnızca gerektiğinde geçersiz kılın (en yaygın olarak mutlak bir `command` yolu için).

## Metin dönüştürme katmanları

Küçük istem/ileti uyumluluk katmanlarına ihtiyaç duyan plugin'ler, bir sağlayıcıyı veya CLI arka ucunu değiştirmeden çift yönlü metin dönüşümleri bildirebilir:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input`, CLI'ya geçirilen sistem istemini ve kullanıcı istemini yeniden yazar. `output`, OpenClaw kendi denetim işaretçilerini işlemeden ve kanal teslimatını gerçekleştirmeden önce akışla iletilen asistan metnini ve ayrıştırılmış nihai metni yeniden yazar; sağlayıcı destekli model çağrılarında ayrıca akış onarımından sonra ve araç yürütülmeden önce yapılandırılmış araç çağrısı argümanlarındaki dize değerlerini geri yükler. Ham sağlayıcı JSON parçaları değiştirilmeden bırakılır; tüketiciler yapılandırılmış kısmi, bitiş veya sonuç yükünü kullanmalıdır.

Sağlayıcıya özgü JSONL olayları yayan CLI'lar için ilgili arka ucun yapılandırmasında `jsonlDialect` değerini ayarlayın: Claude Code uyumlu akışlar için `claude-stream-json`, Gemini CLI `stream-json` olayları için `gemini-stream-json`.

## Yerel Compaction sahipliği

Bazı CLI arka uçları, kendi transkriptini Compaction işleminden geçiren bir ajan çalıştırır; bu nedenle OpenClaw bunlara karşı koruyucu özetleyicisini çalıştırmamalıdır. Bunun yapılması, arka ucun kendi Compaction işlemiyle çakışır ve turun ciddi bir hatayla başarısız olmasına yol açabilir.

`claude-cli` bir düzenek uç noktasına sahip değildir (Claude Code, Compaction işlemini dahili olarak gerçekleştirir); bu nedenle `ownsNativeCompaction: true` bildirir ve OpenClaw'ın Compaction yolu oturum girdisini değiştirmeden döndürür. OpenClaw, çalıştırmanın etkin bağlam bütçesini Claude Code'un belgelenmiş [`CLAUDE_CODE_AUTO_COMPACT_WINDOW`](https://code.claude.com/docs/en/env-vars) değişkeni üzerinden geçirerek yerel otomatik Compaction işlemini yapılandırılmış Anthropic `contextTokens` sınırlarıyla uyumlu tutar. Codex gibi yerel düzenek oturumları ise kendi düzenek Compaction uç noktalarına yönlendirilmeye devam eder.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

`ownsNativeCompaction` yalnızca Compaction işlemini gerçekten yöneten bir arka uç için bildirilmelidir: Arka uç, kendi transkriptini bağlam penceresi yakınında güvenilir biçimde sınırlamalı ve devam ettirilebilir bir oturumu (ör. `--resume` / `--session-id`) kalıcı hale getirmelidir; aksi takdirde ertelenmiş bir oturum bütçeyi aşmaya devam edebilir.

## Paket MCP katmanları

CLI arka uçları OpenClaw araç çağrılarını doğrudan almaz; ancak bir arka uç, `bundleMcp: true` ile oluşturulan bir MCP yapılandırma katmanını etkinleştirebilir. Paketle birlikte gelen mevcut davranış:

- `claude-cli`: oluşturulan katı MCP yapılandırma dosyası.
- `google-gemini-cli`: oluşturulan Gemini sistem ayarları dosyası.

Paket MCP etkinleştirildiğinde OpenClaw:

- CLI işlemine Gateway araçlarını sunan bir geri döngü HTTP MCP sunucusu başlatır; bu sunucunun kimliği yalnızca mevcut yürütme denemesinde etkin olan, çalıştırmaya özgü bir bağlam izniyle (`OPENCLAW_MCP_TOKEN`) doğrulanır;
- araç erişimini alt işlem üstbilgilerine güvenmek yerine Gateway tarafından seçilen oturum, hesap ve kanal bağlamına bağlar;
- geçerli çalışma alanı için etkinleştirilmiş paket MCP sunucularını yükler ve bunları mevcut tüm arka uç MCP yapılandırma/ayar biçimleriyle birleştirir;
- başlatma yapılandırmasını, sahibi olan plugin'in yönettiği arka uca ait entegrasyon modunu kullanarak yeniden yazar.

Hiçbir MCP sunucusu etkin değilse OpenClaw, arka uç paket MCP'yi etkinleştirdiğinde yine de katı bir yapılandırma ekler; böylece arka plan çalıştırmaları yalıtılmış kalır.

Oturum kapsamındaki paketlenmiş MCP çalışma zamanları, bir oturum içinde yeniden kullanılmak üzere önbelleğe alınır ve ardından `mcp.sessionIdleTtlMs` milisaniyelik boşta kalma süresinden sonra sonlandırılır (varsayılan 10 dakika; devre dışı bırakmak için `0` ayarlayın). Kimlik doğrulama yoklamaları, kısa ad oluşturma ve active-memory geri çağırma gibi tek seferlik gömülü çalıştırmalar, stdio alt işlemlerinin ve Streamable HTTP/SSE akışlarının çalıştırmadan daha uzun yaşamaması için çalıştırma sonunda temizlik talep eder.

## Yeniden tohumlama geçmişi sınırı

Yeni bir CLI oturumu önceki bir OpenClaw transkriptinden tohumlandığında (örneğin bir `session_expired` yeniden denemesinden sonra), yeniden tohumlama istemlerinin aşırı büyümesini önlemek için oluşturulan `<conversation_history>` bloğu sınırlandırılır. Varsayılan sınır 12,288 karakterdir (yaklaşık 3,000 token).

Claude CLI arka uçları bunun yerine bu sınırı çözümlenen Claude bağlam penceresine göre ölçeklendirir: Daha büyük bağlam pencereleri, sabit bir üst sınıra kadar önceki geçmişten daha büyük bir dilim alır; diğer CLI arka uçları ise ölçülü varsayılanı korur. Bu sınır yalnızca yeniden tohumlama isteminin önceki geçmiş bloğunu yönetir; canlı oturum çıktı sınırları `reliability.outputLimits` altında ayrıca ayarlanır (bkz. [Oturumlar](#sessions)).

## Sınırlamalar

- Doğrudan OpenClaw araç çağrısı yoktur: OpenClaw, CLI arka uç protokolüne araç çağrıları eklemez. Arka uçlar Gateway araçlarını yalnızca `bundleMcp: true` özelliğini etkinleştirdiklerinde görür.
- Akış arka uca özgüdür: Bazı arka uçlar JSONL akışı sağlarken diğerleri çıkışa kadar arabelleğe alır.
- Yapılandırılmış çıktılar, CLI'ın kendi JSON biçimine bağlıdır.

## Sorun giderme

| Belirti                | Çözüm                                                               |
| ---------------------- | ------------------------------------------------------------------- |
| CLI bulunamadı         | `command` değerini tam bir yol olarak ayarlayın.                                     |
| Yanlış model adı       | `provider/model` değerini CLI'ın model kimliğiyle eşlemek için `modelAliases` kullanın. |
| Oturum sürekliliği yok | `sessionArg` değerinin ayarlandığından ve `sessionMode` değerinin `none` olmadığından emin olun.       |
| Görseller yok sayılıyor | `imageArg` değerini ayarlayın ve CLI'ın dosya yollarını desteklediğini doğrulayın.            |

## İlgili

- [Gateway çalıştırma kılavuzu](/tr/gateway)
- [Yerel modeller](/tr/gateway/local-models)
