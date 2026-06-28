---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir yedek çözüm istersiniz
    - Yerel AI CLI'leri çalıştırıyor ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka uç araç erişimi için MCP loopback köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsüyle yerel yapay zeka CLI geri dönüşü'
title: CLI arka uçları
x-i18n:
    generated_at: "2026-06-28T00:32:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: dfcfbe821887dd5c46fdcca6dbd089bbf5f61d5b2ac9ad59980b156933bb3d54
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw, API sağlayıcıları kapalıyken, hız sınırına takılmışken veya geçici olarak hatalı davranırken **yerel AI CLI'larını** **yalnızca metin yedeği** olarak çalıştırabilir. Bu kasıtlı olarak tutucu bir yaklaşımdır:

- **OpenClaw araçları doğrudan enjekte edilmez**, ancak `bundleMcp: true`
  kullanan arka uçlar, bir loopback MCP köprüsü üzerinden gateway araçlarını alabilir.
- Bunu destekleyen CLI'lar için **JSONL akışı**.
- **Oturumlar desteklenir** (böylece takip turları tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görüntüler geçirilebilir**.

Bu, birincil yol olmaktan çok bir **güvenlik ağı** olarak tasarlanmıştır. Harici API'lere güvenmeden "her zaman çalışır" metin yanıtları istediğinizde kullanın.

ACP oturum kontrolleri, arka plan görevleri, thread/konuşma bağlama ve kalıcı harici kodlama oturumları içeren tam bir harness çalışma zamanı istiyorsanız bunun yerine [ACP Agents](/tr/tools/acp-agents) kullanın. CLI arka uçları ACP değildir.

<Tip>
  Yeni bir arka uç plugin'i mi oluşturuyorsunuz? [CLI arka uç plugin'leri](/tr/plugins/cli-backend-plugins) kullanın. Bu sayfa, zaten kayıtlı bir arka ucu yapılandıran ve işleten kullanıcılar içindir.
</Tip>

## Yeni başlayanlara uygun hızlı başlangıç

Claude Code CLI'yı **hiçbir yapılandırma olmadan** kullanabilirsiniz (paketlenen Anthropic plugin'i varsayılan bir arka uç kaydeder):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

Açık bir agent listesi yapılandırılmadığında `main` varsayılan agent kimliğidir. Birden çok agent kullanıyorsanız bunu çalıştırmak istediğiniz agent kimliğiyle değiştirin.

Gateway'iniz launchd/systemd altında çalışıyor ve PATH en düşük düzeydeyse yalnızca komut yolunu ekleyin:

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

Hepsi bu. CLI'nın kendisi dışında anahtar veya ek kimlik doğrulama yapılandırması gerekmez.

Gateway ana makinesinde bir paketlenmiş CLI arka ucunu **birincil ileti sağlayıcısı** olarak kullanıyorsanız, yapılandırmanız bu arka uca bir model ref içinde veya `agents.defaults.cliBackends` altında açıkça başvurduğunda OpenClaw artık sahibi olan paketlenmiş plugin'i otomatik yükler.

## Yedek olarak kullanma

CLI arka ucunu yedek listenize ekleyin; böylece yalnızca birincil modeller başarısız olduğunda çalışır:

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

Notlar:

- `agents.defaults.models` (izin listesi) kullanıyorsanız CLI arka uç modellerinizi de oraya eklemelisiniz.
- Birincil sağlayıcı başarısız olursa (kimlik doğrulama, hız sınırları, zaman aşımları), OpenClaw sıradaki CLI arka ucunu dener.

## Yapılandırmaya genel bakış

Tüm CLI arka uçları şunun altında bulunur:

```
agents.defaults.cliBackends
```

Her girdi bir **sağlayıcı kimliği** ile anahtarlanır (ör. `claude-cli`, `my-cli`). Sağlayıcı kimliği, model ref'inizin sol tarafı olur:

```
<provider>/<model>
```

### Örnek yapılandırma

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
          // For CLIs with a dedicated prompt-file flag:
          // systemPromptFileArg: "--system-file",
          // Codex-style CLIs can point at a prompt file instead:
          // systemPromptFileConfigArg: "-c",
          // systemPromptFileConfigKey: "model_instructions_file",
          systemPromptWhen: "first",
          imageArg: "--image",
          imageMode: "repeat",
          // Opt in only if this backend may reseed safe invalidated sessions
          // from bounded raw OpenClaw transcript history before compaction.
          reseedFromRawTranscriptWhenUncompacted: true,
          serialize: true,
        },
      },
    },
  },
}
```

## Nasıl çalışır

1. Sağlayıcı önekine (`claude-cli/...`) göre **bir arka uç seçer**.
2. Aynı OpenClaw istemi + çalışma alanı bağlamını kullanarak **bir sistem istemi oluşturur**.
3. Geçmişin tutarlı kalması için (destekleniyorsa) bir oturum kimliğiyle **CLI'yı yürütür**.
   Paketlenen `claude-cli` arka ucu, her OpenClaw oturumu için bir Claude stdio sürecini canlı tutar ve takip turlarını stream-json stdin üzerinden gönderir.
4. **Çıktıyı ayrıştırır** (JSON veya düz metin) ve son metni döndürür.
5. Takip turlarının aynı CLI oturumunu yeniden kullanması için arka uç başına **oturum kimliklerini kalıcı hale getirir**.

<Note>
Paketlenen Anthropic `claude-cli` arka ucu yeniden desteklenmektedir. Anthropic personeli, OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini bize söyledi; bu yüzden OpenClaw, Anthropic yeni bir politika yayımlamadığı sürece bu entegrasyon için `claude -p` kullanımını onaylanmış kabul eder.
</Note>

Paketlenen Anthropic `claude-cli` arka ucu, OpenClaw Skills için Claude Code'un yerel skill çözümleyicisini tercih eder. Geçerli skills anlık görüntüsü, somutlaştırılmış yola sahip en az bir seçili skill içerdiğinde OpenClaw, `--plugin-dir` ile geçici bir Claude Code plugin'i geçirir ve eklenen sistem isteminden yinelenen OpenClaw skills kataloğunu çıkarır. Anlık görüntüde somutlaştırılmış plugin skill yoksa OpenClaw istem kataloğunu yedek olarak tutar. Skill env/API anahtarı geçersiz kılmaları, çalışma için alt süreç ortamına OpenClaw tarafından yine de uygulanır.

Claude CLI'nın kendi etkileşimsiz izin modu da vardır. OpenClaw bunu Claude'a özgü politika yapılandırması eklemek yerine mevcut exec politikasına eşler. OpenClaw tarafından yönetilen Claude canlı oturumları için etkin OpenClaw exec politikası belirleyicidir: YOLO (`tools.exec.security: "full"` ve `tools.exec.ask: "off"`), Claude'u `--permission-mode bypassPermissions` ile başlatırken kısıtlayıcı etkin exec politikası Claude'u `--permission-mode default` ile başlatır. Agent başına `agents.list[].tools.exec` ayarları, o agent için global `tools.exec` ayarını geçersiz kılar. Ham Claude arka uç argümanları yine de `--permission-mode` içerebilir, ancak canlı Claude başlatmaları bu bayrağı etkin OpenClaw exec politikasıyla eşleşecek şekilde normalleştirir.

Paketlenen Anthropic `claude-cli` arka ucu ayrıca OpenClaw `/think` seviyelerini, off olmayan seviyeler için Claude Code'un yerel `--effort` bayrağına eşler. `minimal` ve `low`, `low` değerine; `adaptive` ve `medium`, `medium` değerine; `high`, `xhigh` ve `max` ise doğrudan eşlenir. Diğer CLI arka uçlarının, `/think` oluşturulan CLI'yı etkileyebilmeden önce sahibi olan plugin'in eşdeğer bir argv eşleyicisi bildirmesine ihtiyacı vardır.

OpenClaw paketlenen `claude-cli` arka ucunu kullanmadan önce Claude Code'un kendisi aynı ana makinede zaten oturum açmış olmalıdır:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker kurulumları, Claude Code'un yalnızca ana makinede değil, kalıcı container home içinde de kurulmuş ve oturum açmış olmasını gerektirir. Bkz. [Docker'da Claude CLI arka ucu](/tr/install/docker#claude-cli-backend-in-docker).

`agents.defaults.cliBackends.claude-cli.command` ayarını yalnızca `claude` ikilisi zaten `PATH` üzerinde değilse kullanın.

## Oturumlar

- CLI oturumları destekliyorsa, kimliğin birden çok bayrağa eklenmesi gerektiğinde `sessionArg` (ör. `--session-id`) veya `sessionArgs` (yer tutucu `{sessionId}`) ayarlayın.
- CLI farklı bayraklarla bir **resume alt komutu** kullanıyorsa `resumeArgs` (devam ettirirken `args` yerine geçer) ve isteğe bağlı olarak `resumeOutput` (JSON olmayan devamlar için) ayarlayın.
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönder (saklanan yoksa yeni UUID).
  - `existing`: yalnızca daha önce saklanmışsa bir oturum kimliği gönder.
  - `none`: hiçbir zaman oturum kimliği gönderme.
- `claude-cli` varsayılan olarak `liveSession: "claude-stdio"`, `output: "jsonl"` ve `input: "stdin"` kullanır; böylece takip turları etkin olduğu sürece canlı Claude sürecini yeniden kullanır. Sıcak stdio artık varsayılandır; taşıma alanlarını atlayan özel yapılandırmalar da buna dahildir. Gateway yeniden başlatılırsa veya boşta olan süreç çıkarsa OpenClaw saklanan Claude oturum kimliğinden devam eder. Saklanan oturum kimlikleri, devam etmeden önce var olan okunabilir bir proje transkriptiyle doğrulanır; böylece hayali bağlamalar `--resume` altında sessizce yeni bir Claude CLI oturumu başlatmak yerine `reason=transcript-missing` ile temizlenir.
- Claude canlı oturumları sınırlı JSONL çıktı korumalarını tutar. Varsayılanlar tur başına 8 MiB ve 20.000 ham JSONL satırına kadar izin verir. Araç yoğun Claude turları bunları arka uç başına `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` ve `maxTurnLines` ile artırabilir; OpenClaw bu ayarları 64 MiB ve 100.000 satırla sınırlar.
- Saklanan CLI oturumları, sağlayıcıya ait sürekliliktir. Örtük günlük oturum sıfırlaması bunları kesmez; `/reset` ve açık `session.reset` politikaları yine keser.
- Yeni CLI oturumları normalde yalnızca OpenClaw'ın Compaction özetinden ve Compaction sonrası kuyruktan yeniden tohumlanır. Compaction öncesinde geçersiz kılınan kısa oturumları kurtarmak için bir arka uç `reseedFromRawTranscriptWhenUncompacted: true` ile bunu seçebilir. OpenClaw ham transkript yeniden tohumlamasını yine de sınırlı tutar ve bunu eksik CLI transkriptleri, sistem istemi/MCP değişiklikleri veya session-expired retry gibi güvenli geçersiz kılmalarla sınırlar; kimlik doğrulama profili veya kimlik bilgisi epoch değişiklikleri ham transkript geçmişini asla yeniden tohumlamaz.

Serileştirme notları:

- `serialize: true` aynı kulvardaki çalıştırmaları sıralı tutar.
- Çoğu CLI tek bir sağlayıcı kulvarında serileştirilir.
- Seçili kimlik doğrulama kimliği değiştiğinde OpenClaw saklanan CLI oturum yeniden kullanımını bırakır; buna değişen kimlik doğrulama profili kimliği, statik API anahtarı, statik token veya CLI bir tane açığa çıkarıyorsa OAuth hesap kimliği dahildir. OAuth erişim ve yenileme token rotasyonu saklanan CLI oturumunu kesmez. Bir CLI kararlı bir OAuth hesap kimliği açığa çıkarmıyorsa OpenClaw, devam izinlerini o CLI'nın uygulamasına izin verir.

## claude-cli oturumlarından fallback başlangıcı

Bir `claude-cli` denemesi [`agents.defaults.model.fallbacks`](/tr/concepts/model-failover) içindeki CLI olmayan bir adaya devredildiğinde OpenClaw, sonraki denemeyi Claude Code'un `~/.claude/projects/` konumundaki yerel JSONL transkriptinden toplanan bir bağlam başlangıcıyla tohumlar. Bu tohum olmadan fallback sağlayıcı soğuk başlar, çünkü OpenClaw'ın kendi oturum transkripti `claude-cli` çalışmaları için boştur.

- Başlangıç, en son `/compact` özetini veya `compact_boundary` işaretçisini tercih eder, ardından karakter bütçesine kadar en yeni sınır sonrası turları ekler. Sınır öncesi turlar atılır, çünkü özet zaten onları temsil eder.
- Araç blokları, istem bütçesini dürüst tutmak için kompakt `(tool call: name)` ve `(tool result: …)` ipuçlarında birleştirilir. Özet taşarsa `(truncated)` olarak etiketlenir.
- Aynı sağlayıcı `claude-cli`'dan `claude-cli`'a fallback'ler Claude'un kendi `--resume` özelliğine dayanır ve başlangıcı atlar.
- Tohum mevcut Claude oturum dosyası yolu doğrulamasını yeniden kullanır; bu yüzden keyfi yollar okunamaz.

## Görüntüler (geçiş)

CLI'nız görüntü yollarını kabul ediyorsa `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 görüntüleri geçici dosyalara yazar. `imageArg` ayarlanmışsa bu yollar CLI argümanları olarak geçirilir. `imageArg` eksikse OpenClaw dosya yollarını isteme ekler (yol enjeksiyonu); bu, düz yollardan yerel dosyaları otomatik yükleyen CLI'lar için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan), JSON ayrıştırmayı ve metin + oturum kimliğini çıkarmayı dener.
- Gemini CLI JSON çıktısı için OpenClaw, `usage` eksik veya boş olduğunda yanıt metnini `response` alanından ve kullanım bilgisini `stats` alanından okur. Paketlenen Gemini CLI varsayılanı `stream-json` kullanır, ancak eski `--output-format json` geçersiz kılmaları yine de JSON ayrıştırıcısını kullanır.
- `output: "jsonl"` JSONL akışlarını ayrıştırır ve mevcut olduğunda son agent iletisini ve oturum tanımlayıcılarını çıkarır.
- `output: "text"` stdout'u son yanıt olarak ele alır.

Girdi modları:

- `input: "arg"` (varsayılan), istemi son CLI argümanı olarak geçirir.
- `input: "stdin"` istemi stdin üzerinden gönderir.
- İstem çok uzunsa ve `maxPromptArgChars` ayarlanmışsa stdin kullanılır.

## Varsayılanlar (Plugin'e ait)

Birlikte gelen CLI arka ucu varsayılanları, sahipleri olan Plugin ile birlikte yaşar. Örneğin,
Anthropic `claude-cli` sahibidir ve Google `google-gemini-cli` sahibidir. OpenAI Codex
ajan çalıştırmaları, Codex app-server harness'ını `openai/*` üzerinden kullanır; OpenClaw artık
birlikte gelen bir `codex-cli` arka ucu kaydetmez.

Birlikte gelen Anthropic Plugin'i `claude-cli` için bir varsayılan kaydeder:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Birlikte gelen Google Plugin'i de `google-gemini-cli` için bir varsayılan kaydeder:

- `command: "gemini"`
- `args: ["--skip-trust", "--approval-mode", "auto_edit", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--skip-trust", "--approval-mode", "auto_edit", "--resume", "{sessionId}", "--output-format", "stream-json", "--prompt", "{prompt}"]`
- `output: "jsonl"`
- `resumeOutput: "jsonl"`
- `jsonlDialect: "gemini-stream-json"`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Ön koşul: yerel Gemini CLI kurulmuş ve `PATH` üzerinde
`gemini` olarak kullanılabilir olmalıdır (`brew install gemini-cli` veya
`npm install -g @google/gemini-cli`).

Gemini CLI çıktı notları:

- Varsayılan `stream-json` ayrıştırıcısı asistan `message` olaylarını, araç olaylarını,
  son `result` kullanımını ve ölümcül Gemini hata olaylarını okur.
- Gemini argümanlarını `--output-format json` olarak geçersiz kılarsanız OpenClaw bu
  arka ucu yeniden `output: "json"` olarak normalleştirir ve yanıt metnini JSON `response`
  alanından okur.
- `usage` yoksa veya boşsa kullanım `stats` değerine geri döner.
- `stats.cached`, OpenClaw `cacheRead` içine normalleştirilir.
- `stats.input` eksikse OpenClaw giriş token'larını
  `stats.input_tokens - stats.cached` değerinden türetir.

Yalnızca gerekirse geçersiz kılın (yaygın: mutlak `command` yolu).

## Plugin'e ait varsayılanlar

CLI arka ucu varsayılanları artık Plugin yüzeyinin parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id` değeri, model ref'lerinde sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması yine Plugin varsayılanını geçersiz kılar.
- Arka uca özgü yapılandırma temizliği, isteğe bağlı
  `normalizeConfig` hook'u üzerinden Plugin'e ait kalır.

Küçük istem/mesaj uyumluluk shim'lerine ihtiyaç duyan Plugin'ler,
bir sağlayıcıyı veya CLI arka ucunu değiştirmeden çift yönlü metin dönüşümleri bildirebilir:

```typescript
api.registerTextTransforms({
  input: [
    { from: /red basket/g, to: "blue basket" },
    { from: /paper ticket/g, to: "digital ticket" },
    { from: /left shelf/g, to: "right shelf" },
  ],
  output: [
    { from: /blue basket/g, to: "red basket" },
    { from: /digital ticket/g, to: "paper ticket" },
    { from: /right shelf/g, to: "left shelf" },
  ],
});
```

`input`, CLI'ya geçirilen sistem istemini ve kullanıcı istemini yeniden yazar. `output`,
OpenClaw kendi denetim işaretleyicilerini ve kanal teslimini işlemeden önce
akışla gelen asistan deltalarını ve ayrıştırılmış son metni yeniden yazar.

Sağlayıcıya özgü JSONL olayları yayan CLI'lar için, o arka ucun yapılandırmasında
`jsonlDialect` ayarlayın. Desteklenen lehçeler Claude
Code uyumlu akışlar için `claude-stream-json` ve Gemini CLI `stream-json`
olayları için `gemini-stream-json` değerleridir.

## Yerel Compaction sahipliği

Bazı CLI arka uçları **kendi** transkriptini Compaction yapan bir ajan çalıştırır, bu nedenle OpenClaw bunlara karşı
koruma özetleyicisini çalıştırmamalıdır - bunu yapmak arka ucun kendi
Compaction süreciyle çatışır ve turu kesin olarak başarısız hale getirebilir.

`claude-cli` bir harness uç noktasına sahip değildir - Claude Code dahili olarak Compaction yapar - bu nedenle
`ownsNativeCompaction: true` bildirir ve OpenClaw, Compaction yolundan no-op döndürür.
Codex gibi yerel harness oturumları bunun yerine harness Compaction uç noktasına
yönlendirilmeye devam eder.

Arka uç Compaction sahibi olduğundan, OpenClaw korumasının bir
claude-cli oturumunda tetiklenmesini engellemek için yalnızca
`contextTokens: 1_000_000` ayarlama şeklindeki eski geçici çözüm **artık gerekli değildir** - opt-out bunun yerini alır.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

`ownsNativeCompaction` değerini yalnızca Compaction sürecinin gerçekten sahibi olan bir arka uç için bildirin: arka uç,
bağlam penceresine yaklaştıkça kendi transkriptini güvenilir biçimde sınırlamalı ve
sürdürülebilir bir oturumu kalıcı hale getirmelidir (örn. `--resume` / `--session-id`); aksi halde ertelenmiş bir oturum
bütçenin üzerinde kalabilir. Eşleşen `agentHarnessId` oturumları yine harness uç noktasına yönlendirilir.

## Paket MCP bindirmeleri

CLI arka uçları OpenClaw araç çağrılarını doğrudan almaz, ancak bir arka uç
`bundleMcp: true` ile üretilmiş bir MCP yapılandırma bindirmesine katılabilir.

Mevcut birlikte gelen davranış:

- `claude-cli`: üretilmiş katı MCP yapılandırma dosyası
- `google-gemini-cli`: üretilmiş Gemini sistem ayarları dosyası

Paket MCP etkinleştirildiğinde OpenClaw:

- Gateway araçlarını CLI işlemine sunan bir loopback HTTP MCP sunucusu başlatır
- köprüyü oturum başına bir token ile doğrular (`OPENCLAW_MCP_TOKEN`)
- araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- geçerli çalışma alanı için etkinleştirilmiş paket-MCP sunucularını yükler
- bunları mevcut arka uç MCP yapılandırma/ayar şekliyle birleştirir
- başlatma yapılandırmasını, sahip olan eklentiden gelen arka uca ait entegrasyon modunu kullanarak yeniden yazar

Hiç MCP sunucusu etkin değilse, bir arka uç paket MCP'ye katıldığında OpenClaw yine
katı bir yapılandırma enjekte eder; böylece arka plan çalıştırmaları izole kalır.

Oturum kapsamlı birlikte gelen MCP çalışma zamanları, bir oturum içinde yeniden kullanım için önbelleğe alınır, ardından
`mcp.sessionIdleTtlMs` milisaniye boşta kalma süresinden sonra temizlenir (varsayılan 10
dakika; devre dışı bırakmak için `0` ayarlayın). Kimlik doğrulama yoklamaları,
slug üretimi ve Active Memory geri çağırma gibi tek seferlik gömülü çalıştırmalar, stdio
alt süreçleri ve Streamable HTTP/SSE akışları çalıştırmadan daha uzun yaşamaması için çalıştırma sonunda temizlik ister.

## Yeniden tohumlama geçmişi sınırı

Yeni bir CLI oturumu önceki bir OpenClaw transkriptinden tohumlandığında (örneğin
bir `session_expired` yeniden denemesinden sonra), oluşturulan
`<conversation_history>` bloğu yeniden tohumlama istemlerinin
aşırı büyümesini önlemek için sınırlandırılır. Varsayılan `12288` karakterdir (yaklaşık 3000 token).

Claude CLI arka uçları, çözümlenmiş Claude bağlam katmanından türetilen daha büyük bir sınırı
otomatik olarak kullanır. Standart 200K-token Claude çalıştırmaları daha büyük bir transkript
dilimini tutar ve 1M-token Claude çalıştırmaları daha da büyük bir dilim tutarken diğer CLI
arka uçları ihtiyatlı varsayılanı korur.

- Sınır yalnızca yeniden tohumlama isteminin önceki-geçmiş bloğunu yönetir. Canlı oturum
  çıktı sınırları `reliability.outputLimits` altında ayrı olarak ayarlanır
  (bkz. [Oturumlar](#sessions)).

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrısı yok.** OpenClaw, araç çağrılarını
  CLI arka uç protokolüne enjekte etmez. Arka uçlar gateway araçlarını yalnızca
  `bundleMcp: true` ile katıldıklarında görür.
- **Akış arka uca özgüdür.** Bazı arka uçlar JSONL akışı yapar; diğerleri
  çıkışa kadar arabelleğe alır.
- **Yapılandırılmış çıktılar** CLI'nın JSON biçimine bağlıdır.

## Sorun Giderme

- **CLI bulunamadı**: `command` değerini tam yol olarak ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI model eşlemesi için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` değerinin ayarlandığından ve `sessionMode` değerinin
  `none` olmadığından emin olun.
- **Görseller yok sayılıyor**: `imageArg` ayarlayın (ve CLI'nın dosya yollarını desteklediğini doğrulayın).

## İlgili

- [Gateway runbook](/tr/gateway)
- [Yerel modeller](/tr/gateway/local-models)
