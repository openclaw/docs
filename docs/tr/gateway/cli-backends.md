---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir geri dönüş mekanizması istersiniz
    - Codex CLI veya diğer yerel AI CLI'larını çalıştırıyor ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka uç araçlarına erişim için MCP loopback köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsüyle yerel yapay zeka CLI yedeği'
title: CLI arka uçları
x-i18n:
    generated_at: "2026-05-06T09:12:03Z"
    model: gpt-5.5
    provider: openai
    source_hash: ffba26a7471dd1f1c0b542187126ad45ff09a507c4eb737682d88b0085f4c5d5
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw, API sağlayıcıları kapalı, hız sınırlamasına takılmış veya geçici olarak hatalı davranıyor olduğunda **yerel AI CLI'ları** **yalnızca metin yedeği** olarak çalıştırabilir. Bu bilinçli olarak muhafazakardır:

- **OpenClaw araçları doğrudan enjekte edilmez**, ancak `bundleMcp: true` olan arka uçlar
  bir loopback MCP köprüsü üzerinden gateway araçlarını alabilir.
- Bunu destekleyen CLI'lar için **JSONL streaming**.
- **Oturumlar desteklenir** (böylece takip turları tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görüntüler geçirilebilir**.

Bu, birincil yol yerine bir **güvenlik ağı** olarak tasarlanmıştır. Harici API'lara
bağımlı olmadan "her zaman çalışır" metin yanıtları istediğinizde kullanın.

ACP oturum kontrolleri, arka plan görevleri, thread/konuşma bağlama ve kalıcı harici kodlama oturumları olan tam bir harness runtime istiyorsanız bunun yerine
[ACP Agents](/tr/tools/acp-agents) kullanın. CLI arka uçları ACP değildir.

## Yeni başlayanlara uygun hızlı başlangıç

Codex CLI'ı **hiçbir config olmadan** kullanabilirsiniz (pakete dahil OpenAI Plugin'i
varsayılan bir arka uç kaydeder):

```bash
openclaw agent --message "hi" --model codex-cli/gpt-5.5
```

Gateway'iniz launchd/systemd altında çalışıyor ve PATH minimal ise yalnızca
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

Bu kadar. CLI'ın kendisi dışında anahtar veya ek auth config gerekmez.

Pakete dahil bir CLI arka ucunu bir Gateway host'unda **birincil mesaj sağlayıcısı**
olarak kullanıyorsanız, config'iniz bu arka uca bir model ref içinde veya
`agents.defaults.cliBackends` altında açıkça referans verdiğinde OpenClaw artık
sahibi olan pakete dahil Plugin'i otomatik yükler.

## Yedek olarak kullanma

CLI arka ucunu fallback listenize ekleyin; böylece yalnızca birincil modeller başarısız olduğunda çalışır:

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
- Birincil sağlayıcı başarısız olursa (auth, hız limitleri, zaman aşımları), OpenClaw
  sonra CLI arka ucunu dener.

## Config genel bakışı

Tüm CLI arka uçları şurada bulunur:

```
agents.defaults.cliBackends
```

Her giriş bir **sağlayıcı id'si** ile anahtarlanır (örn. `codex-cli`, `my-cli`).
Sağlayıcı id'si model ref'inizin sol tarafı olur:

```
<provider>/<model>
```

### Örnek config

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

1. Sağlayıcı prefix'ine (`codex-cli/...`) göre **bir arka uç seçer**.
2. Aynı OpenClaw prompt'u + workspace bağlamını kullanarak **bir system prompt oluşturur**.
3. Geçmişin tutarlı kalması için (destekleniyorsa) bir oturum id'siyle **CLI'ı çalıştırır**.
   Pakete dahil `claude-cli` arka ucu, OpenClaw oturumu başına bir Claude stdio sürecini canlı tutar
   ve takip turlarını stream-json stdin üzerinden gönderir.
4. **Çıktıyı parse eder** (JSON veya düz metin) ve son metni döndürür.
5. Takip turlarının aynı CLI oturumunu yeniden kullanması için arka uç başına **oturum id'lerini kalıcılaştırır**.

<Note>
Pakete dahil Anthropic `claude-cli` arka ucu tekrar destekleniyor. Anthropic personeli
OpenClaw tarzı Claude CLI kullanımına tekrar izin verildiğini söyledi; bu nedenle OpenClaw,
Anthropic yeni bir politika yayımlamadığı sürece bu entegrasyon için `claude -p` kullanımını
onaylanmış olarak değerlendirir.
</Note>

Pakete dahil OpenAI `codex-cli` arka ucu, OpenClaw'ın system prompt'unu
Codex'in `model_instructions_file` config override'ı üzerinden geçirir (`-c
model_instructions_file="..."`). Codex, Claude tarzı bir
`--append-system-prompt` flag'i sunmaz; bu yüzden OpenClaw her yeni Codex CLI oturumu için
birleştirilmiş prompt'u geçici bir dosyaya yazar.

Pakete dahil Anthropic `claude-cli` arka ucu, OpenClaw skills snapshot'ını iki şekilde alır:
eklenen system prompt içindeki kompakt OpenClaw skills kataloğu ve
`--plugin-dir` ile geçirilen geçici bir Claude Code Plugin'i. Plugin,
yalnızca o agent/oturum için uygun Skills'leri içerir; böylece Claude Code'un yerel skill
çözümleyicisi, OpenClaw'ın normalde prompt'ta duyuracağı aynı filtrelenmiş seti görür.
Skill env/API key override'ları, çalışma için child process ortamına OpenClaw tarafından
hala uygulanır.

Claude CLI'ın kendi noninteractive izin modu da vardır. OpenClaw bunu Claude'a özgü config eklemek yerine mevcut exec politikasına eşler: etkili istenen exec politikası YOLO olduğunda (`tools.exec.security: "full"` ve
`tools.exec.ask: "off"`), OpenClaw `--permission-mode bypassPermissions` ekler.
Agent başına `agents.list[].tools.exec` ayarları, o agent için global `tools.exec` ayarlarını
override eder. Farklı bir Claude modunu zorlamak için
`agents.defaults.cliBackends.claude-cli.args` ve eşleşen `resumeArgs` altında
`--permission-mode default` veya `--permission-mode acceptEdits` gibi açık raw arka uç arg'ları ayarlayın.

Pakete dahil Anthropic `claude-cli` arka ucu ayrıca OpenClaw `/think` seviyelerini
kapalı olmayan seviyeler için Claude Code'un yerel `--effort` flag'ine eşler. `minimal` ve
`low`, `low` değerine; `adaptive` ve `medium`, `medium` değerine eşlenir; `high`,
`xhigh` ve `max` doğrudan eşlenir. Diğer CLI arka uçlarının, `/think` oluşturulan CLI'ı etkileyebilmeden önce
sahibi olan Plugin tarafından eşdeğer bir argv eşleyici bildirmesi gerekir.

OpenClaw pakete dahil `claude-cli` arka ucunu kullanabilmeden önce, Claude Code'un kendisi
aynı host'ta zaten login olmuş olmalıdır:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

`agents.defaults.cliBackends.claude-cli.command` değerini yalnızca `claude`
binary'si zaten `PATH` üzerinde değilse kullanın.

## Oturumlar

- CLI oturumları destekliyorsa, ID'nin birden fazla flag içine eklenmesi gerektiğinde
  `sessionArg` (örn. `--session-id`) veya `sessionArgs` (placeholder `{sessionId}`) ayarlayın.
- CLI farklı flag'lere sahip bir **resume subcommand** kullanıyorsa,
  `resumeArgs` (resume sırasında `args` yerine geçer) ve isteğe bağlı olarak `resumeOutput`
  (JSON olmayan resume'lar için) ayarlayın.
- `sessionMode`:
  - `always`: her zaman bir oturum id'si gönderir (saklanan yoksa yeni UUID).
  - `existing`: yalnızca daha önce saklanmış bir oturum id'si varsa gönderir.
  - `none`: hiçbir zaman oturum id'si göndermez.
- `claude-cli` varsayılan olarak `liveSession: "claude-stdio"`, `output: "jsonl"` ve
  `input: "stdin"` kullanır; böylece takip turları, aktif olduğu sürece canlı Claude sürecini
  yeniden kullanır. Özel config'lerde transport alanları atlandığında bile artık warm stdio varsayılandır.
  Gateway yeniden başlarsa veya idle süreç çıkarsa, OpenClaw saklanan Claude oturum id'sinden devam eder.
  Saklanan oturum id'leri, resume'dan önce mevcut okunabilir bir proje transcript'ine karşı doğrulanır;
  böylece hayalet bağlamalar `--resume` altında sessizce yeni bir Claude CLI oturumu başlatmak yerine
  `reason=transcript-missing` ile temizlenir.
- Claude canlı oturumları sınırlı JSONL çıktı korumalarını tutar. Varsayılanlar tur başına
  8 MiB'ye ve 20.000 raw JSONL satırına kadar izin verir. Araç yoğun Claude turları bunları arka uç başına
  `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars`
  ve `maxTurnLines` ile yükseltebilir; OpenClaw bu ayarları 64 MiB ve 100.000
  satırla sınırlar.
- Saklanan CLI oturumları sağlayıcıya ait sürekliliktir. Örtük günlük oturum reset'i
  onları kesmez; `/reset` ve açık `session.reset` politikaları yine keser.

Serializasyon notları:

- `serialize: true` aynı lane'deki çalıştırmaları sıralı tutar.
- Çoğu CLI tek bir sağlayıcı lane'inde serialize edilir.
- Seçilen auth kimliği değiştiğinde OpenClaw saklanan CLI oturum yeniden kullanımını düşürür;
  buna değişen auth profile id, static API key, static token veya CLI bir tane sunduğunda OAuth
  hesap kimliği dahildir. OAuth access ve refresh token rotasyonu saklanan CLI oturumunu kesmez.
  Bir CLI stabil bir OAuth hesap id'si sunmuyorsa, OpenClaw resume izinlerini o CLI'ın
  zorlamasına bırakır.

## claude-cli oturumlarından fallback başlangıcı

Bir `claude-cli` denemesi [`agents.defaults.model.fallbacks`](/tr/concepts/model-failover) içindeki
CLI olmayan bir adaya failover yaptığında, OpenClaw sonraki denemeyi Claude Code'un
`~/.claude/projects/` konumundaki yerel JSONL transcript'inden alınan bir bağlam başlangıcıyla tohumlar.
Bu seed olmadan fallback sağlayıcı soğuk başlar; çünkü OpenClaw'ın kendi oturum transcript'i
`claude-cli` çalıştırmaları için boştur.

- Başlangıç, en son `/compact` özetini veya `compact_boundary` işaretleyicisini tercih eder,
  ardından char bütçesine kadar en son post-boundary turları ekler. Pre-boundary turlar,
  özet onları zaten temsil ettiği için düşürülür.
- Prompt bütçesini dürüst tutmak için tool block'ları kompakt `(tool call: name)` ve
  `(tool result: …)` ipuçlarında birleştirilir. Özet taşarsa
  `(truncated)` olarak etiketlenir.
- Aynı sağlayıcı `claude-cli` -> `claude-cli` fallback'leri Claude'un kendi
  `--resume` mekanizmasına dayanır ve başlangıcı atlar.
- Seed, mevcut Claude session-file yol doğrulamasını yeniden kullanır; bu nedenle
  rastgele yollar okunamaz.

## Görüntüler (geçiş)

CLI'ınız görüntü yollarını kabul ediyorsa `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 görüntüleri temp dosyalara yazar. `imageArg` ayarlanmışsa bu
yollar CLI arg'ları olarak geçirilir. `imageArg` eksikse OpenClaw dosya yollarını
prompt'a ekler (path injection); bu da düz yollardan yerel dosyaları otomatik yükleyen CLI'lar için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan) JSON parse etmeyi ve metin + oturum id'si çıkarmayı dener.
- Gemini CLI JSON çıktısı için OpenClaw yanıt metnini `response` içinden, kullanımı ise
  `usage` eksik veya boş olduğunda `stats` içinden okur.
- `output: "jsonl"` JSONL stream'lerini parse eder (örneğin Codex CLI `--json`) ve varsa son agent mesajını ve oturum
  tanımlayıcılarını çıkarır.
- `output: "text"` stdout'u son yanıt olarak değerlendirir.

Girdi modları:

- `input: "arg"` (varsayılan) prompt'u son CLI arg'ı olarak geçirir.
- `input: "stdin"` prompt'u stdin üzerinden gönderir.
- Prompt çok uzunsa ve `maxPromptArgChars` ayarlanmışsa stdin kullanılır.

## Varsayılanlar (Plugin'e ait)

Pakete dahil OpenAI Plugin'i ayrıca `codex-cli` için bir varsayılan kaydeder:

- `command: "codex"`
- `args: ["exec","--json","--color","never","--sandbox","workspace-write","--skip-git-repo-check"]`
- `resumeArgs: ["exec","resume","{sessionId}","-c","sandbox_mode=\"workspace-write\"","--skip-git-repo-check"]`
- `output: "jsonl"`
- `resumeOutput: "text"`
- `modelArg: "--model"`
- `imageArg: "--image"`
- `sessionMode: "existing"`

Pakete dahil Google Plugin'i ayrıca `google-gemini-cli` için bir varsayılan kaydeder:

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
- Kullanım, `usage` yoksa veya boşsa `stats` değerine geri döner.
- `stats.cached`, OpenClaw `cacheRead` biçimine normalleştirilir.
- `stats.input` eksikse OpenClaw, giriş tokenlarını
  `stats.input_tokens - stats.cached` değerinden türetir.

Yalnızca gerekirse geçersiz kılın (yaygın durum: mutlak `command` yolu).

## Plugin'e ait varsayılanlar

CLI arka uç varsayılanları artık Plugin yüzeyinin bir parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id` değeri, model başvurularında sağlayıcı öneki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması yine de Plugin varsayılanını geçersiz kılar.
- Arka uca özgü yapılandırma temizliği, isteğe bağlı
  `normalizeConfig` hook'u üzerinden Plugin'e ait kalır.

Küçük prompt/mesaj uyumluluk shim'lerine ihtiyaç duyan Plugin'ler, bir sağlayıcıyı veya CLI arka ucunu değiştirmeden çift yönlü metin dönüşümleri bildirebilir:

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
OpenClaw kendi denetim işaretleyicilerini ve kanal teslimini işlemeden önce akışla gelen asistan deltalarını ve ayrıştırılmış nihai metni yeniden yazar.

Claude Code stream-json uyumlu JSONL yayan CLI'ler için, ilgili arka uç yapılandırmasında
`jsonlDialect: "claude-stream-json"` ayarlayın.

## Bundle MCP katmanları

CLI arka uçları OpenClaw araç çağrılarını doğrudan almaz, ancak bir arka uç
`bundleMcp: true` ile oluşturulan bir MCP yapılandırma katmanına katılabilir.

Geçerli paketlenmiş davranış:

- `claude-cli`: oluşturulan katı MCP yapılandırma dosyası
- `codex-cli`: `mcp_servers` için satır içi yapılandırma geçersiz kılmaları; oluşturulan
  OpenClaw loopback sunucusu, MCP çağrılarının yerel onay istemlerinde takılmaması için Codex'in sunucu başına araç onay modu ile işaretlenir
- `google-gemini-cli`: oluşturulan Gemini sistem ayarları dosyası

Bundle MCP etkinleştirildiğinde OpenClaw:

- Gateway araçlarını CLI sürecine açan bir loopback HTTP MCP sunucusu başlatır
- köprünün kimliğini oturum başına bir token (`OPENCLAW_MCP_TOKEN`) ile doğrular
- araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- geçerli çalışma alanı için etkinleştirilmiş bundle-MCP sunucularını yükler
- bunları mevcut arka uç MCP yapılandırması/ayarları biçimiyle birleştirir
- başlatma yapılandırmasını, sahip uzantıdan gelen arka uca ait entegrasyon modunu kullanarak yeniden yazar

Hiçbir MCP sunucusu etkin değilse, bir arka uç bundle MCP'ye katıldığında OpenClaw yine de katı bir yapılandırma enjekte eder, böylece arka plan çalıştırmaları izole kalır.

Oturum kapsamlı paketlenmiş MCP runtime'ları bir oturum içinde yeniden kullanım için önbelleğe alınır, ardından
`mcp.sessionIdleTtlMs` milisaniye boşta kalma süresinden sonra temizlenir (varsayılan 10
dakika; devre dışı bırakmak için `0` ayarlayın). Kimlik doğrulama yoklamaları,
slug oluşturma ve active-memory recall gibi tek seferlik gömülü çalıştırmalar, stdio
alt süreçlerinin ve Streamable HTTP/SSE akışlarının çalıştırmadan daha uzun yaşamaması için çalıştırma sonunda temizlik ister.

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrısı yok.** OpenClaw, araç çağrılarını
  CLI arka uç protokolüne enjekte etmez. Arka uçlar Gateway araçlarını yalnızca
  `bundleMcp: true` ile katıldıklarında görür.
- **Akış arka uca özgüdür.** Bazı arka uçlar JSONL akışı yapar; diğerleri
  çıkışa kadar tamponlar.
- **Yapılandırılmış çıktılar** CLI'nin JSON biçimine bağlıdır.
- **Codex CLI oturumları** metin çıktısı üzerinden sürdürülür (JSONL yoktur); bu, ilk
  `--json` çalıştırmasından daha az yapılandırılmıştır. OpenClaw oturumları yine de
  normal şekilde çalışır.

## Sorun giderme

- **CLI bulunamadı**: `command` değerini tam yol olarak ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI modeli eşlemesi için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` değerinin ayarlandığından ve `sessionMode` değerinin
  `none` olmadığından emin olun (Codex CLI şu anda JSON çıktısıyla sürdüremez).
- **Görseller yok sayıldı**: `imageArg` değerini ayarlayın (ve CLI'nin dosya yollarını desteklediğini doğrulayın).

## İlgili

- [Gateway runbook](/tr/gateway)
- [Yerel modeller](/tr/gateway/local-models)
