---
read_when:
    - Aracı çalışma zamanını, çalışma alanı önyüklemesini veya oturum davranışını değiştirme
summary: Ajan çalışma zamanı, çalışma alanı sözleşmesi ve oturum önyüklemesi
title: Ajan çalışma zamanı
x-i18n:
    generated_at: "2026-05-04T02:22:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 89bbbd05a9bf2054d3a1f24aeed005a05b61152a047b593addfb46817baae05a
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw, **tek bir gömülü ajan çalışma zamanı** çalıştırır: Gateway başına bir ajan süreci; kendi çalışma alanı, başlangıç dosyaları ve oturum deposu vardır. Bu sayfa, çalışma zamanının sözleşmesini kapsar: çalışma alanında nelerin bulunması gerektiği, hangi dosyaların enjekte edildiği ve oturumların buna karşı nasıl başlatıldığı.

## Çalışma alanı (gerekli)

OpenClaw, tek bir ajan çalışma alanı dizinini (`agents.defaults.workspace`) araçlar ve bağlam için ajanın **tek** çalışma dizini (`cwd`) olarak kullanır.

Önerilen: eksikse `~/.openclaw/openclaw.json` oluşturmak ve çalışma alanı dosyalarını başlatmak için `openclaw setup` kullanın.

Tam çalışma alanı düzeni + yedekleme kılavuzu: [Ajan çalışma alanı](/tr/concepts/agent-workspace)

`agents.defaults.sandbox` etkinse, ana olmayan oturumlar bunu `agents.defaults.sandbox.workspaceRoot` altındaki oturum başına çalışma alanlarıyla geçersiz kılabilir (bkz. [Gateway yapılandırması](/tr/gateway/configuration)).

## Başlangıç dosyaları (enjekte edilir)

`agents.defaults.workspace` içinde OpenClaw şu kullanıcı tarafından düzenlenebilir dosyaları bekler:

- `AGENTS.md` — çalışma talimatları + “bellek”
- `SOUL.md` — persona, sınırlar, ton
- `TOOLS.md` — kullanıcı tarafından bakımı yapılan araç notları (örn. `imsg`, `sag`, kurallar)
- `BOOTSTRAP.md` — tek seferlik ilk çalıştırma ritüeli (tamamlandıktan sonra silinir)
- `IDENTITY.md` — ajan adı/havası/emoji
- `USER.md` — kullanıcı profili + tercih edilen hitap

Yeni bir oturumun ilk turunda OpenClaw, bu dosyaların içeriklerini sistem isteminin Proje Bağlamı içine enjekte eder.

Boş dosyalar atlanır. Büyük dosyalar, istemlerin yalın kalması için bir işaretleyiciyle kısaltılır ve kesilir (tam içerik için dosyayı okuyun).

Bir dosya eksikse OpenClaw tek bir “eksik dosya” işaretleyici satırı enjekte eder (ve `openclaw setup` güvenli bir varsayılan şablon oluşturur).

`BOOTSTRAP.md` yalnızca **tamamen yeni bir çalışma alanı** için oluşturulur (başka başlangıç dosyası yoksa). Beklemedeyken OpenClaw bunu Proje Bağlamı içinde tutar ve kullanıcı mesajına kopyalamak yerine ilk ritüel için sistem istemine başlangıç rehberliği ekler. Ritüeli tamamladıktan sonra silerseniz, sonraki yeniden başlatmalarda tekrar oluşturulmamalıdır.

Başlangıç dosyası oluşturmayı tamamen devre dışı bırakmak için (önceden hazırlanmış çalışma alanları için), şunu ayarlayın:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Yerleşik araçlar

Temel araçlar (okuma/yürütme/düzenleme/yazma ve ilgili sistem araçları), araç politikasına tabi olarak her zaman kullanılabilir. `apply_patch` isteğe bağlıdır ve `tools.exec.applyPatch` tarafından kapılanır. `TOOLS.md` hangi araçların var olduğunu kontrol etmez; bunların nasıl kullanılmasını _istediğinize_ dair rehberliktir.

## Skills

OpenClaw, Skills öğelerini şu konumlardan yükler (en yüksek öncelik önce):

- Çalışma alanı: `<workspace>/skills`
- Proje ajan Skills öğeleri: `<workspace>/.agents/skills`
- Kişisel ajan Skills öğeleri: `~/.agents/skills`
- Yönetilen/yerel: `~/.openclaw/skills`
- Birlikte gelenler (kurulumla gönderilen)
- Ek Skills klasörleri: `skills.load.extraDirs`

Skills, yapılandırma/env tarafından kapılanabilir (bkz. [Gateway yapılandırması](/tr/gateway/configuration) içindeki `skills`).

## Çalışma zamanı sınırları

Gömülü ajan çalışma zamanı, Pi ajan çekirdeği (modeller, araçlar ve istem işlem hattı) üzerine kuruludur. Oturum yönetimi, keşif, araç bağlantıları ve kanal teslimi, bu çekirdeğin üzerindeki OpenClaw sahipliğindeki katmanlardır.

## Oturumlar

Oturum dökümleri JSONL olarak şurada saklanır:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Oturum kimliği kararlıdır ve OpenClaw tarafından seçilir.
Diğer araçlardan gelen eski oturum klasörleri okunmaz.

## Akış sırasında yönlendirme

Kuyruk modu `steer` olduğunda, gelen mesajlar mevcut çalıştırmaya enjekte edilir. Kuyruğa alınmış yönlendirme, **mevcut asistan turu araç çağrılarını yürütmeyi bitirdikten sonra**, bir sonraki LLM çağrısından önce teslim edilir. Pi, `steer` için bekleyen tüm yönlendirme mesajlarını birlikte boşaltır; eski `queue` ise model sınırı başına bir mesaj boşaltır. Yönlendirme artık mevcut asistan mesajındaki kalan araç çağrılarını atlamaz.

Kuyruk modu `followup` veya `collect` olduğunda, gelen mesajlar mevcut tur bitene kadar tutulur, ardından kuyruğa alınan yüklerle yeni bir ajan turu başlar. Mod ve sınır davranışı için [Kuyruk](/tr/concepts/queue) ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering) sayfalarına bakın.

Blok akışı, tamamlanan asistan bloklarını biter bitmez gönderir; **varsayılan olarak kapalıdır** (`agents.defaults.blockStreamingDefault: "off"`).
Sınırı `agents.defaults.blockStreamingBreak` ile ayarlayın (`text_end` ve `message_end`; varsayılan text_end).
Yumuşak blok parçalamayı `agents.defaults.blockStreamingChunk` ile denetleyin (varsayılan 800–1200 karakter; paragraf sonlarını, sonra yeni satırları tercih eder; cümleler en son).
Tek satırlık gereksiz yoğunluğu azaltmak için akıtılan parçaları `agents.defaults.blockStreamingCoalesce` ile birleştirin (göndermeden önce boşta kalmaya dayalı birleştirme). Telegram dışı kanalların blok yanıtlarını etkinleştirmek için açık `*.blockStreaming: true` gerekir.
Ayrıntılı araç özetleri araç başlangıcında yayımlanır (debounce yok); Control UI, kullanılabildiğinde araç çıktısını ajan olayları üzerinden akıtır.
Daha fazla ayrıntı: [Akış + parçalama](/tr/concepts/streaming).

## Model referansları

Yapılandırmadaki model referansları (örneğin `agents.defaults.model` ve `agents.defaults.models`), **ilk** `/` karakterine göre bölünerek ayrıştırılır.

- Modelleri yapılandırırken `provider/model` kullanın.
- Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, ardından tam bu model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesini dener ve ancak bundan sonra yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı artık yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eskimiş kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele geri döner.

## Yapılandırma (asgari)

En azından şunları ayarlayın:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (kesinlikle önerilir)

---

_Sıradaki: [Grup Sohbetleri](/tr/channels/group-messages)_ 🦞

## İlgili

- [Ajan çalışma alanı](/tr/concepts/agent-workspace)
- [Çok ajanlı yönlendirme](/tr/concepts/multi-agent)
- [Oturum yönetimi](/tr/concepts/session)
