---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir yedek çözüm istiyorsunuz
    - Yerel yapay zekâ CLI’larını çalıştırıyor ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka uç araç erişimi için MCP local loopback köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsüyle yerel AI CLI yedek seçeneği'
title: CLI arka uçları
x-i18n:
    generated_at: "2026-07-12T12:15:54Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 119b503d3107672c1bd7ccc39b464f253138d0d63d175018e91cbaeb720c462f
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw, API sağlayıcıları çalışmadığında, hız sınırına takıldığında veya hatalı davrandığında yalnızca metin tabanlı bir geri dönüş olarak yerel bir yapay zekâ CLI'sı çalıştırabilir. Tasarımı gereği temkinlidir:

- OpenClaw araçları doğrudan eklenmez, ancak `bundleMcp: true` kullanan bir arka uç, local loopback MCP köprüsü üzerinden Gateway araçlarını alabilir.
- Destekleyen CLI'lar için JSONL akışı.
- Oturumlar desteklenir; böylece sonraki etkileşimler tutarlı kalır.
- CLI görüntü yollarını kabul ediyorsa görüntüler aktarılır.

Bunu birincil yol olarak değil, "her zaman çalışan" metin yanıtları için bir güvenlik ağı olarak kullanın. ACP oturum denetimleri, arka plan görevleri, iş parçacığı/konuşma bağlama ve kalıcı harici kodlama oturumları içeren eksiksiz bir çalışma ortamı için bunun yerine [ACP Agent'ları](/tr/tools/acp-agents) kullanın; CLI arka uçları ACP değildir.

<Tip>
  Yeni bir arka uç Plugin'i mi geliştiriyorsunuz? [CLI arka uç Plugin'leri](/tr/plugins/cli-backend-plugins) sayfasına bakın. Bu sayfa, önceden kaydedilmiş bir arka ucun yapılandırılmasını ve çalıştırılmasını açıklar.
</Tip>

## Hızlı başlangıç

Paketle birlikte gelen Anthropic Plugin'i varsayılan bir `claude-cli` arka ucu kaydeder; dolayısıyla Claude Code'un kurulu ve oturum açılmış olması dışında herhangi bir yapılandırma gerektirmeden çalışır:

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

Açık bir agent listesi yapılandırılmadığında `main` varsayılan agent kimliğidir; aksi takdirde kendi agent kimliğinizi kullanın.

Gateway, minimum bir `PATH` ile launchd/systemd altında çalışıyorsa ikili dosyayı açıkça belirtin:

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

Paketle gelen bir CLI arka ucunu Gateway ana makinesinde birincil mesaj sağlayıcısı olarak kullanırsanız OpenClaw, yapılandırmanız bu arka uca bir model referansında veya `agents.defaults.cliBackends` altında başvurduğunda arka ucun sahibi olan paketli Plugin'i otomatik olarak yükler.

## Geri dönüş olarak kullanma

CLI arka ucunu geri dönüş listenize ekleyin; böylece yalnızca birincil modeller başarısız olduğunda çalışır:

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

`agents.defaults.models` alanını izin listesi olarak kullanıyorsanız CLI arka uç modellerinizi de buraya ekleyin. Birincil sağlayıcı başarısız olduğunda (kimlik doğrulama, hız sınırları, zaman aşımları) OpenClaw sıradaki CLI arka ucunu dener.

## Yapılandırma

Tüm CLI arka uçları, sağlayıcı kimliğine göre anahtarlanmış şekilde `agents.defaults.cliBackends` altında bulunur (ör. `claude-cli`, `my-cli`). Sağlayıcı kimliği, model referansının sol tarafı olur: `<provider>/<model>`.

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
          // Yalnızca bu arka uç, Compaction öncesindeki sınırlandırılmış ham OpenClaw
          // transkript geçmişinden geçersiz kılınmış oturumları yeniden başlatabiliyorsa etkinleştirin.
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
3. Geçmişin tutarlı kalması için CLI'yı bir oturum kimliğiyle (destekleniyorsa) çalıştırır. Paketle gelen `claude-cli` arka ucu, her OpenClaw oturumu için bir Claude stdio sürecini çalışır durumda tutar ve sonraki etkileşimleri stream-json stdin üzerinden gönderir.
4. Çıktıyı (JSON veya düz metin) ayrıştırır ve nihai metni döndürür.
5. Sonraki etkileşimlerin aynı CLI oturumunu yeniden kullanabilmesi için oturum kimliklerini arka uç başına kalıcı hâle getirir.

### Claude CLI ayrıntıları

Paketle gelen `claude-cli` arka ucu, Claude Code'un yerel Skills çözümleyicisini tercih eder. Geçerli Skills anlık görüntüsünde somutlaştırılmış bir yola sahip en az bir seçili Skills öğesi olduğunda OpenClaw, `--plugin-dir` üzerinden geçici bir Claude Code Plugin'i aktarır ve eklenen sistem isteminden yinelenen OpenClaw Skills kataloğunu çıkarır. Somutlaştırılmış bir Plugin Skills öğesi yoksa OpenClaw istem kataloğunu geri dönüş olarak korur. Skills ortamı/API anahtarı geçersiz kılmaları, çalıştırma sırasında alt sürecin ortamına uygulanmaya devam eder.

Claude CLI'ın kendi etkileşimsiz izin modu vardır; OpenClaw, Claude'a özgü yapılandırma eklemek yerine bunu mevcut çalıştırma ilkesiyle eşler. OpenClaw tarafından yönetilen canlı Claude oturumlarında etkin çalıştırma ilkesi belirleyicidir: YOLO (`tools.exec.security: "full"` ve `tools.exec.ask: "off"`), Claude'u `--permission-mode bypassPermissions` ile başlatırken kısıtlayıcı bir ilke onu `--permission-mode default` ile başlatır. Agent başına `agents.list[].tools.exec` ayarları, ilgili agent için genel `tools.exec` ayarlarını geçersiz kılar. Ham arka uç bağımsız değişkenleri yine de `--permission-mode` içerebilir; ancak canlı Claude başlatmaları bu bayrağı etkin ilkeyle eşleşecek şekilde normalleştirir.

Arka uç ayrıca OpenClaw `/think` düzeylerini Claude Code'un yerel `--effort` bayrağıyla eşler: `minimal`/`low` -> `low`, `medium` -> `medium`; `high`/`xhigh`/`max` ise doğrudan aktarılır. `adaptive`, yapılandırılmış `--effort` bayraklarını kaldırır ve bunların yerine bir değer sağlamaz; böylece Claude Code etkin çaba düzeyini kendi ortamından, ayarlarından ve model varsayılanlarından belirler. Diğer CLI arka uçlarında `/think` işlevinin başlatılan CLI'ı etkileyebilmesi için arka ucun sahibi olan Plugin'in eşdeğer bir argv eşleyicisi bildirmesi gerekir.

OpenClaw'ın `claude-cli` kullanabilmesi için önce Claude Code'un aynı ana makinede oturum açmış olması gerekir:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker kurulumlarında Claude Code'un yalnızca ana makinede değil, kalıcı konteyner ana dizininin içinde de kurulmuş ve oturum açmış olması gerekir; bkz. [Docker'da Claude CLI arka ucu](/tr/install/docker#claude-cli-backend-in-docker).

`agents.defaults.cliBackends.claude-cli.command` değerini yalnızca `claude` ikili dosyası zaten `PATH` üzerinde değilse ayarlayın.

## Oturumlar

- CLI oturumları destekliyorsa `sessionArg` (ör. `--session-id`) ayarlayın; kimliğin birden fazla bayrağa yerleştirilmesi gerekiyorsa `sessionArgs` (`{sessionId}` yer tutucusu) kullanın.
- CLI farklı bayraklara sahip bir devam ettirme alt komutu kullanıyorsa `resumeArgs` ayarlayın (devam ettirme sırasında `args` değerinin yerini alır) ve JSON olmayan devam ettirmeler için isteğe bağlı olarak `resumeOutput` değerini belirleyin.
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönderir (saklanmış bir kimlik yoksa yeni UUID).
  - `existing`: yalnızca daha önce saklanmış bir oturum kimliği varsa gönderir.
  - `none`: hiçbir zaman oturum kimliği göndermez.
- `claude-cli` varsayılan olarak `liveSession: "claude-stdio"`, `output: "jsonl"` ve `input: "stdin"` kullanır; böylece aktarım alanlarını içermeyen özel yapılandırmalarda bile sonraki etkileşimler, etkin olduğu sürece canlı Claude sürecini yeniden kullanır. Gateway yeniden başlarsa veya boşta kalan süreç sonlanırsa OpenClaw, saklanan Claude oturum kimliğinden devam eder. Saklanan oturum kimlikleri, devam ettirmeden önce okunabilir bir proje transkriptine göre doğrulanır; eksik bir transkript, `--resume` altında sessizce yeni bir oturum başlatmak yerine bağlantıyı temizler (`reason=transcript-missing` olarak günlüğe kaydedilir).
- Claude canlı oturumları sınırlandırılmış JSONL çıktı korumalarını sürdürür: varsayılan olarak etkileşim başına 8 MiB ve 20.000 ham JSONL satırı. Bunları arka uç başına `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` ve `maxTurnLines` ile artırabilirsiniz; OpenClaw bu ayarları 64 MiB ve 100.000 satırla sınırlar.
- Saklanan CLI oturumları, sağlayıcıya ait devamlılıktır. Örtük günlük oturum sıfırlaması bunları kesmez; `/reset` ve açık `session.reset` ilkeleri kesmeye devam eder.
- Yeni CLI oturumları normalde yalnızca OpenClaw'ın Compaction özetinden ve Compaction sonrası kuyruktan yeniden başlatılır. Compaction öncesinde geçersiz kılınmış kısa oturumları kurtarmak için bir arka uç `reseedFromRawTranscriptWhenUncompacted: true` ile bunu etkinleştirebilir. Ham transkriptten yeniden başlatma sınırlandırılmış olarak kalır ve eksik CLI transkripti, sahipsiz araç kullanımı kuyruğu, mesaj ilkesi/sistem istemi/cwd/MCP değişiklikleri veya süresi dolmuş oturum yeniden denemesi gibi güvenli geçersiz kılmalarla sınırlıdır; kimlik doğrulama profili veya kimlik bilgisi dönemi değişiklikleri ham transkript geçmişinden hiçbir zaman yeniden başlatma yapmaz.

Serileştirme: `serialize: true`, aynı şeritteki çalıştırmaları sıralı tutar (çoğu CLI tek bir sağlayıcı şeridinde serileştirme yapar). OpenClaw ayrıca seçilen kimlik doğrulama kimliği değiştiğinde saklanan CLI oturumunun yeniden kullanımını bırakır; buna değişen kimlik doğrulama profili kimliği, statik API anahtarı, statik belirteç veya CLI tarafından sunuluyorsa OAuth hesap kimliği dahildir. Yalnızca OAuth erişim/yenileme belirteci rotasyonu oturumu kesmez. Bir CLI'ın kararlı bir OAuth hesap kimliği yoksa OpenClaw, devam ettirme izinlerini ilgili CLI'ın kendisinin uygulamasına izin verir.

## claude-cli oturumlarından geri dönüş ön bilgisi

Bir `claude-cli` denemesi [`agents.defaults.model.fallbacks`](/tr/concepts/model-failover) içindeki CLI olmayan bir adaya geçtiğinde OpenClaw, sonraki denemeyi Claude Code'un yerel JSONL transkriptinden (`~/.claude/projects/` altında, çalışma alanı başına anahtarlanmış) alınan bir bağlam ön bilgisiyle başlatır. Bu başlangıç verisi olmadan geri dönüş sağlayıcısı bağlamsız başlar; çünkü OpenClaw'ın kendi oturum transkripti `claude-cli` çalıştırmaları için boştur.

- Ön bilgi, en son `/compact` özetini veya `compact_boundary` işaretçisini tercih eder; ardından karakter bütçesine kadar sınır sonrasındaki en güncel etkileşimleri ekler. Sınır öncesindeki etkileşimler, özet zaten bunları temsil ettiği için çıkarılır.
- İstem bütçesini gerçeğe uygun tutmak için araç blokları kısa `(tool call: name)` ve `(tool result: …)` ipuçlarında birleştirilir; aşırı büyük bir özet kısaltılır ve `(truncated)` etiketiyle işaretlenir.
- Aynı sağlayıcıdaki `claude-cli` -> `claude-cli` geri dönüşleri Claude'un kendi `--resume` özelliğine dayanır ve ön bilgiyi atlar.
- Başlangıç verisi mevcut Claude oturum dosyası yolu doğrulamasını yeniden kullanır; dolayısıyla rastgele yollar okunamaz.

## Görüntüler

CLI'ınız görüntü yollarını kabul ediyorsa `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw, base64 görüntüleri geçici dosyalara yazar. `imageArg` ayarlanmışsa bu yollar CLI bağımsız değişkenleri olarak aktarılır; ayarlanmamışsa OpenClaw dosya yollarını isteme ekler (yol ekleme). Bu, yerel dosyaları düz yollardan otomatik olarak yükleyen CLI'larda çalışır.

## Girdiler ve çıktılar

- `output: "text"` (varsayılan), stdout'u nihai yanıt olarak ele alır.
- `output: "json"`, JSON'ı ayrıştırmayı ve metin ile oturum kimliğini çıkarmayı dener.
- `output: "jsonl"`, bir JSONL akışını ayrıştırır ve mevcut olduğunda oturum tanımlayıcılarıyla birlikte nihai agent mesajını çıkarır.
- Gemini CLI JSON çıktısında OpenClaw, yanıt metnini `response` alanından; kullanım verilerini ise `usage` eksik veya boş olduğunda `stats` alanından okur. Paketle gelen Gemini CLI varsayılanı `stream-json` kullanır; eski `--output-format json` geçersiz kılmaları JSON ayrıştırıcısını kullanmaya devam eder.

Girdi modları:

- `input: "arg"` (varsayılan), istemi son CLI bağımsız değişkeni olarak aktarır.
- `input: "stdin"`, istemi stdin üzerinden gönderir.
- İstem çok uzunsa ve `maxPromptArgChars` ayarlanmışsa bunun yerine stdin kullanılır.

## Plugin'e ait varsayılanlar

CLI arka uç varsayılanları, Plugin yüzeyinin parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id` değeri, model referanslarında sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması yine de Plugin varsayılanını geçersiz kılar.
- Arka uca özgü yapılandırma temizliği, isteğe bağlı `normalizeConfig` kancası üzerinden Plugin'e ait kalır.

`claude-cli` Anthropic'e, `google-gemini-cli` ise Google'a aittir. OpenAI Codex agent çalıştırmaları, `openai/*` üzerinden Codex uygulama sunucusu çalışma ortamını kullanır; OpenClaw artık paketle gelen bir `codex-cli` arka ucu kaydetmez.

Paketle gelen Anthropic Plugin'i `claude-cli` için şunları kaydeder:

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

Paketle gelen Google plugin'i `google-gemini-cli` için kaydolur:

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

Ön koşul: Yerel Gemini CLI kurulmuş ve `PATH` üzerinde `gemini` olarak bulunmalıdır (`brew install gemini-cli` veya `npm install -g @google/gemini-cli`).

Gemini CLI çıktı notları:

- Varsayılan `stream-json` ayrıştırıcısı, asistan `message` olaylarını, araç olaylarını, son `result` kullanımını ve ölümcül Gemini hata olaylarını okur.
- Gemini bağımsız değişkenlerini `--output-format json` olarak geçersiz kılarsanız OpenClaw, bu arka ucu yeniden `output: "json"` biçimine normalleştirir ve yanıt metnini JSON `response` alanından okur.
- `usage` yoksa veya boşsa kullanım bilgisi `stats` değerine geri döner; `stats.cached`, OpenClaw `cacheRead` değerine normalleştirilir ve `stats.input` yoksa giriş token'ları `stats.input_tokens - stats.cached` işleminden türetilir.

Varsayılanları yalnızca gerekirse geçersiz kılın (en yaygın durum, mutlak bir `command` yoludur).

## Metin dönüştürme katmanları

Küçük istem/mesaj uyumluluk uyarlamalarına ihtiyaç duyan plugin'ler, bir sağlayıcıyı veya CLI arka ucunu değiştirmeden çift yönlü metin dönüşümleri bildirebilir:

```typescript
api.registerTextTransforms({
  input: [{ from: /red basket/g, to: "blue basket" }],
  output: [{ from: /blue basket/g, to: "red basket" }],
});
```

`input`, CLI'ya aktarılan sistem istemini ve kullanıcı istemini yeniden yazar. `output`, OpenClaw kendi denetim işaretlerini ve kanal teslimini işlemeden önce akışla aktarılan asistan metnini ve ayrıştırılmış son metni yeniden yazar; sağlayıcı destekli model çağrılarında ayrıca akış onarımından sonra ve araç yürütülmeden önce yapılandırılmış araç çağrısı bağımsız değişkenlerindeki dize değerlerini geri yükler. Ham sağlayıcı JSON parçaları değiştirilmeden bırakılır; tüketiciler yapılandırılmış kısmi, bitiş veya sonuç yükünü kullanmalıdır.

Sağlayıcıya özgü JSONL olayları yayan CLI'lar için ilgili arka ucun yapılandırmasında `jsonlDialect` değerini ayarlayın: Claude Code uyumlu akışlar için `claude-stream-json`, Gemini CLI `stream-json` olayları için `gemini-stream-json`.

## Yerel Compaction sahipliği

Bazı CLI arka uçları kendi dökümünü Compaction işlemine tabi tutan bir ajan çalıştırır; bu nedenle OpenClaw, güvenlik amaçlı özetleyicisini bunlar üzerinde çalıştırmamalıdır. Bunu yapmak, arka ucun kendi Compaction işlemiyle çakışır ve turun kesin olarak başarısız olmasına neden olabilir.

`claude-cli` bir araç takımı uç noktasına sahip değildir (Claude Code, Compaction işlemini kendi içinde gerçekleştirir); bu nedenle `ownsNativeCompaction: true` bildirir ve OpenClaw'ın Compaction yolu oturum girdisini değiştirmeden döndürür. Codex gibi yerel araç takımı oturumları ise kendi araç takımı Compaction uç noktalarına yönlendirilmeye devam eder.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

`ownsNativeCompaction` yalnızca Compaction işlemini gerçekten üstlenen bir arka uç için bildirilmelidir: Arka uç, kendi dökümünü bağlam penceresi yakınında güvenilir biçimde sınırlamalı ve devam ettirilebilir bir oturumu kalıcı olarak saklamalıdır (ör. `--resume` / `--session-id`); aksi hâlde ertelenmiş bir oturum bütçeyi aşmış durumda kalabilir.

## Paket MCP katmanları

CLI arka uçları OpenClaw araç çağrılarını doğrudan almaz; ancak bir arka uç, `bundleMcp: true` ile oluşturulan bir MCP yapılandırma katmanını etkinleştirebilir. Paketle gelen mevcut davranış:

- `claude-cli`: oluşturulan katı MCP yapılandırma dosyası.
- `google-gemini-cli`: oluşturulan Gemini sistem ayarları dosyası.

Paket MCP etkinleştirildiğinde OpenClaw:

- CLI işlemi için Gateway araçlarını kullanıma açan bir loopback HTTP MCP sunucusu başlatır; sunucu yalnızca geçerli yürütme denemesi boyunca etkin olan, çalıştırma başına bir bağlam izni (`OPENCLAW_MCP_TOKEN`) ile kimlik doğrulaması yapar;
- araç erişimini alt işlem başlıklarına güvenmek yerine Gateway tarafından seçilen oturum, hesap ve kanal bağlamına bağlar;
- geçerli çalışma alanı için etkinleştirilmiş paket MCP sunucularını yükler ve bunları mevcut arka uç MCP yapılandırması/ayarları biçimiyle birleştirir;
- başlatma yapılandırmasını, sahibi olan plugin'in arka uca ait tümleştirme modunu kullanarak yeniden yazar.

Hiçbir MCP sunucusu etkinleştirilmemiş olsa bile bir arka uç paket MCP'yi etkinleştirdiğinde OpenClaw katı bir yapılandırma eklemeye devam eder; böylece arka plan çalıştırmaları yalıtılmış kalır.

Oturum kapsamındaki paket MCP çalışma zamanları, oturum içinde yeniden kullanılmak üzere önbelleğe alınır ve ardından `mcp.sessionIdleTtlMs` milisaniyelik boşta kalma süresinden sonra sonlandırılır (varsayılan 10 dakika; devre dışı bırakmak için `0` olarak ayarlayın). Kimlik doğrulama yoklamaları, kısa ad oluşturma ve Active Memory geri çağırma gibi tek seferlik gömülü çalıştırmalar, stdio alt işlemlerinin ve Akışa Uygun HTTP/SSE akışlarının çalıştırmadan daha uzun yaşamaması için çalıştırma sonunda temizleme ister.

## Yeniden tohumlama geçmişi sınırı

Yeni bir CLI oturumu önceki bir OpenClaw dökümünden tohumlandığında (örneğin bir `session_expired` yeniden denemesinden sonra), yeniden tohumlama istemlerinin aşırı büyümesini önlemek için oluşturulan `<conversation_history>` bloğu sınırlandırılır. Varsayılan değer 12.288 karakterdir (yaklaşık 3.000 token).

Claude CLI arka uçları bunun yerine bu sınırı çözümlenmiş Claude bağlam penceresine göre ölçeklendirir: daha büyük bağlam pencereleri, sabit bir üst sınıra kadar önceki geçmişten daha büyük bir bölüm alır; diğer CLI arka uçları tutucu varsayılanı korur. Bu sınır yalnızca yeniden tohumlama isteminin önceki geçmiş bloğunu yönetir; canlı oturum çıktı sınırları `reliability.outputLimits` altında ayrı olarak ayarlanır (bkz. [Oturumlar](#sessions)).

## Sınırlamalar

- Doğrudan OpenClaw araç çağrıları yoktur: OpenClaw, araç çağrılarını CLI arka uç protokolüne eklemez. Arka uçlar Gateway araçlarını yalnızca `bundleMcp: true` seçeneğini etkinleştirdiklerinde görür.
- Akış, arka uca özgüdür: bazı arka uçlar JSONL akışı sağlar, diğerleri çıkışa kadar arabelleğe alır.
- Yapılandırılmış çıktılar, CLI'ın kendi JSON biçimine bağlıdır.

## Sorun giderme

| Belirti                    | Çözüm                                                                       |
| -------------------------- | --------------------------------------------------------------------------- |
| CLI bulunamadı             | `command` değerini tam bir yol olarak ayarlayın.                            |
| Yanlış model adı           | `provider/model` değerini CLI'ın model kimliğiyle eşlemek için `modelAliases` kullanın. |
| Oturum sürekliliği yok     | `sessionArg` değerinin ayarlandığından ve `sessionMode` değerinin `none` olmadığından emin olun. |
| Görseller yok sayılıyor    | `imageArg` değerini ayarlayın ve CLI'ın dosya yollarını desteklediğini doğrulayın. |

## İlgili

- [Gateway çalıştırma kılavuzu](/tr/gateway)
- [Yerel modeller](/tr/gateway/local-models)
