---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir yedek çözüm istersiniz
    - Codex CLI veya diğer yerel yapay zeka CLI'larını çalıştırıyorsunuz ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka uç araç erişimi için MCP loopback köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsüyle yerel yapay zeka CLI yedeği'
title: CLI arka uçları
x-i18n:
    generated_at: "2026-04-30T09:19:51Z"
    model: gpt-5.5
    provider: openai
    source_hash: 438862ed127a823dcdedc4aacb77b2facb13caa08f7986ef8402833777b6574e
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw, API sağlayıcıları çalışmadığında, hız sınırına takıldığında veya geçici olarak hatalı davrandığında **yalnızca metin yedeği** olarak **yerel AI CLI'ları** çalıştırabilir. Bu tasarım özellikle muhafazakardır:

- **OpenClaw araçları doğrudan enjekte edilmez**, ancak `bundleMcp: true` kullanan arka uçlar
  bir local loopback MCP köprüsü üzerinden gateway araçlarını alabilir.
- Destekleyen CLI'lar için **JSONL streaming**.
- **Oturumlar desteklenir** (böylece takip turları tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görüntüler geçirilebilir**.

Bu, birincil yol olmaktan çok bir **güvenlik ağı** olarak tasarlanmıştır. Harici API'lara
bağlı kalmadan “her zaman çalışır” metin yanıtları istediğinizde kullanın.

ACP oturum kontrolleri, arka plan görevleri, iş parçacığı/konuşma bağlama ve kalıcı harici kodlama oturumları olan tam bir harness runtime istiyorsanız bunun yerine
[ACP Agents](/tr/tools/acp-agents) kullanın. CLI arka uçları ACP değildir.

## Başlangıç dostu hızlı başlangıç

Codex CLI'ı **herhangi bir yapılandırma olmadan** kullanabilirsiniz (pakete dahil OpenAI plugin
varsayılan bir arka uç kaydeder):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Gateway'iniz launchd/systemd altında çalışıyor ve PATH asgari düzeydeyse yalnızca
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

Hepsi bu. CLI'ın kendisi dışında anahtar ya da ek kimlik doğrulama yapılandırması gerekmez.

Paketli bir CLI arka ucunu bir Gateway ana makinesinde **birincil ileti sağlayıcısı**
olarak kullanırsanız, yapılandırmanız bir model referansında veya
`agents.defaults.cliBackends` altında bu arka uca açıkça başvurduğunda OpenClaw artık sahibi olan paketli plugin'i otomatik yükler.

## Yedek olarak kullanma

CLI arka ucunu yedek listenize ekleyin; böylece yalnızca birincil modeller başarısız olduğunda çalışır:

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

- `agents.defaults.models` (izin listesi) kullanıyorsanız CLI arka uç modellerinizi de oraya eklemelisiniz.
- Birincil sağlayıcı başarısız olursa (kimlik doğrulama, hız sınırları, zaman aşımları), OpenClaw
  ardından CLI arka ucunu dener.

## Yapılandırmaya genel bakış

Tüm CLI arka uçları şurada bulunur:

```
agents.defaults.cliBackends
```

Her giriş bir **sağlayıcı kimliği** ile anahtarlanır (örn. `codex-cli`, `my-cli`).
Sağlayıcı kimliği, model referansınızın sol tarafı olur:

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
          serialize: true,
        },
      },
    },
  },
}
```

## Nasıl çalışır

1. Sağlayıcı önekine (`codex-cli/...`) göre **bir arka uç seçer**.
2. Aynı OpenClaw istemini ve çalışma alanı bağlamını kullanarak **bir sistem istemi oluşturur**.
3. Geçmişin tutarlı kalması için (destekleniyorsa) bir oturum kimliğiyle **CLI'ı yürütür**.
   Paketli `claude-cli` arka ucu, her OpenClaw oturumu için bir Claude stdio sürecini canlı tutar
   ve takip turlarını stream-json stdin üzerinden gönderir.
4. **Çıktıyı ayrıştırır** (JSON veya düz metin) ve son metni döndürür.
5. Her arka uç için **oturum kimliklerini kalıcı hale getirir**, böylece takip turları aynı CLI oturumunu yeniden kullanır.

<Note>
Paketli Anthropic `claude-cli` arka ucu yeniden desteklenmektedir. Anthropic personeli
OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini söyledi; bu nedenle OpenClaw,
Anthropic yeni bir politika yayımlamadıkça bu entegrasyon için `claude -p` kullanımını onaylı kabul eder.
</Note>

Paketli OpenAI `codex-cli` arka ucu, OpenClaw'ın sistem istemini Codex'in
`model_instructions_file` yapılandırma geçersiz kılması üzerinden geçirir (`-c
model_instructions_file="..."`). Codex, Claude tarzı bir
`--append-system-prompt` bayrağı sunmadığından OpenClaw, her yeni Codex CLI oturumu için birleştirilmiş istemi
geçici bir dosyaya yazar.

Paketli Anthropic `claude-cli` arka ucu, OpenClaw skills snapshot'ını iki şekilde alır:
eklenen sistem istemindeki kompakt OpenClaw skills kataloğu ve `--plugin-dir` ile geçirilen
geçici bir Claude Code plugin'i. Plugin yalnızca ilgili agent/oturum için uygun Skills'i içerir; böylece
Claude Code'un yerel skill çözümleyicisi, OpenClaw'ın istemde aksi halde duyuracağı aynı filtrelenmiş kümeyi görür.
Skill env/API anahtarı geçersiz kılmaları, çalışma için OpenClaw tarafından alt süreç ortamına yine uygulanır.

Claude CLI'ın kendi etkileşimsiz izin modu da vardır. OpenClaw bunu
Claude'a özgü yapılandırma eklemek yerine mevcut exec politikasına eşler: etkin istenen exec politikası YOLO olduğunda (`tools.exec.security: "full"` ve
`tools.exec.ask: "off"`), OpenClaw `--permission-mode bypassPermissions` ekler.
Agent başına `agents.list[].tools.exec` ayarları, o agent için genel `tools.exec` ayarlarını geçersiz kılar.
Farklı bir Claude modunu zorlamak için `agents.defaults.cliBackends.claude-cli.args` altında
`--permission-mode default` veya `--permission-mode acceptEdits` gibi açık ham arka uç argümanları ve eşleşen `resumeArgs` ayarlayın.

OpenClaw paketli `claude-cli` arka ucunu kullanmadan önce, Claude Code'un kendisi
aynı ana makinede zaten oturum açmış olmalıdır:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`agents.defaults.cliBackends.claude-cli.command` seçeneğini yalnızca `claude`
ikilisi zaten `PATH` üzerinde değilse kullanın.

## Oturumlar

- CLI oturumları destekliyorsa, kimliğin birden fazla bayrağa eklenmesi gerektiğinde `sessionArg` (örn. `--session-id`) veya
  `sessionArgs` (yer tutucu `{sessionId}`) ayarlayın.
- CLI farklı bayraklara sahip bir **resume alt komutu** kullanıyorsa,
  `resumeArgs` (sürdürürken `args` yerine geçer) ve isteğe bağlı olarak `resumeOutput`
  (JSON olmayan sürdürmeler için) ayarlayın.
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönderir (saklanan yoksa yeni UUID).
  - `existing`: yalnızca daha önce saklanan bir oturum kimliği varsa gönderir.
  - `none`: hiçbir zaman oturum kimliği göndermez.
- `claude-cli` varsayılan olarak `liveSession: "claude-stdio"`, `output: "jsonl"`
  ve `input: "stdin"` kullanır; böylece takip turları etkin olduğu sürece canlı Claude sürecini yeniden kullanır.
  Sıcak stdio artık varsayılandır; taşıma alanlarını atlayan özel yapılandırmalar için de buna dahildir.
  Gateway yeniden başlatılırsa veya boşta kalan süreç çıkarsa,
  OpenClaw saklanan Claude oturum kimliğinden sürdürür. Saklanan oturum
  kimlikleri, sürdürmeden önce okunabilir mevcut bir proje transcript'ine karşı doğrulanır; böylece sahte bağlar
  `--resume` altında sessizce yeni bir Claude CLI oturumu başlatmak yerine `reason=transcript-missing`
  ile temizlenir.
- Saklanan CLI oturumları sağlayıcıya ait sürekliliktir. Örtük günlük oturum
  sıfırlaması onları kesmez; `/reset` ve açık `session.reset` politikaları yine
  keser.

Serileştirme notları:

- `serialize: true` aynı şeritteki çalışmaları sıralı tutar.
- Çoğu CLI tek bir sağlayıcı şeridinde serileştirir.
- Seçilen kimlik doğrulama kimliği değiştiğinde OpenClaw saklanan CLI oturumu yeniden kullanımını bırakır;
  buna değişen bir auth profile kimliği, statik API anahtarı, statik token veya CLI'ın sunduğu OAuth
  hesap kimliği dahildir. OAuth erişim ve yenileme token döndürmesi
  saklanan CLI oturumunu kesmez. Bir CLI kararlı bir OAuth hesap kimliği sunmuyorsa,
  OpenClaw sürdürme izinlerini o CLI'ın uygulamasına bırakır.

## claude-cli oturumlarından yedek başlangıç metni

Bir `claude-cli` denemesi [`agents.defaults.model.fallbacks`](/tr/concepts/model-failover) içindeki
CLI olmayan bir adaya devrettiğinde, OpenClaw bir sonraki denemeyi
`~/.claude/projects/` konumundaki Claude Code'un yerel JSONL transcript'inden toplanan bir bağlam başlangıç metniyle besler.
Bu tohum olmadan yedek sağlayıcı soğuk başlardı, çünkü OpenClaw'ın kendi oturum transcript'i
`claude-cli` çalışmaları için boştur.

- Başlangıç metni en yeni `/compact` özetini veya `compact_boundary`
  işaretleyicisini tercih eder, ardından karakter bütçesine kadar sınır sonrası en son turları ekler.
  Sınır öncesi turlar atılır çünkü özet zaten onları temsil eder.
- Araç blokları, istem bütçesini dürüst tutmak için kompakt `(tool call: name)` ve
  `(tool result: …)` ipuçlarında birleştirilir. Özet taşarsa
  `(truncated)` olarak etiketlenir.
- Aynı sağlayıcıda `claude-cli`'dan `claude-cli`'a yedekler, Claude'un kendi
  `--resume` mekanizmasına dayanır ve başlangıç metnini atlar.
- Tohum mevcut Claude oturum dosyası yolu doğrulamasını yeniden kullanır; böylece
  rastgele yollar okunamaz.

## Görüntüler (geçirme)

CLI'ınız görüntü yollarını kabul ediyorsa `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 görüntüleri geçici dosyalara yazar. `imageArg` ayarlanmışsa bu
yollar CLI argümanları olarak geçirilir. `imageArg` eksikse OpenClaw dosya yollarını
isteme ekler (yol enjeksiyonu); bu, düz yollardan yerel dosyaları otomatik
yükleyen CLI'lar için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan) JSON'u ayrıştırmaya ve metin + oturum kimliği çıkarmaya çalışır.
- Gemini CLI JSON çıktısı için OpenClaw, `usage` eksik veya boş olduğunda yanıt metnini `response` alanından,
  kullanımı ise `stats` alanından okur.
- `output: "jsonl"` JSONL akışlarını (örneğin Codex CLI `--json`) ayrıştırır ve varsa son agent iletisini ve oturum
  tanımlayıcılarını çıkarır.
- `output: "text"` stdout'u son yanıt olarak kabul eder.

Girdi modları:

- `input: "arg"` (varsayılan) istemi son CLI argümanı olarak geçirir.
- `input: "stdin"` istemi stdin üzerinden gönderir.
- İstem çok uzunsa ve `maxPromptArgChars` ayarlanmışsa stdin kullanılır.

## Varsayılanlar (plugin'e ait)

Paketli OpenAI plugin'i ayrıca `codex-cli` için bir varsayılan kaydeder:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Paketli Google plugin'i ayrıca `google-gemini-cli` için bir varsayılan kaydeder:

- `command: "gemini"`
- `args: ["--output-format", "json", "--prompt", "{prompt}"]`
- `resumeArgs: ["--resume", "{sessionId}", "--output-format", "json", "--prompt", "{prompt}"]`
- `imageArg: "@"`
- `imagePathScope: "workspace"`
- `modelArg: "--model"`
- `sessionMode: "existing"`
- `sessionIdFields: ["session_id", "sessionId"]`

Ön koşul: yerel Gemini CLI kurulmuş ve `PATH` üzerinde
`gemini` olarak kullanılabilir olmalıdır (`brew install gemini-cli` veya
`npm install -g @google/gemini-cli`).

Gemini CLI JSON notları:

- Yanıt metni JSON `response` alanından okunur.
- `usage` yoksa veya boşsa kullanım için `stats` kullanılır.
- `stats.cached`, OpenClaw `cacheRead` olarak normalleştirilir.
- `stats.input` eksikse OpenClaw girdi tokenlarını
  `stats.input_tokens - stats.cached` değerinden türetir.

Yalnızca gerekirse geçersiz kılın (yaygın örnek: mutlak `command` yolu).

## Plugin'e ait varsayılanlar

CLI arka uç varsayılanları artık plugin yüzeyinin parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id` değeri, model referanslarında sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması plugin varsayılanını yine geçersiz kılar.
- Arka uca özgü yapılandırma temizliği, isteğe bağlı
  `normalizeConfig` hook'u üzerinden plugin'e ait kalır.

Çok küçük prompt/mesaj uyumluluk ara katmanlarına ihtiyaç duyan Plugin'ler, bir provider veya CLI arka ucunu değiştirmeden çift yönlü metin dönüşümleri bildirebilir:

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

`input`, CLI'ya geçirilen sistem prompt'unu ve kullanıcı prompt'unu yeniden yazar. `output`, OpenClaw kendi denetim işaretçilerini ve kanal teslimini işlemeden önce yayınlanan asistan deltalarını ve ayrıştırılmış nihai metni yeniden yazar.

Claude Code stream-json ile uyumlu JSONL yayan CLI'lar için, ilgili arka ucun yapılandırmasında `jsonlDialect: "claude-stream-json"` ayarlayın.

## Bundle MCP katmanları

CLI arka uçları OpenClaw araç çağrılarını doğrudan almaz, ancak bir arka uç `bundleMcp: true` ile oluşturulan bir MCP yapılandırma katmanını kullanmayı seçebilir.

Mevcut paket davranışı:

- `claude-cli`: oluşturulan katı MCP yapılandırma dosyası
- `codex-cli`: `mcp_servers` için satır içi yapılandırma geçersiz kılmaları; oluşturulan OpenClaw loopback sunucusu Codex'in sunucu başına araç onay modu ile işaretlenir, böylece MCP çağrıları yerel onay prompt'larında takılı kalamaz
- `google-gemini-cli`: oluşturulan Gemini sistem ayarları dosyası

Bundle MCP etkinleştirildiğinde, OpenClaw şunları yapar:

- Gateway araçlarını CLI sürecine sunan bir loopback HTTP MCP sunucusu başlatır
- köprünün kimliğini oturum başına bir belirteçle (`OPENCLAW_MCP_TOKEN`) doğrular
- araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- geçerli çalışma alanı için etkin bundle-MCP sunucularını yükler
- bunları mevcut arka uç MCP yapılandırma/ayar biçimiyle birleştirir
- başlatma yapılandırmasını, sahip olan extension'dan gelen arka uca ait entegrasyon modunu kullanarak yeniden yazar

Hiçbir MCP sunucusu etkin değilse, bir arka uç bundle MCP'yi kullanmayı seçtiğinde OpenClaw yine de katı bir yapılandırma enjekte eder, böylece arka plan çalıştırmaları yalıtılmış kalır.

Oturum kapsamlı paket MCP çalışma zamanları, bir oturum içinde yeniden kullanım için önbelleğe alınır, ardından `mcp.sessionIdleTtlMs` milisaniyelik boşta kalma süresinden sonra temizlenir (varsayılan 10 dakika; devre dışı bırakmak için `0` ayarlayın). Kimlik doğrulama yoklamaları, slug oluşturma ve active-memory recall isteği gibi tek seferlik gömülü çalıştırmalar, stdio alt süreçleri ve Streamable HTTP/SSE akışları çalıştırmadan daha uzun yaşamayacak şekilde çalıştırma sonunda temizlenir.

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrısı yoktur.** OpenClaw, CLI arka uç protokolüne araç çağrıları enjekte etmez. Arka uçlar Gateway araçlarını yalnızca `bundleMcp: true` seçtiklerinde görür.
- **Yayın akışı arka uca özeldir.** Bazı arka uçlar JSONL yayınlar; diğerleri çıkışa kadar arabelleğe alır.
- **Yapılandırılmış çıktılar** CLI'nın JSON biçimine bağlıdır.
- **Codex CLI oturumları** metin çıktısı üzerinden sürdürülür (JSONL yoktur); bu, ilk `--json` çalıştırmasından daha az yapılandırılmıştır. OpenClaw oturumları yine de normal şekilde çalışır.

## Sorun giderme

- **CLI bulunamadı**: `command` değerini tam bir yol olarak ayarlayın.
- **Yanlış model adı**: `provider/model` değerini CLI modeline eşlemek için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` değerinin ayarlandığından ve `sessionMode` değerinin `none` olmadığından emin olun (Codex CLI şu anda JSON çıktısıyla sürdüremez).
- **Görseller yok sayılıyor**: `imageArg` değerini ayarlayın (ve CLI'nın dosya yollarını desteklediğini doğrulayın).

## İlgili

- [Gateway çalışma kitabı](/tr/gateway)
- [Yerel modeller](/tr/gateway/local-models)
