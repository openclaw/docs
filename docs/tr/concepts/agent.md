---
read_when:
    - Aracı çalışma zamanını, çalışma alanı bootstrap'ını veya oturum davranışını değiştirme
summary: Aracı çalışma zamanı, çalışma alanı sözleşmesi ve oturum bootstrap'ı
title: Aracı çalışma zamanı
x-i18n:
    generated_at: "2026-04-24T09:04:25Z"
    model: gpt-5.4
    provider: openai
    source_hash: 07fe0ca3c6bc306f95ac024b97b4e6e188c2d30786b936b8bd66a5f3ec012d4e
    source_path: concepts/agent.md
    workflow: 15
---

OpenClaw, **tek bir gömülü aracı çalışma zamanı** çalıştırır — Gateway başına
bir aracı süreci; kendi çalışma alanı, bootstrap dosyaları ve oturum deposu ile. Bu sayfa,
bu çalışma zamanı sözleşmesini kapsar: çalışma alanının neleri içermesi gerektiği,
hangi dosyaların enjekte edildiği ve oturumların buna karşı nasıl bootstrap yapıldığı.

## Çalışma alanı (zorunlu)

OpenClaw, araçlar ve bağlam için aracının **tek** çalışma dizini (`cwd`) olarak tek bir aracı çalışma alanı dizini (`agents.defaults.workspace`) kullanır.

Önerilen: Eksikse `~/.openclaw/openclaw.json` oluşturmak ve çalışma alanı dosyalarını başlatmak için `openclaw setup` kullanın.

Tam çalışma alanı düzeni + yedekleme kılavuzu: [Aracı çalışma alanı](/tr/concepts/agent-workspace)

`agents.defaults.sandbox` etkinse, ana olmayan oturumlar bunu
`agents.defaults.sandbox.workspaceRoot` altındaki oturum başına çalışma alanlarıyla geçersiz kılabilir (bkz.
[Gateway yapılandırması](/tr/gateway/configuration)).

## Bootstrap dosyaları (enjekte edilen)

`agents.defaults.workspace` içinde OpenClaw şu kullanıcı tarafından düzenlenebilir dosyaları bekler:

- `AGENTS.md` — çalışma yönergeleri + “bellek”
- `SOUL.md` — persona, sınırlar, ton
- `TOOLS.md` — kullanıcı tarafından tutulan araç notları (örn. `imsg`, `sag`, kurallar)
- `BOOTSTRAP.md` — tek seferlik ilk çalıştırma ritüeli (tamamlandıktan sonra silinir)
- `IDENTITY.md` — aracı adı/havası/emoji
- `USER.md` — kullanıcı profili + tercih edilen hitap biçimi

Yeni bir oturumun ilk dönüşünde OpenClaw, bu dosyaların içeriklerini doğrudan aracı bağlamına enjekte eder.

Boş dosyalar atlanır. Büyük dosyalar, istemlerin hafif kalması için bir işaretleyiciyle kırpılır ve kesilir (tam içerik için dosyayı okuyun).

Bir dosya eksikse OpenClaw tek bir “eksik dosya” işaretleyici satırı enjekte eder (`openclaw setup` da güvenli bir varsayılan şablon oluşturur).

`BOOTSTRAP.md` yalnızca **tamamen yeni bir çalışma alanı** için oluşturulur (başka bootstrap dosyaları yoksa). Ritüeli tamamladıktan sonra silerseniz sonraki yeniden başlatmalarda yeniden oluşturulmamalıdır.

Bootstrap dosyası oluşturmayı tamamen devre dışı bırakmak için (önceden tohumlanmış çalışma alanları için) şunu ayarlayın:

```json5
{ agent: { skipBootstrap: true } }
```

## Yerleşik araçlar

Çekirdek araçlar (`read`/`exec`/`edit`/`write` ve ilgili sistem araçları) araç ilkesine bağlı olarak her zaman kullanılabilir durumdadır.
`apply_patch` isteğe bağlıdır ve
`tools.exec.applyPatch` tarafından korunur. `TOOLS.md`, hangi araçların var olduğunu denetlemez; bu dosya,
onları nasıl kullanmak _istediğiniz_ konusunda yönlendirme sağlar.

## Skills

OpenClaw, Skills'i şu konumlardan yükler (en yüksek öncelik önce gelir):

- Çalışma alanı: `<workspace>/skills`
- Proje aracı Skills'i: `<workspace>/.agents/skills`
- Kişisel aracı Skills'i: `~/.agents/skills`
- Yönetilen/yerel: `~/.openclaw/skills`
- Paketle gelen (kurulumla birlikte gelir)
- Ek skill klasörleri: `skills.load.extraDirs`

Skills, yapılandırma/env ile sınırlandırılabilir (bkz. [Gateway yapılandırması](/tr/gateway/configuration) içindeki `skills`).

## Çalışma zamanı sınırları

Gömülü aracı çalışma zamanı; Pi aracı çekirdeği (modeller, araçlar ve
istem işlem hattı) üzerine kuruludur. Oturum yönetimi, keşif, araç bağlantısı ve kanal
teslimi; bu çekirdeğin üzerindeki OpenClaw sahipli katmanlardır.

## Oturumlar

Oturum transcript'leri JSONL olarak şu konumda saklanır:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Oturum kimliği kararlıdır ve OpenClaw tarafından seçilir.
Diğer araçlardan kalan eski oturum klasörleri okunmaz.

## Akış sırasında yönlendirme

Kuyruk modu `steer` olduğunda gelen mesajlar geçerli çalıştırmaya enjekte edilir.
Sıraya alınmış yönlendirme, **geçerli asistan dönüşü araç çağrılarını yürütmeyi bitirdikten sonra**,
bir sonraki LLM çağrısından önce teslim edilir. Yönlendirme artık
geçerli asistan mesajından kalan araç çağrılarını atlamaz; bunun yerine sıraya alınmış
mesajı bir sonraki model sınırında enjekte eder.

Kuyruk modu `followup` veya `collect` olduğunda gelen mesajlar, geçerli
dönüş bitene kadar tutulur; ardından sıraya alınan yüklerle yeni bir aracı dönüşü başlatılır. Mod + debounce/cap davranışı için [Kuyruk](/tr/concepts/queue) sayfasına bakın.

Blok akışı, tamamlanan asistan bloklarını biter bitmez gönderir; varsayılan olarak
**kapalıdır** (`agents.defaults.blockStreamingDefault: "off"`).
Sınırı `agents.defaults.blockStreamingBreak` ile ayarlayın (`text_end` veya `message_end`; varsayılan `text_end`).
Yumuşak blok parçalamayı `agents.defaults.blockStreamingChunk` ile denetleyin (varsayılan
800–1200 karakter; önce paragraf sonlarını, sonra yeni satırları, en son cümleleri tercih eder).
Tek satırlık spam'i azaltmak için akıtılan parçaları `agents.defaults.blockStreamingCoalesce` ile
birleştirin (göndermeden önce boşta kalma tabanlı birleştirme). Telegram dışı kanallar,
blok yanıtlarını etkinleştirmek için açıkça `*.blockStreaming: true` gerektirir.
Ayrıntılı araç özetleri araç başlangıcında yayılır (debounce yoktur); Control UI,
mümkün olduğunda aracı olayları üzerinden araç çıktısını akıtır.
Daha fazla ayrıntı: [Akış + parçalama](/tr/concepts/streaming).

## Model ref'leri

Yapılandırmadaki model ref'leri (örneğin `agents.defaults.model` ve `agents.defaults.models`) **ilk** `/` karakterine göre bölünerek ayrıştırılır.

- Modelleri yapılandırırken `provider/model` kullanın.
- Model kimliği kendi içinde `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız OpenClaw önce bir takma adı, sonra o tam model kimliği için benzersiz
  bir yapılandırılmış sağlayıcı eşleşmesini dener ve ancak ondan sonra
  yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı artık
  yapılandırılmış varsayılan modeli sunmuyorsa OpenClaw, eski ve kaldırılmış bir sağlayıcı varsayılanını göstermek yerine
  ilk yapılandırılmış sağlayıcı/modele geri döner.

## Yapılandırma (minimal)

En azından şunları ayarlayın:

- `agents.defaults.workspace`
- `channels.whatsapp.allowFrom` (kuvvetle önerilir)

---

_Sonraki: [Grup Sohbetleri](/tr/channels/group-messages)_ 🦞

## İlgili

- [Aracı çalışma alanı](/tr/concepts/agent-workspace)
- [Çok aracılı yönlendirme](/tr/concepts/multi-agent)
- [Oturum yönetimi](/tr/concepts/session)
