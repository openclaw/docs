---
read_when:
    - Aracı çalışma zamanı, çalışma alanı önyüklemesi veya oturum davranışı değiştiriliyor
summary: Ajan çalışma zamanı, çalışma alanı sözleşmesi ve oturum önyüklemesi
title: Ajan çalışma zamanı
x-i18n:
    generated_at: "2026-06-28T00:26:52Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2fb4d3f0bb6e8aa2a23d00f5def5eb0ffa152bc75f82a12c40ac7ed00776011c
    source_path: concepts/agent.md
    workflow: 16
---

OpenClaw, **tek bir gömülü ajan çalışma zamanı** çalıştırır - her Gateway için kendi çalışma alanı, bootstrap dosyaları ve oturum deposu olan bir ajan süreci. Bu sayfa bu çalışma zamanı sözleşmesini kapsar: çalışma alanının neleri içermesi gerektiği, hangi dosyaların enjekte edildiği ve oturumların buna göre nasıl başlatıldığı.

## Çalışma alanı (gerekli)

OpenClaw, araçlar ve bağlam için ajanın **tek** çalışma dizini (`cwd`) olarak tek bir ajan çalışma alanı dizini (`agents.defaults.workspace`) kullanır.

Önerilen: Eksikse `~/.openclaw/openclaw.json` oluşturmak ve çalışma alanı dosyalarını başlatmak için `openclaw setup` kullanın.

Tam çalışma alanı düzeni + yedekleme kılavuzu: [Ajan çalışma alanı](/tr/concepts/agent-workspace)

`agents.defaults.sandbox` etkinse, ana olmayan oturumlar bunu `agents.defaults.sandbox.workspaceRoot` altındaki oturum başına çalışma alanlarıyla geçersiz kılabilir (bkz.
[Gateway yapılandırması](/tr/gateway/configuration)).

## Bootstrap dosyaları (enjekte edilir)

`agents.defaults.workspace` içinde OpenClaw şu kullanıcı tarafından düzenlenebilir dosyaları bekler:

- `AGENTS.md` - çalışma talimatları + "bellek"
- `SOUL.md` - persona, sınırlar, ton
- `TOOLS.md` - kullanıcı tarafından tutulan araç notları (örn. `imsg`, `sag`, kurallar)
- `BOOTSTRAP.md` - tek seferlik ilk çalıştırma ritüeli (tamamlandıktan sonra silinir)
- `IDENTITY.md` - ajan adı/havası/emoji
- `USER.md` - kullanıcı profili + tercih edilen hitap

Yeni bir oturumun ilk sırasında OpenClaw, bu dosyaların içeriklerini sistem isteminin Proje Bağlamı bölümüne enjekte eder.

Boş dosyalar atlanır. Büyük dosyalar, istemlerin sade kalması için bir işaretleyiciyle kısaltılır ve budanır (tam içerik için dosyayı okuyun).

Bir dosya eksikse OpenClaw tek bir "eksik dosya" işaretleyici satırı enjekte eder (ve `openclaw setup` güvenli bir varsayılan şablon oluşturur).

`BOOTSTRAP.md` yalnızca **tamamen yeni bir çalışma alanı** için oluşturulur (başka bootstrap dosyası yoksa). Beklemedeyken OpenClaw bunu Proje Bağlamı içinde tutar ve kullanıcı mesajına kopyalamak yerine ilk ritüel için sistem istemine bootstrap rehberliği ekler. Ritüeli tamamladıktan sonra silerseniz, sonraki yeniden başlatmalarda yeniden oluşturulmamalıdır.

Bir çalışma alanı gözlemlendikten sonra OpenClaw, çalışma alanı yolu için state-dir onay işaretleyicisini de tutar. Yakın zamanda onaylanmış bir çalışma alanı kaybolursa veya silinirse, başlangıç `BOOTSTRAP.md` dosyasını sessizce yeniden tohumlamayı reddeder; çalışma alanını geri yükleyin veya çalışma alanı ile işaretleyicinin birlikte temizlenmesi için tam bir onboard sıfırlaması kullanın.

Bootstrap dosyası oluşturmayı tamamen devre dışı bırakmak için (önceden tohumlanmış çalışma alanlarında) şunu ayarlayın:

```json5
{ agents: { defaults: { skipBootstrap: true } } }
```

## Yerleşik araçlar

Çekirdek araçlar (read/exec/edit/write ve ilgili sistem araçları), araç politikasına tabi olarak her zaman kullanılabilir. `apply_patch` isteğe bağlıdır ve `tools.exec.applyPatch` ile kapılanır. `TOOLS.md`, hangi araçların var olduğunu kontrol etmez; _sizin_ bunların nasıl kullanılmasını istediğinize dair rehberliktir.

## Skills

OpenClaw, Skills öğelerini şu konumlardan yükler (en yüksek öncelik önce):

- Çalışma alanı: `<workspace>/skills`
- Proje ajan Skills: `<workspace>/.agents/skills`
- Kişisel ajan Skills: `~/.agents/skills`
- Yönetilen/yerel: `~/.openclaw/skills`
- Paketli (kurulumla birlikte gönderilir)
- Ek skill klasörleri: `skills.load.extraDirs`

Skill kökleri, `<workspace>/skills/personal/foo/SKILL.md` gibi gruplanmış klasörler içerebilir; skill yine de düz frontmatter adıyla, örneğin `foo`, sunulur.

Skills, yapılandırma/env ile kapılanabilir (bkz. [Gateway yapılandırması](/tr/gateway/configuration) içindeki `skills`).

## Çalışma zamanı sınırları

Gömülü ajan çalışma zamanı OpenClaw’a aittir: model keşfi, araç bağlama, istem derleme, oturum yönetimi ve kanal teslimi tek bir tümleşik çalışma zamanı yüzeyini paylaşır.

## Oturumlar

Oturum dökümleri JSONL olarak şurada saklanır:

- `~/.openclaw/agents/<agentId>/sessions/<SessionId>.jsonl`

Oturum kimliği kararlıdır ve OpenClaw tarafından seçilir.
Diğer araçlardan gelen eski oturum klasörleri okunmaz.

## Akış sırasında yönlendirme

Çalışma ortasında gelen giriş istemleri varsayılan olarak mevcut çalışmaya yönlendirilir.
Yönlendirme, **mevcut asistan sırası araç çağrılarını yürütmeyi bitirdikten sonra**, sonraki LLM çağrısından önce teslim edilir ve artık mevcut asistan mesajındaki kalan araç çağrılarını atlamaz.

`/queue steer` varsayılan etkin çalışma davranışıdır. `/queue followup` ve
`/queue collect`, mesajların yönlendirilmek yerine sonraki bir sırayı beklemesini sağlar.
`/queue interrupt` bunun yerine etkin çalışmayı iptal eder. Kuyruk ve sınır davranışı için [Kuyruk](/tr/concepts/queue)
ve [Yönlendirme kuyruğu](/tr/concepts/queue-steering) bölümlerine bakın.

Blok akışı, tamamlanan asistan bloklarını biter bitmez gönderir; **varsayılan olarak kapalıdır** (`agents.defaults.blockStreamingDefault: "off"`).
Sınırı `agents.defaults.blockStreamingBreak` ile ayarlayın (`text_end` ve `message_end`; varsayılan text_end).
Yumuşak blok parçalamayı `agents.defaults.blockStreamingChunk` ile kontrol edin (varsayılan
800-1200 karakter; önce paragraf sonlarını, sonra yeni satırları tercih eder; cümleler en son).
Tek satırlık taşmayı azaltmak için akış parçalarını `agents.defaults.blockStreamingCoalesce` ile birleştirin (göndermeden önce boşta kalmaya dayalı birleştirme). Telegram dışı kanallarda blok yanıtlarını etkinleştirmek için açıkça `*.blockStreaming: true` gerekir.
Ayrıntılı araç özetleri araç başlangıcında yayımlanır (debounce yok); Control UI, mevcut olduğunda araç çıktısını ajan olayları aracılığıyla akıtır.
Daha fazla ayrıntı: [Akış + parçalama](/tr/concepts/streaming).

## Model refs

Yapılandırmadaki model refs (örneğin `agents.defaults.model` ve `agents.defaults.models`) **ilk** `/` karakterinden bölünerek ayrıştırılır.

- Modelleri yapılandırırken `provider/model` kullanın.
- Model kimliğinin kendisi `/` içeriyorsa (OpenRouter tarzı), sağlayıcı önekini ekleyin (örnek: `openrouter/moonshotai/kimi-k2`).
- Sağlayıcıyı atlarsanız OpenClaw önce bir diğer ad dener, ardından tam model kimliği için benzersiz bir yapılandırılmış sağlayıcı eşleşmesi arar ve ancak bundan sonra yapılandırılmış varsayılan sağlayıcıya geri döner. Bu sağlayıcı yapılandırılmış varsayılan modeli artık sunmuyorsa OpenClaw, eski bir kaldırılmış sağlayıcı varsayılanını göstermek yerine ilk yapılandırılmış sağlayıcı/modele geri döner.

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
