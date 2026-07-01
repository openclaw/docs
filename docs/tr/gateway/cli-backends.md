---
read_when:
    - API sağlayıcıları başarısız olduğunda güvenilir bir yedek seçenek istersiniz
    - Yerel AI CLI'ları çalıştırıyorsunuz ve bunları yeniden kullanmak istiyorsunuz
    - CLI arka uç araç erişimi için MCP loopback köprüsünü anlamak istiyorsunuz
summary: 'CLI arka uçları: isteğe bağlı MCP araç köprüsüyle yerel yapay zeka CLI geri dönüşü'
title: CLI arka uçları
x-i18n:
    generated_at: "2026-07-01T08:27:43Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2296c5e429f3acbc8375892e4539c397c09b973a8d15e21729b51985952dff29
    source_path: gateway/cli-backends.md
    workflow: 16
---

OpenClaw, API sağlayıcıları kapalıyken, hız sınırına takılmışken veya geçici olarak hatalı davranırken **yerel AI CLI'larını** **yalnızca metin yedeği** olarak çalıştırabilir. Bu bilinçli olarak temkinli tasarlanmıştır:

- **OpenClaw araçları doğrudan enjekte edilmez**, ancak `bundleMcp: true`
  olan backend'ler gateway araçlarını bir loopback MCP köprüsü üzerinden alabilir.
- Destekleyen CLI'lar için **JSONL akışı**.
- **Oturumlar desteklenir** (böylece takip eden dönüşler tutarlı kalır).
- CLI görüntü yollarını kabul ediyorsa **görüntüler aktarılabilir**.

Bu, birincil yol olmaktan çok bir **güvenlik ağı** olarak tasarlanmıştır. Harici API'lere bağlı kalmadan "her zaman çalışır" metin yanıtları istediğinizde kullanın.

ACP oturum kontrolleri, arka plan görevleri, iş parçacığı/konuşma bağlama ve kalıcı harici kodlama oturumları olan tam bir harness runtime istiyorsanız bunun yerine
[ACP Agents](/tr/tools/acp-agents) kullanın. CLI backend'leri ACP değildir.

<Tip>
  Yeni bir backend plugin'i mi oluşturuyorsunuz? 
  [CLI backend plugins](/tr/plugins/cli-backend-plugins) kullanın. Bu sayfa, zaten kayıtlı bir backend'i yapılandıran ve işleten kullanıcılar içindir.
</Tip>

## Başlangıç dostu hızlı başlangıç

Claude Code CLI'yi **herhangi bir yapılandırma olmadan** kullanabilirsiniz (paketlenmiş Anthropic plugin'i varsayılan bir backend kaydeder):

```bash
openclaw agent --agent main --message "hi" --model claude-cli/claude-sonnet-4-6
```

Açık bir agent listesi yapılandırılmadığında `main` varsayılan agent kimliğidir. Birden fazla agent kullanıyorsanız bunu çalıştırmak istediğiniz agent kimliğiyle değiştirin.

Gateway'iniz launchd/systemd altında çalışıyorsa ve PATH sınırlıysa, yalnızca komut yolunu ekleyin:

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

Hepsi bu. CLI'nin kendisi dışında anahtar veya ek kimlik doğrulama yapılandırması gerekmez.

Bir gateway host'unda paketlenmiş bir CLI backend'ini **birincil ileti sağlayıcı** olarak kullanırsanız OpenClaw, yapılandırmanız bu backend'e bir model ref içinde veya `agents.defaults.cliBackends` altında açıkça başvurduğunda sahip olan paketlenmiş plugin'i artık otomatik olarak yükler.

## Yedek olarak kullanma

CLI backend'ini yedek listenize ekleyin; böylece yalnızca birincil modeller başarısız olduğunda çalışır:

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

- `agents.defaults.models` (izin listesi) kullanıyorsanız CLI backend modellerinizi de oraya dahil etmelisiniz.
- Birincil sağlayıcı başarısız olursa (kimlik doğrulama, hız sınırları, zaman aşımları), OpenClaw bir sonraki olarak CLI backend'ini dener.

## Yapılandırmaya genel bakış

Tüm CLI backend'leri şunun altında bulunur:

```
agents.defaults.cliBackends
```

Her giriş bir **provider id** ile anahtarlanır (ör. `claude-cli`, `my-cli`).
Provider id, model ref'inizin sol tarafı olur:

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

1. Sağlayıcı önekine (`claude-cli/...`) göre **bir backend seçer**.
2. Aynı OpenClaw prompt'unu + çalışma alanı bağlamını kullanarak **bir sistem prompt'u oluşturur**.
3. Geçmişin tutarlı kalması için CLI'yi bir oturum kimliğiyle (destekleniyorsa) **çalıştırır**.
   Paketlenmiş `claude-cli` backend'i, her OpenClaw oturumu için bir Claude stdio sürecini canlı tutar ve takip eden dönüşleri stream-json stdin üzerinden gönderir.
4. **Çıktıyı ayrıştırır** (JSON veya düz metin) ve son metni döndürür.
5. Takip eden dönüşlerin aynı CLI oturumunu yeniden kullanması için backend başına **oturum kimliklerini kalıcı hale getirir**.

<Note>
Paketlenmiş Anthropic `claude-cli` backend'i yeniden destekleniyor. Anthropic çalışanları, OpenClaw tarzı Claude CLI kullanımına yeniden izin verildiğini bize söyledi; bu yüzden Anthropic yeni bir politika yayımlamadıkça OpenClaw, bu entegrasyon için `claude -p` kullanımını onaylanmış kabul eder.
</Note>

Paketlenmiş Anthropic `claude-cli` backend'i, OpenClaw Skills için Claude Code'un yerel skill çözümleyicisini tercih eder. Geçerli skills anlık görüntüsü, somutlaştırılmış yolu olan en az bir seçili skill içerdiğinde OpenClaw, `--plugin-dir` ile geçici bir Claude Code plugin'i geçirir ve eklenen sistem prompt'undan yinelenen OpenClaw skills kataloğunu çıkarır. Anlık görüntüde somutlaştırılmış plugin skill'i yoksa OpenClaw prompt kataloğunu yedek olarak tutar. Skill env/API anahtarı geçersiz kılmaları, çalıştırma için alt süreç ortamına OpenClaw tarafından yine uygulanır.

Claude CLI'nin ayrıca kendi etkileşimsiz izin modu vardır. OpenClaw bunu Claude'a özgü politika yapılandırması eklemek yerine mevcut exec politikasına eşler.
OpenClaw tarafından yönetilen Claude canlı oturumları için etkin OpenClaw exec politikası yetkilidir: YOLO (`tools.exec.security: "full"` ve `tools.exec.ask: "off"`), Claude'u `--permission-mode bypassPermissions` ile başlatırken, kısıtlayıcı etkin exec politikası Claude'u `--permission-mode default` ile başlatır. Agent başına `agents.list[].tools.exec` ayarları, o agent için global `tools.exec` ayarlarını geçersiz kılar. Ham Claude backend argümanları yine de `--permission-mode` içerebilir, ancak canlı Claude başlatmaları bu bayrağı etkin OpenClaw exec politikasıyla eşleşecek şekilde normalleştirir.

Paketlenmiş Anthropic `claude-cli` backend'i ayrıca OpenClaw `/think` düzeylerini, kapalı olmayan düzeyler için Claude Code'un yerel `--effort` bayrağına eşler. `minimal` ve `low`, `low` değerine; `adaptive` ve `medium`, `medium` değerine; `high`, `xhigh` ve `max` ise doğrudan eşlenir. Diğer CLI backend'lerinde `/think` oluşturulan CLI'yi etkileyebilmeden önce sahip oldukları plugin'in eşdeğer bir argv eşleyici bildirmesi gerekir.

OpenClaw paketlenmiş `claude-cli` backend'ini kullanmadan önce, Claude Code'un aynı host'ta zaten oturum açmış olması gerekir:

```bash
claude auth login
claude auth status --text
openclaw models auth login --provider anthropic --method cli --set-default
```

Docker kurulumlarında Claude Code'un yalnızca host'ta değil, kalıcı container home içinde de kurulu ve oturum açmış olması gerekir. Bkz.
[Docker'da Claude CLI backend'i](/tr/install/docker#claude-cli-backend-in-docker).

`agents.defaults.cliBackends.claude-cli.command` değerini yalnızca `claude` ikilisi zaten `PATH` üzerinde değilse kullanın.

## Oturumlar

- CLI oturumları destekliyorsa, kimliğin birden fazla bayrağa eklenmesi gerektiğinde `sessionArg` (ör. `--session-id`) veya `sessionArgs` (placeholder `{sessionId}`) ayarlayın.
- CLI farklı bayraklara sahip bir **resume alt komutu** kullanıyorsa, `resumeArgs` (sürdürürken `args` yerine geçer) ve isteğe bağlı olarak `resumeOutput` (JSON olmayan sürdürmeler için) ayarlayın.
- `sessionMode`:
  - `always`: her zaman bir oturum kimliği gönder (saklanmış yoksa yeni UUID).
  - `existing`: yalnızca daha önce saklanmışsa bir oturum kimliği gönder.
  - `none`: asla oturum kimliği gönderme.
- `claude-cli` varsayılan olarak `liveSession: "claude-stdio"`, `output: "jsonl"` ve `input: "stdin"` kullanır; böylece takip eden dönüşler etkin olduğu sürece canlı Claude sürecini yeniden kullanır. Özel yapılandırmalarda transport alanları atlandığında bile warm stdio artık varsayılandır. Gateway yeniden başlarsa veya boşta olan süreç çıkarsa OpenClaw saklanan Claude oturum kimliğinden sürdürür. Saklanan oturum kimlikleri, sürdürmeden önce mevcut okunabilir bir proje transcript'ine karşı doğrulanır; böylece phantom bağlamalar `--resume` altında sessizce yeni bir Claude CLI oturumu başlatmak yerine `reason=transcript-missing` ile temizlenir.
- Claude canlı oturumları sınırlı JSONL çıktı korumalarını tutar. Varsayılanlar dönüş başına en fazla 8 MiB ve 20.000 ham JSONL satırına izin verir. Araç ağırlıklı Claude dönüşleri, bunları backend başına `agents.defaults.cliBackends.claude-cli.reliability.outputLimits.maxTurnRawChars` ve `maxTurnLines` ile artırabilir; OpenClaw bu ayarları 64 MiB ve 100.000 satıra sınırlar.
- Saklanan CLI oturumları, sağlayıcının sahip olduğu sürekliliktir. Örtük günlük oturum sıfırlaması bunları kesmez; `/reset` ve açık `session.reset` politikaları yine keser.
- Yeni CLI oturumları normalde yalnızca OpenClaw'ın Compaction özetinden ve Compaction sonrası kuyruktan yeniden tohumlanır. Compaction öncesinde geçersiz kılınan kısa oturumları kurtarmak için bir backend `reseedFromRawTranscriptWhenUncompacted: true` ile katılabilir. OpenClaw ham transcript yeniden tohumlamasını yine sınırlı tutar ve eksik CLI transcript'leri, sistem prompt'u/MCP değişiklikleri veya session-expired yeniden denemesi gibi güvenli geçersiz kılmalarla sınırlar; auth profil veya credential-epoch değişiklikleri ham transcript geçmişini asla yeniden tohumlamaz.

Serileştirme notları:

- `serialize: true` aynı şeritteki çalıştırmaları sıralı tutar.
- Çoğu CLI tek sağlayıcı şeridinde serileştirir.
- OpenClaw, seçilen kimlik doğrulama kimliği değiştiğinde saklanan CLI oturum yeniden kullanımını bırakır; buna değişen auth profil kimliği, statik API anahtarı, statik token veya CLI bir tane açığa çıkarıyorsa OAuth hesap kimliği dahildir. OAuth erişim ve yenileme token rotasyonu saklanan CLI oturumunu kesmez. Bir CLI kararlı bir OAuth hesap kimliği açığa çıkarmıyorsa OpenClaw, sürdürme izinlerini o CLI'nin zorlamasına bırakır.

## claude-cli oturumlarından yedek başlangıç bölümü

Bir `claude-cli` denemesi [`agents.defaults.model.fallbacks`](/tr/concepts/model-failover) içinde CLI olmayan bir adaya devrederek başarısız olduğunda OpenClaw, sonraki denemeyi Claude Code'un `~/.claude/projects/` konumundaki yerel JSONL transcript'inden toplanan bir bağlam başlangıç bölümüyle tohumlar. Bu tohum olmadan yedek sağlayıcı soğuk başlardı, çünkü OpenClaw'ın kendi oturum transcript'i `claude-cli` çalıştırmaları için boştur.

- Başlangıç bölümü en son `/compact` özetini veya `compact_boundary` işaretçisini tercih eder, ardından karakter bütçesine kadar en son sınır sonrası dönüşleri ekler. Sınır öncesi dönüşler atılır, çünkü özet zaten onları temsil eder.
- Prompt bütçesini dürüst tutmak için araç blokları kompakt `(tool call: name)` ve `(tool result: …)` ipuçlarına birleştirilir. Taşarsa özet `(truncated)` olarak etiketlenir.
- Aynı sağlayıcıdaki `claude-cli` -> `claude-cli` yedekleri Claude'un kendi `--resume` mekanizmasına dayanır ve başlangıç bölümünü atlar.
- Tohum mevcut Claude oturum dosyası yolu doğrulamasını yeniden kullanır; bu yüzden rastgele yollar okunamaz.

## Görüntüler (aktarım)

CLI'niz görüntü yollarını kabul ediyorsa `imageArg` ayarlayın:

```json5
imageArg: "--image",
imageMode: "repeat"
```

OpenClaw base64 görüntüleri geçici dosyalara yazar. `imageArg` ayarlanmışsa bu yollar CLI argümanları olarak geçirilir. `imageArg` eksikse OpenClaw dosya yollarını prompt'a ekler (yol enjeksiyonu); bu, düz yollardan yerel dosyaları otomatik yükleyen CLI'lar için yeterlidir.

## Girdiler / çıktılar

- `output: "json"` (varsayılan) JSON ayrıştırmayı ve metin + oturum kimliği çıkarmayı dener.
- Gemini CLI JSON çıktısı için OpenClaw, `usage` eksik veya boş olduğunda yanıt metnini `response` alanından ve kullanımı `stats` alanından okur. Paketlenmiş Gemini CLI varsayılanı `stream-json` kullanır, ancak eski `--output-format json` geçersiz kılmaları yine JSON ayrıştırıcıyı kullanır.
- `output: "jsonl"` JSONL akışlarını ayrıştırır ve mevcut olduğunda son agent iletisini ve oturum tanımlayıcılarını çıkarır.
- `output: "text"` stdout'u son yanıt olarak ele alır.

Girdi modları:

- `input: "arg"` (varsayılan), istemi son CLI argümanı olarak geçirir.
- `input: "stdin"` istemi stdin üzerinden gönderir.
- İstem çok uzunsa ve `maxPromptArgChars` ayarlanmışsa stdin kullanılır.

## Varsayılanlar (Plugin sahipliğinde)

Paketlenmiş CLI arka uç varsayılanları, onları sahiplenen Plugin ile birlikte bulunur. Örneğin,
Anthropic `claude-cli` öğesinin, Google ise `google-gemini-cli` öğesinin sahibidir. OpenAI Codex
agent çalıştırmaları, Codex app-server harness'ını `openai/*` üzerinden kullanır; OpenClaw artık
paketlenmiş bir `codex-cli` arka ucu kaydetmez.

Paketlenmiş Anthropic Plugin, `claude-cli` için bir varsayılan kaydeder:

- `command: "claude"`
- `args: ["-p","--output-format","stream-json","--include-partial-messages","--verbose", ...]`
- `output: "jsonl"`
- `input: "stdin"`
- `modelArg: "--model"`
- `sessionMode: "always"`

Paketlenmiş Google Plugin ayrıca `google-gemini-cli` için bir varsayılan kaydeder:

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

- Varsayılan `stream-json` ayrıştırıcısı assistant `message` olaylarını, araç olaylarını,
  son `result` kullanımını ve ölümcül Gemini hata olaylarını okur.
- Gemini argümanlarını `--output-format json` olarak geçersiz kılarsanız OpenClaw bu
  arka ucu tekrar `output: "json"` olarak normalleştirir ve yanıt metnini JSON `response`
  alanından okur.
- `usage` yoksa veya boşsa kullanım `stats` alanına geri düşer.
- `stats.cached`, OpenClaw `cacheRead` içine normalleştirilir.
- `stats.input` eksikse OpenClaw giriş token'larını
  `stats.input_tokens - stats.cached` üzerinden türetir.

Yalnızca gerekirse geçersiz kılın (yaygın: mutlak `command` yolu).

## Plugin sahipliğindeki varsayılanlar

CLI arka uç varsayılanları artık Plugin yüzeyinin parçasıdır:

- Plugin'ler bunları `api.registerCliBackend(...)` ile kaydeder.
- Arka uç `id` değeri model referanslarında sağlayıcı ön eki olur.
- `agents.defaults.cliBackends.<id>` içindeki kullanıcı yapılandırması Plugin varsayılanını hâlâ geçersiz kılar.
- Arka uca özgü yapılandırma temizliği, isteğe bağlı
  `normalizeConfig` hook'u üzerinden Plugin sahipliğinde kalır.

Çok küçük istem/ileti uyumluluk shim'lerine ihtiyaç duyan Plugin'ler,
bir sağlayıcıyı veya CLI arka ucunu değiştirmeden çift yönlü metin dönüşümleri tanımlayabilir:

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
OpenClaw kendi kontrol işaretleyicilerini ve kanal teslimini işlemeden önce
akışla gelen assistant metnini ve ayrıştırılmış son metni yeniden yazar. Sağlayıcı destekli model çağrıları için
`output`, akış onarımından sonra ve araç yürütmeden önce yapılandırılmış tool-call argümanları içindeki
dize değerlerini de geri yükler. Ham sağlayıcı JSON parçaları değişmeden kalır;
tüketiciler yapılandırılmış kısmi, bitiş veya sonuç yükünü kullanmalıdır.

Sağlayıcıya özgü JSONL olayları yayan CLI'lar için ilgili arka uç yapılandırmasında
`jsonlDialect` ayarlayın. Desteklenen lehçeler Claude Code uyumlu akışlar için
`claude-stream-json` ve Gemini CLI `stream-json` olayları için `gemini-stream-json`
şeklindedir.

## Yerel Compaction sahipliği

Bazı CLI arka uçları **kendi** transkriptini sıkıştıran bir agent çalıştırır, bu yüzden OpenClaw
koruma özetleyicisini bunlara karşı çalıştırmamalıdır; bunu yapmak arka ucun kendi
Compaction işlemiyle çakışır ve turu sert biçimde başarısız kılabilir.

`claude-cli` için harness endpoint'i yoktur; Claude Code dahili olarak sıkıştırır; bu nedenle
`ownsNativeCompaction: true` tanımlar ve OpenClaw Compaction yolundan no-op döndürür.
Codex gibi yerel harness oturumları bunun yerine harness Compaction endpoint'lerine yönlendirilmeye
devam eder.

Arka uç Compaction'ın sahibi olduğu için, sırf OpenClaw korumasının bir
claude-cli oturumunda tetiklenmesini engellemek amacıyla
`contextTokens: 1_000_000` ayarlamaya yönelik eski geçici çözüm **artık gerekli değildir**; bunun yerini devre dışı bırakma seçeneği alır.

```typescript
api.registerCliBackend({ id: "my-cli", ownsNativeCompaction: true /* ... */ });
```

`ownsNativeCompaction` değerini yalnızca Compaction işlemini gerçekten sahiplenen bir arka uç için tanımlayın:
kendi transkriptini context penceresine yaklaşırken güvenilir biçimde sınırlamalı ve sürdürülebilir bir
oturumu kalıcı hale getirmelidir (örn. `--resume` / `--session-id`); aksi takdirde ertelenmiş bir oturum
bütçenin üzerinde kalabilir. Eşleşen `agentHarnessId` oturumları hâlâ harness endpoint'ine yönlendirilir.

## Paket MCP bindirmeleri

CLI arka uçları OpenClaw araç çağrılarını doğrudan almaz, ancak bir arka uç
`bundleMcp: true` ile üretilmiş bir MCP yapılandırma bindirmesine katılabilir.

Geçerli paketlenmiş davranış:

- `claude-cli`: üretilmiş katı MCP yapılandırma dosyası
- `google-gemini-cli`: üretilmiş Gemini sistem ayarları dosyası

Paket MCP etkinleştirildiğinde OpenClaw:

- Gateway araçlarını CLI işlemine açan bir loopback HTTP MCP sunucusu başlatır
- köprünün kimliğini oturuma özgü bir token ile doğrular (`OPENCLAW_MCP_TOKEN`)
- araç erişimini geçerli oturum, hesap ve kanal bağlamıyla sınırlar
- geçerli çalışma alanı için etkinleştirilmiş bundle-MCP sunucularını yükler
- bunları mevcut arka uç MCP yapılandırması/ayarları şekliyle birleştirir
- başlatma yapılandırmasını, sahiplenen extension'dan gelen arka uç sahipliğindeki entegrasyon modunu kullanarak yeniden yazar

Hiç MCP sunucusu etkin değilse, bir arka uç paket MCP'ye katıldığında OpenClaw yine de
arka plan çalıştırmalarının yalıtılmış kalması için katı bir yapılandırma enjekte eder.

Oturum kapsamlı paketlenmiş MCP çalışma zamanları, bir oturum içinde yeniden kullanım için önbelleğe alınır, ardından
`mcp.sessionIdleTtlMs` milisaniye boşta kalma süresinden sonra temizlenir (varsayılan 10
dakika; devre dışı bırakmak için `0` ayarlayın). Auth probe'ları,
slug üretimi ve active-memory recall gibi tek seferlik gömülü çalıştırmalar, stdio
alt süreçleri ve Streamable HTTP/SSE akışları çalıştırmadan daha uzun yaşamaması için çalışma sonunda temizlik ister.

## Geçmişi yeniden tohumlama sınırı

Yeni bir CLI oturumu önceki bir OpenClaw transkriptinden tohumlandığında (örneğin
bir `session_expired` yeniden denemesinden sonra), işlenen
`<conversation_history>` bloğu, yeniden tohumlama istemlerinin patlamasını önlemek için
sınırlandırılır. Varsayılan `12288` karakterdir (yaklaşık 3000 token).

Claude CLI arka uçları, çözümlenen Claude context katmanından türetilmiş daha büyük bir sınırı otomatik olarak kullanır.
Standart 200K token'lık Claude çalıştırmaları daha büyük bir transkript dilimini korur,
1M token'lık Claude çalıştırmaları ise daha da büyük bir dilim korur; diğer CLI
arka uçları ise muhafazakâr varsayılanı korur.

- Sınır yalnızca yeniden tohumlama isteminin önceki-geçmiş bloğunu yönetir. Canlı oturum
  çıktı sınırları `reliability.outputLimits` altında ayrı olarak ayarlanır
  (bkz. [Oturumlar](#sessions)).

## Sınırlamalar

- **Doğrudan OpenClaw araç çağrısı yok.** OpenClaw, araç çağrılarını
  CLI arka uç protokolüne enjekte etmez. Arka uçlar Gateway araçlarını yalnızca
  `bundleMcp: true` seçeneğine katıldıklarında görür.
- **Akış arka uca özgüdür.** Bazı arka uçlar JSONL akışı yapar; diğerleri
  çıkışa kadar tamponlar.
- **Yapılandırılmış çıktılar** CLI'ın JSON biçimine bağlıdır.

## Sorun giderme

- **CLI bulunamadı**: `command` değerini tam bir yol olarak ayarlayın.
- **Yanlış model adı**: `provider/model` → CLI modeli eşlemesi için `modelAliases` kullanın.
- **Oturum sürekliliği yok**: `sessionArg` ayarlandığından ve `sessionMode` değerinin
  `none` olmadığından emin olun.
- **Görseller yok sayılıyor**: `imageArg` ayarlayın (ve CLI'ın dosya yollarını desteklediğini doğrulayın).

## İlgili

- [Gateway runbook](/tr/gateway)
- [Yerel modeller](/tr/gateway/local-models)
