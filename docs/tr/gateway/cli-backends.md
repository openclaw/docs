---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir geri dönüş seçeneği istersiniz
    - Codex CLI veya diğer yerel yapay zeka CLI'lerini çalıştırıyor ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka uç araç erişimi için MCP loopback köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsüyle yerel yapay zeka CLI geri dönüşü'
title: CLI arka uçları
x-i18n:
    generated_at: "2026-05-10T19:34:54Z"
    model: gpt-5.5
    provider: openai
    source_hash: e6fbbca3bc7e9c0b87147b91d419c03ea0b112494fa54c1ac041e80e76c7b186
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw, API sağlayıcıları devre dışı kaldığında, hız sınırına takıldığında veya geçici olarak hatalı davrandığında **yerel AI CLI'larını** **yalnızca metin yedeği** olarak çalıştırabilir. Bu bilinçli olarak korumacı tasarlanmıştır:

- **OpenClaw araçları doğrudan enjekte edilmez**, ancak `bundleMcp: true` olan backend'ler
  bir loopback MCP köprüsü üzerinden gateway araçlarını alabilir.
- Destekleyen CLI'lar için **JSONL akışı**.
- **Oturumlar desteklenir** (böylece takip turları tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görüntüler geçirilebilir**.

Bu, birincil yol olmaktan çok bir **güvenlik ağı** olarak tasarlanmıştır. Harici API'lere
bağımlı olmadan "her zaman çalışır" metin yanıtları istediğinizde kullanın.

ACP oturum denetimleri, arka plan görevleri, iş parçacığı/konuşma bağlama ve kalıcı harici kodlama oturumları içeren tam bir harness çalışma zamanı istiyorsanız, bunun yerine
[ACP Agents](/tr/tools/acp-agents) kullanın. CLI backend'leri ACP değildir.

<Tip>
  Yeni bir backend plugin'i mi oluşturuyorsunuz? 
  [CLI backend plugins](/tr/plugins/cli-backend-plugins) kullanın. Bu sayfa, zaten kayıtlı bir backend'i
  yapılandıran ve işleten kullanıcılar içindir.
</Tip>

## Yeni başlayanlar için hızlı başlangıç

Codex CLI'ı **herhangi bir yapılandırma olmadan** kullanabilirsiniz (birlikte gelen OpenAI plugin'i
varsayılan bir backend kaydeder):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Gateway'iniz launchd/systemd altında çalışıyor ve PATH en düşük düzeydeyse, yalnızca
komut yolunu ekleyin:

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
      },
    },
  },
}
```

Hepsi bu kadar. CLI'ın kendisi dışında anahtar veya ek kimlik doğrulama yapılandırması gerekmez.

Gateway ana makinesinde **birincil ileti sağlayıcısı** olarak birlikte gelen bir CLI backend'i kullanırsanız, yapılandırmanız bu backend'e bir model ref içinde veya
`agents.defaults.cliBackends` altında açıkça başvurduğunda OpenClaw artık sahibi olan birlikte gelen plugin'i otomatik olarak yükler.

## Yedek olarak kullanma

Birincil modeller başarısız olduğunda yalnızca o zaman çalışması için yedek listenize bir CLI backend'i ekleyin:

```json5
{
  agents: {
    defaults: {
      model: {
        primary: "anthropic/claude-opus-4-6",
        fallbacks: ["codex-cli/gpt-5.5"],
      },
      models: {
        "anthropic/claude-opus-4-6": { alias: "Opus" },
        "codex-cli/gpt-5.5": {},
      },
    },
  },
}
```

Notlar:

- `agents.defaults.models` (izin listesi) kullanıyorsanız, CLI backend modellerinizi de oraya eklemelisiniz.
- Birincil sağlayıcı başarısız olursa (kimlik doğrulama, hız sınırları, zaman aşımları), OpenClaw
  sonraki olarak CLI backend'ini dener.

## Yapılandırma özeti

Tüm CLI backend'leri şu konumda bulunur:

```
agents.defaults.cliBackends
```

Her girdi bir **sağlayıcı kimliği** ile anahtarlanır (örn. `codex-cli`, `my-cli`).
Sağlayıcı kimliği, model ref'inizin sol tarafı olur:

```
<provider>/<model>
```

### Örnek yapılandırma

```json5
{
  agents: {
    defaults: {
      cliBackends: {
        "codex-cli": {
          command: "/opt/homebrew/bin/codex",
        },
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

## Nasıl çalışır?

1. Sağlayıcı önekine (`codex-cli/...`) göre **bir backend seçer**.
2. Aynı OpenClaw istemi + çalışma alanı bağlamını kullanarak **bir sistem istemi oluşturur**.
3. Geçmişin tutarlı kalması için **CLI'ı** bir oturum kimliğiyle (destekleniyorsa) **çalıştırır**.
   Birlikte gelen `claude-cli` backend'i, her OpenClaw oturumu için bir Claude stdio sürecini canlı tutar
   ve takip turlarını stream-json stdin üzerinden gönderir.
4. **Çıktıyı ayrıştırır** (JSON veya düz metin) ve son metni döndürür.
5. Takiplerin aynı CLI oturumunu yeniden kullanması için backend başına **oturum kimliklerini kalıcı hale getirir**.

<Note>
Birlikte gelen Anthropic `claude-cli` backend'i yeniden desteklenmektedir. Anthropic çalışanları
bize OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle OpenClaw,
Anthropic yeni bir politika yayımlamadıkça bu entegrasyon için `claude -p` kullanımını onaylı kabul eder.
</Note>

Birlikte gelen OpenAI `codex-cli` backend'i, OpenClaw'ın sistem istemini
Codex'in `model_instructions_file` yapılandırma geçersiz kılması üzerinden geçirir (`-c
model_instructions_file="..."`). Codex, Claude tarzı bir
`--append-system-prompt` bayrağı sunmadığından, OpenClaw derlenen istemi her yeni Codex CLI oturumu için
geçici bir dosyaya yazar.

Birlikte gelen Anthropic `claude-cli` backend'i, OpenClaw Skills anlık görüntüsünü
iki yolla alır: eklenen sistem istemindeki kompakt OpenClaw Skills kataloğu ve
`--plugin-dir` ile geçirilen geçici bir Claude Code plugin'i. Plugin,
yalnızca o ajan/oturum için uygun Skills'i içerir; böylece Claude Code'un yerel skill
çözümleyicisi, OpenClaw'ın aksi halde istemde duyuracağı aynı filtrelenmiş kümeyi görür.
Skill env/API anahtarı geçersiz kılmaları, çalışma için child process ortamına hâlâ OpenClaw tarafından uygulanır.

Claude CLI'ın kendi etkileşimsiz izin modu da vardır. OpenClaw, Claude'a özgü yapılandırma eklemek yerine bunu
mevcut exec politikasına eşler: geçerli istenen exec politikası YOLO olduğunda (`tools.exec.security: "full"` ve
`tools.exec.ask: "off"`), OpenClaw `--permission-mode bypassPermissions` ekler.
Ajan başına `agents.list[].tools.exec` ayarları, o ajan için global `tools.exec` ayarlarını geçersiz kılar.
Farklı bir Claude modunu zorlamak için `agents.defaults.cliBackends.claude-cli.args` ve eşleşen `resumeArgs` altında
`--permission-mode default` veya `--permission-mode acceptEdits` gibi açık raw backend argümanları ayarlayın.

Birlikte gelen Anthropic `claude-cli` backend'i, OpenClaw `/think` düzeylerini
kapalı olmayan düzeyler için Claude Code'un yerel `--effort` bayrağına da eşler. `minimal` ve
`low`, `low` değerine; `adaptive` ve `medium`, `medium` değerine; `high`,
`xhigh` ve `max` ise doğrudan eşlenir. Diğer CLI backend'lerinde `/think`'in başlatılan CLI'ı etkileyebilmesi için
sahibi olan plugin'in eşdeğer bir argv eşleyicisi bildirmesi gerekir.

OpenClaw birlikte gelen `claude-cli` backend'ini kullanmadan önce, Claude Code'un kendisi
aynı ana makinede zaten oturum açmış olmalıdır:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`agents.defaults.cliBackends.claude-cli.command` değerini yalnızca `claude`
binary'si zaten `PATH` üzerinde değilse kullanın.

## Oturumlar

- CLI oturumları destekliyorsa, kimliğin birden çok bayrağa eklenmesi gerektiğinde
  `sessionArg` (örn. `--session-id`) veya `sessionArgs` (yer tutucu `{sessionId}`) ayarlayın.
- CLI farklı bayraklarla bir **resume alt komutu** kullanıyorsa,
  `resumeArgs` (sürdürürken `args` yerine geçer) ve isteğe bağlı olarak `resumeOutput`
  (JSON olmayan sürdürmeler için) ayarlayın.
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönderir (saklanan yoksa yeni UUID).
  - `existing`: yalnızca daha önce saklanan bir oturum kimliği varsa gönderir.
  - `none`: hiçbir zaman oturum kimliği göndermez.
- `claude-cli` varsayılan olarak `liveSession: "claude-stdio"`, `output: "jsonl"`
  ve `input: "stdin"` kullanır; böylece takip turları etkin olduğu sürece canlı Claude sürecini yeniden kullanır.
  Sıcak stdio artık varsayılandır; taşıma alanlarını atlayan özel yapılandırmalar için de geçerlidir.
  Gateway yeniden başlatılırsa veya boşta duran süreç çıkarsa, OpenClaw saklanan Claude oturum kimliğinden sürdürür.
  Saklanan oturum kimlikleri, sürdürmeden önce mevcut okunabilir bir proje transkriptiyle doğrulanır; böylece hayalet bağlar
  `--resume` altında sessizce yeni bir Claude CLI oturumu başlatmak yerine `reason=transcript-missing`
  ile temizlenir.
- Claude canlı oturumları sınırlı JSONL çıktı korumalarını korur. Varsayılanlar tur başına
  8 MiB ve 20.000 raw JSONL satırına kadar izin verir. Araç yoğun Claude turları bunları backend başına
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  ve `maxTurnLines` ile artırabilir; OpenClaw bu ayarları 64 MiB ve 100.000
  satırla sınırlar.
- Saklanan CLI oturumları sağlayıcıya ait sürekliliktir. Örtük günlük oturum sıfırlaması
  bunları kesmez; `/reset` ve açık `session.reset` politikaları yine keser.
- Yeni CLI oturumları normalde yalnızca OpenClaw'ın Compaction özeti
  ve Compaction sonrası kuyruğundan yeniden tohumlanır. Compaction öncesinde geçersiz kılınan
  kısa oturumları kurtarmak için bir backend
  `reseedFromRawTranscriptWhenUncompacted: true` ile katılabilir. OpenClaw raw
  transkript yeniden tohumlamayı yine sınırlı tutar ve bunu eksik CLI transkriptleri,
  sistem istemi/MCP değişiklikleri veya oturum süresi dolmuş yeniden denemesi gibi güvenli geçersiz kılmalarla sınırlar;
  kimlik doğrulama profili veya kimlik bilgisi epoch değişiklikleri raw transkript geçmişini asla yeniden tohumlamaz.

Serileştirme notları:

- `serialize: true`, aynı kulvardaki çalıştırmaları sıralı tutar.
- Çoğu CLI tek bir sağlayıcı kulvarında serileştirir.
- Seçilen kimlik doğrulama kimliği değiştiğinde OpenClaw, saklanan CLI oturumunun yeniden kullanımını bırakır;
  buna değişen kimlik doğrulama profili kimliği, statik API anahtarı, statik token veya CLI'ın sunduğu durumlarda OAuth
  hesap kimliği dahildir. OAuth erişim ve yenileme token rotasyonu, saklanan CLI oturumunu kesmez.
  Bir CLI kararlı bir OAuth hesap kimliği sunmuyorsa, OpenClaw sürdürme izinlerini o CLI'ın uygulamasına bırakır.

## claude-cli oturumlarından yedek başlangıcı

Bir `claude-cli` denemesi
[`agents.defaults.model.fallbacks`](/tr/concepts/model-failover) içindeki CLI olmayan bir adaya devredildiğinde, OpenClaw
sonraki denemeyi Claude Code'un `~/.claude/projects/` konumundaki yerel
JSONL transkriptinden toplanan bir bağlam başlangıcıyla tohumlar. Bu tohum olmadan, OpenClaw'ın kendi oturum transkripti
`claude-cli` çalıştırmaları için boş olduğundan yedek sağlayıcı soğuk başlar.

- Başlangıç, en son `/compact` özetini veya `compact_boundary`
  işaretçisini tercih eder, ardından karakter bütçesine kadar en yeni sınır sonrası turları ekler.
  Sınır öncesi turlar, özet zaten onları temsil ettiği için atılır.
- Araç blokları, istem bütçesini doğru tutmak için kompakt `(tool call: name)` ve
  `(tool result: …)` ipuçlarında birleştirilir. Özet taşarsa
  `(truncated)` olarak etiketlenir.
- Aynı sağlayıcı `claude-cli` -> `claude-cli` yedekleri Claude'un kendi
  `--resume` mekanizmasına dayanır ve başlangıcı atlar.
- Tohum, mevcut Claude oturum dosyası yolu doğrulamasını yeniden kullanır; bu nedenle
  rastgele yollar okunamaz.

## Görüntüler (geçirme)

CLI'ınız görüntü yollarını kabul ediyorsa `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 görüntüleri geçici dosyalara yazar. `imageArg` ayarlanmışsa, bu
yollar CLI argümanları olarak geçirilir. `imageArg` eksikse, OpenClaw dosya yollarını
isteme ekler (yol enjeksiyonu); bu, yerel dosyaları düz yollardan otomatik yükleyen CLI'lar için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan), JSON ayrıştırmayı ve metin + oturum kimliği çıkarmayı dener.
- Gemini CLI JSON çıktısı için OpenClaw, `usage` eksik veya boş olduğunda yanıt metnini `response` içinden ve
  kullanımı `stats` içinden okur.
- `output: "jsonl"`, JSONL akışlarını (örneğin Codex CLI `--json`) ayrıştırır ve varsa son ajan iletisini ve oturum
  tanımlayıcılarını çıkarır.
- `output: "text"`, stdout'u son yanıt olarak kabul eder.

Giriş modları:

- `input: "arg"` (varsayılan), istemi son CLI argümanı olarak geçirir.
- `input: "stdin"`, istemi stdin üzerinden gönderir.
- İstem çok uzunsa ve `maxPromptArgChars` ayarlanmışsa stdin kullanılır.

## Varsayılanlar (plugin'e ait)

Birlikte gelen OpenAI plugin'i ayrıca `codex-cli` için bir varsayılan kaydeder:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Paketle gelen Google Plugin'i ayrıca `google-gemini-cli` için bir varsayılan kaydeder:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Ön koşul: yerel Gemini CLI kurulu olmalı ve `PATH` üzerinde
`gemini` olarak kullanılabilir olmalıdır (`brew install gemini-cli` veya
`npm install -g @google/gemini-cli`).

Gemini CLI JSON notları:

- Yanıt metni JSON `response` alanından okunur.
- `usage` yoksa veya boşsa kullanım `stats` değerine geri döner.
- `stats.cached`, OpenClaw `cacheRead` olarak normalleştirilir.
- `stats.input` eksikse OpenClaw giriş token'larını
  `stats.input_tokens - stats.cached` değerinden türetir.

Yalnızca gerekirse geçersiz kılın (yaygın durum: mutlak `command` yolu).

## Plugin'e ait varsayılanlar

CLI arka uç varsayılanları artık Plugin yüzeyinin bir parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id` değeri, model başvurularında sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması yine de Plugin varsayılanını geçersiz kılar.
- Arka uca özgü yapılandırma temizliği, isteğe bağlı
  `normalizeConfig` hook'u üzerinden Plugin'e ait kalır.

Küçük prompt/mesaj uyumluluk şimlerine ihtiyaç duyan Plugin'ler, bir sağlayıcıyı veya CLI arka ucunu değiştirmeden çift yönlü metin dönüşümleri bildirebilir:

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

`input`, CLI'ye geçirilen sistem prompt'unu ve kullanıcı prompt'unu yeniden yazar. `output`,
OpenClaw kendi kontrol işaretçilerini ve kanal teslimini işlemeden önce akıştaki asistan deltalarını ve ayrıştırılmış son metni yeniden yazar.

Claude Code stream-json uyumlu JSONL yayan CLI'ler için, o arka ucun yapılandırmasında
`jsonlDialect: "claude-stream-json"` ayarlayın.

## Bundle MCP kaplamaları

CLI arka uçları OpenClaw araç çağrılarını doğrudan almaz, ancak bir arka uç
`bundleMcp: true` ile oluşturulan MCP yapılandırma kaplamasına dahil olmayı seçebilir.

Geçerli paketlenmiş davranış:

- `claude-cli`: oluşturulan katı MCP yapılandırma dosyası
- `codex-cli`: `mcp_servers` için satır içi yapılandırma geçersiz kılmaları; oluşturulan
  OpenClaw loopback sunucusu, MCP çağrılarının yerel onay prompt'larında takılmaması için Codex'in sunucu başına araç onay modu ile işaretlenir
- `google-gemini-cli`: oluşturulan Gemini sistem ayarları dosyası

Bundle MCP etkinleştirildiğinde OpenClaw:

- CLI sürecine Gateway araçlarını sunan bir loopback HTTP MCP sunucusu başlatır
- köprünün kimliğini oturum başına bir token ile doğrular (`OPENCLAW_MCP_TOKEN`)
- araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- geçerli çalışma alanı için etkinleştirilmiş bundle-MCP sunucularını yükler
- bunları mevcut arka uç MCP yapılandırma/ayar biçimleriyle birleştirir
- başlatma yapılandırmasını, sahip uzantıdan gelen arka uca ait entegrasyon modunu kullanarak yeniden yazar

Hiç MCP sunucusu etkin değilse, bir arka uç bundle MCP'ye dahil olmayı seçtiğinde
OpenClaw yine de arka plan çalıştırmalarının yalıtılmış kalması için katı bir yapılandırma enjekte eder.

Oturum kapsamlı paketlenmiş MCP çalışma zamanları, bir oturum içinde yeniden kullanım için önbelleğe alınır, ardından `mcp.sessionIdleTtlMs` milisaniye boşta kalma süresinden sonra temizlenir (varsayılan 10
dakika; devre dışı bırakmak için `0` ayarlayın). Kimlik doğrulama yoklamaları,
slug oluşturma ve active-memory recall gibi tek seferlik gömülü çalıştırmalar, stdio
alt süreçlerinin ve Streamable HTTP/SSE akışlarının çalıştırmadan daha uzun yaşamaması için çalıştırma sonunda temizlik ister.

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrısı yok.** OpenClaw, araç çağrılarını
  CLI arka uç protokolüne enjekte etmez. Arka uçlar Gateway araçlarını yalnızca
  `bundleMcp: true` seçtiklerinde görür.
- **Akış arka uca özgüdür.** Bazı arka uçlar JSONL akışı yapar; diğerleri
  çıkışa kadar arabelleğe alır.
- **Yapılandırılmış çıktılar** CLI'nin JSON biçimine bağlıdır.
- **Codex CLI oturumları** metin çıktısı üzerinden sürdürülür (JSONL yoktur), bu da ilk
  `--json` çalıştırmasına göre daha az yapılandırılmıştır. OpenClaw oturumları yine de
  normal şekilde çalışır.

## Sorun giderme

- **CLI bulunamadı**: `command` değerini tam bir yol olarak ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI model eşlemesi için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` ayarlandığından ve `sessionMode` değerinin
  `none` olmadığından emin olun (Codex CLI şu anda JSON çıktısıyla sürdürülemez).
- **Görseller yok sayıldı**: `imageArg` ayarlayın (ve CLI'nin dosya yollarını desteklediğini doğrulayın).

## İlgili

- [Gateway runbook'u](/tr/gateway)
- [Yerel modeller](/tr/gateway/local-models)
