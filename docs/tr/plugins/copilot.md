---
read_when:
    - Bir agent için GitHub Copilot SDK altyapısını kullanmak istiyorsunuz
    - '`copilot` çalışma zamanı için yapılandırma örneklerine ihtiyacınız var'
    - Bir ajanı abonelik tabanlı Copilot'a (github / openclaw / copilot) bağlıyorsunuz ve bunun Copilot CLI üzerinden çalışmasını istiyorsunuz.
summary: OpenClaw yerleşik ajan turlarını harici GitHub Copilot SDK düzeneği üzerinden çalıştırın
title: Copilot SDK test düzeneği
x-i18n:
    generated_at: "2026-07-16T17:26:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: fb4a0a3bf1123c1c3cbbed2630476afb5df73bc61d47e8a3987a5d0d7f01f83a
    source_path: plugins/copilot.md
    workflow: 16
---

Harici `@openclaw/copilot` plugin'i, yerleşik abonelik Copilot
ajan turlarını OpenClaw'ın yerleşik altyapısı yerine GitHub Copilot CLI
(`@github/copilot-sdk`) üzerinden çalıştırır. Copilot CLI oturumu düşük seviyeli
ajan döngüsünü yönetir: yerel araç yürütme, yerel Compaction (`infiniteSessions`) ve
`copilotHome` altındaki CLI tarafından yönetilen iş parçacığı durumu. OpenClaw;
sohbet kanallarını, oturum dosyalarını, model seçimini, dinamik araçları (köprülenmiş),
onayları, medya teslimini, görünür transkript yansısını, `/btw` yan sorularını (bkz.
[Yan sorular (`/btw`)](#side-questions-btw)) ve `openclaw doctor` yönetmeye devam eder.

Daha geniş model/sağlayıcı/çalışma zamanı ayrımı için
[Ajan çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın.

## Gereksinimler

- `@openclaw/copilot` plugin'i yüklenmiş OpenClaw.
- Yapılandırmanız `plugins.allow` kullanıyorsa `copilot` değerini (plugin'in
  bildirdiği manifest kimliği) ekleyin. npm paket adı olan
  `@openclaw/copilot` için bir izin listesi girdisi eşleşmez ve
  `agentRuntime.id: "copilot"` ayarlanmış olsa bile plugin engellenmiş olarak kalır.
- Copilot CLI'ı çalıştırabilen bir GitHub Copilot aboneliği veya
  başsız ya da Cron çalıştırmaları için bir `gitHubToken` ortam değişkeni /
  kimlik doğrulama profili girdisi.
- Yazılabilir bir `copilotHome` dizini. OpenClaw bir ajan dizini
  sağladığında varsayılan değer `<agentDir>/copilot`, aksi takdirde
  `~/.openclaw/agents/<agentId>/copilot` olur.

`openclaw doctor`, oturum durumu sahipliği ve gelecekteki yapılandırma
geçişleri için plugin'in [doctor sözleşmesini](#doctor) çalıştırır. Copilot CLI
ortamını yoklamaz.

## Kurulum

Copilot çalışma zamanı harici bir plugin olarak sunulur; böylece temel `openclaw`
paketi `@github/copilot-sdk` veya platforma özgü
`@github/copilot-<platform>-<arch>` CLI ikili dosyasını (birlikte yaklaşık 260 MB) içermez.
Yalnızca bu çalışma zamanını kullanmayı seçen ajanlar için yükleyin:

```bash
openclaw plugins install @openclaw/copilot
```

Kurulum sihirbazı, ilk kez bir `github-copilot/*` modeli seçtiğinizde **ve**
yapılandırmanız bu modeli (veya sağlayıcısını) `agentRuntime: { id: "copilot" }` aracılığıyla
Copilot çalışma zamanına yönlendirdiğinde plugin'i otomatik olarak yükler; bkz.
[Hızlı başlangıç](#quickstart). Bu açık tercih olmadan OpenClaw, yerleşik
GitHub Copilot sağlayıcısını kullanır ve bu plugin'i hiçbir zaman yüklemez.

Çalışma zamanı SDK'yı şu sırayla çözümler:

1. Yüklenmiş `@openclaw/copilot` paketindeki `import("@github/copilot-sdk")`.
2. Yedek dizin `~/.openclaw/npm-runtime/copilot/` (eski isteğe bağlı
   yükleme hedefi).

Eksik bir SDK, `COPILOT_SDK_MISSING` kodlu tek bir hata ve yukarıdaki yeniden
yükleme komutuyla bildirilir.

## Hızlı başlangıç

Bir modeli (veya bir sağlayıcıyı) altyapıya sabitleyin:

```json5
{
  agents: {
    defaults: {
      model: "github-copilot/auto",
      models: {
        "github-copilot/auto": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
}
```

Yalnızca tek bir modeli altyapı üzerinden yönlendirmek için `agentRuntime.id`
değerini tek bir model girdisinde, o sağlayıcı altındaki her modeli yönlendirmek
içinse bir sağlayıcıda ayarlayın.

`github-copilot/auto`, taşınabilir başlangıç noktasıdır. Adlandırılmış Copilot
modelleri hesap ve kuruluş politikalarına bağlıdır; sabitlemeden önce kimliği
doğrulanmış Copilot CLI'ınızın gerçekten bir modeli sunduğunu doğrulayın.

## Desteklenen sağlayıcılar

Altyapı, `extensions/github-copilot` tarafından yönetilen standart
`github-copilot` sağlayıcısının yanı sıra modelin boş olmayan bir
`baseUrl` değeri ve aşağıdaki `api` biçimlerinden
biri olduğunda özel `models.providers` girdilerini destekler:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (OpenAI uyumlu tamamlamalar)
- `openai-completions`
- `openai-responses`

Yerel sağlayıcı kimlikleri (`openai`, `anthropic`, `google`, `ollama`) kendi
yerel çalışma zamanları tarafından yönetilmeye devam eder. Bunun yerine bir uç
noktayı Copilot BYOK üzerinden yönlendirmek için farklı bir özel sağlayıcı
kimliği kullanın.

Copilot BYOK uç noktaları herkese açık HTTPS URL'leri olmalıdır. Altyapı,
Copilot SDK'ya her deneme için bir geri döngü proxy'si verir ve ardından
sağlayıcı trafiğini OpenClaw'ın korumalı fetch yolu üzerinden iletir; böylece
DNS sabitleme ve SSRF politikası OpenClaw tarafından yönetilmeye devam eder.
Yerel Ollama, LM Studio veya LAN model sunucuları için yerel OpenClaw çalışma
zamanını kullanın.

## BYOK

Copilot BYOK, SDK'nın oturum düzeyindeki özel sağlayıcı sözleşmesini kullanır.
OpenClaw; çözümlenmiş model uç noktasını, API anahtarını, bearer token modunu,
üstbilgileri, model kimliğini ve bağlam/çıktı sınırlarını aktarır; sağlayıcı
taşıma mantığı temelde değil SDK'da kalır.

```json5
{
  agents: {
    defaults: {
      model: "custom-proxy/llama-3.1-8b",
      models: {
        "custom-proxy/llama-3.1-8b": {
          agentRuntime: { id: "copilot" },
        },
      },
    },
  },
  models: {
    mode: "merge",
    providers: {
      "custom-proxy": {
        baseUrl: "https://api.example.com/v1",
        apiKey: "${CUSTOM_PROXY_API_KEY}",
        api: "openai-responses",
        authHeader: true,
        models: [{ id: "llama-3.1-8b", name: "Llama 3.1 8B" }],
      },
    },
  },
}
```

BYOK oturumları, abonelik oturumlarından ve diğer BYOK uç noktaları veya
kimlik bilgilerinden ayrı anahtarlanır. Anahtarı, üstbilgileri, modeli veya uç
noktayı döndürmek, uyumsuz durumu sürdürmek yerine yeni bir Copilot SDK
oturumu başlatır.

## Kimlik doğrulama

`runCopilotAttempt` sırasında ajan başına uygulanan öncelik sırası:

1. **Deneme girdisindeki açık `useLoggedInUser: true`** — ajanın
   `copilotHome` dizini altında Copilot CLI'da oturum açmış kullanıcıyı kullanır.
2. **Deneme girdisindeki açık `gitHubToken`** (`profileId` +
   `profileVersion` gerektirir). Kimlik doğrulama profili çözümlemesini
   atlaması gereken doğrudan CLI çağrıları ve testler içindir.
3. **Sözleşmeyle çözümlenen `resolvedApiKey` + `authProfileId`** — üretimdeki
   ana yol. Temel sistem, altyapıyı çağırmadan önce ajanın yapılandırılmış
   `github-copilot` kimlik doğrulama profilini (`src/infra/provider-usage.auth.ts:resolveProviderAuths`)
   çözümler; böylece bir `github-copilot:<profile>` kimlik doğrulama profili, ortam
   değişkenleri olmadan başsız, Cron veya çok profilli kurulumlarda uçtan uca çalışır.
4. **Ortam değişkeni yedeği**, şu sırayla kontrol edilir (ilk boş olmayan
   değer kazanır, boş dizeler yok sayılır; `extensions/github-copilot/auth.ts` içindeki yayımlanmış
   `github-copilot` sağlayıcı önceliğini yansıtır):
   1. `OPENCLAW_GITHUB_TOKEN` — altyapıya özgü geçersiz kılma; sistem genelindeki
      `gh` / Copilot CLI yapılandırmasını bozmadan OpenClaw altyapısı
      için bir token sabitlemenizi sağlar.
   2. `COPILOT_GITHUB_TOKEN` — standart Copilot SDK / CLI ortam değişkeni.
   3. `GH_TOKEN` — standart `gh` CLI ortam değişkeni.
   4. `GITHUB_TOKEN` — genel GitHub token yedeği.

   Sentezlenen havuz profili kimliği `env:<NAME>` değeridir; profil sürümü,
   token'ın geri döndürülemez bir sha256 parmak izidir. Bu nedenle ortam değerinin
   döndürülmesi istemci havuzunu temiz biçimde geçersiz kılar.

5. Token sinyali mevcut olmadığında **varsayılan `useLoggedInUser`**.

Her ajan kendi `copilotHome` dizinine sahip olur; böylece Copilot CLI
token'ları, oturumları ve yapılandırması aynı makinedeki ajanlar arasında
hiçbir zaman sızmaz. Varsayılan:
`<agentDir>/copilot` (SDK durumunu OpenClaw'ın `models.json` /
`auth-profiles.json` diziniyle aynı dizinin dışında tutar) veya bir ajan dizini
sağlanmadığında `~/.openclaw/agents/<agentId>/copilot`.
Özel bir konum için (örneğin geçiş amacıyla paylaşılan bir bağlama noktası)
deneme girdisindeki `copilotHome: <path>` ile geçersiz kılın.

Canlı altyapı testleri doğrudan token için `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` kullanır.
Paylaşılan canlı test kurulumu, gerçek kimlik doğrulama profillerini yalıtılmış
test ana dizinine hazırladıktan sonra `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` ve
`GITHUB_TOKEN` değerlerini temizler. Böylece özel değişken üzerinden
aktarılan bir `gh auth token` değeri, ilgisiz test paketlerine sızmadan
yanlış atlamaları önler.

## Yapılandırma yüzeyi

Altyapı, deneme başına girdiden (`runCopilotAttempt({...})`) ve
`extensions/copilot/src/` içindeki küçük bir ortam varsayılanları kümesinden
yapılandırmayı okur:

| Alan                     | Amaç                                                                                                                                                                                                                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `copilotHome`       | Ajan başına CLI durum dizini (varsayılanlar yukarıdadır).                                                                                                                                                                                                                                       |
| `model`       | Dize veya `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Ajanın normal model seçimini kullanmak için atlayın; altyapı, çözümlenen sağlayıcının desteklendiğini doğrular.                                                                                                                                                     |
| `reasoningEffort`       | `"low" \| "medium" \| "high" \| "xhigh"`. `auto-reply/thinking.ts` içindeki OpenClaw `ThinkLevel` / `ReasoningLevel` çözümlemesinden eşlenir.                                                                                                                                                                       |
| `infiniteSessionConfig`       | `harness.compact` tarafından yönlendirilen SDK `infiniteSessions` bloğu için isteğe bağlı geçersiz kılma. Olduğu gibi bırakmak güvenlidir.                                                                                                                                                       |
| `hooksConfig`       | Araç/MCP, kullanıcı istemi, oturum ve hata geri çağrıları için isteğe bağlı yerel Copilot SDK `SessionHooks` yapılandırması. OpenClaw'ın taşınabilir yaşam döngüsü kancalarından ayrıdır.                                                                                                      |
| `permissionPolicy`       | Yerleşik SDK araç türleri (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`) için SDK'nın `onPermissionRequest` işleyicisinin isteğe bağlı geçersiz kılınması. Güvenlik ağı olarak varsayılanı `rejectAllPolicy` değeridir; neden gerçekte hiçbir zaman tetiklenmediği için [İzinler ve ask_user](#permissions-and-ask_user) bölümüne bakın. |
| `enableSessionTelemetry`       | İsteğe bağlı SDK oturum telemetrisi bayrağı.                                                                                                                                                                                                                                                    |

OpenClaw plugin kancaları, Copilot'a özgü deneme yapılandırması gerektirmez.
Altyapı; `before_prompt_build` (ve eski `before_agent_start` uyumluluk kancası),
`llm_input`, `llm_output` ve `agent_end` işlemlerini
standart altyapı yardımcıları üzerinden çalıştırır. Başarılı SDK Compaction
işlemleri ayrıca `before_compaction` ve `after_compaction` işlemlerini çalıştırır.
Köprülenmiş OpenClaw araçları `before_tool_call` işlemini çalıştırır ve
`after_tool_call` bildirir; `hooksConfig`, taşınabilir eşdeğeri olmayan
yalnızca yerel SDK geri çağrıları için kalır.

OpenClaw'daki başka hiçbir bileşenin bu alanları bilmesi gerekmez. Diğer
plugin'ler, kanallar ve temel kod yalnızca standart `AgentHarnessAttemptParams` /
`AgentHarnessAttemptResult` biçimini görür.

## Compaction

`harness.compact` çalıştığında Copilot SDK altyapısı:

1. Bekleyen çalışmayı sürdürmeden izlenen SDK oturumunu devam ettirir.
2. SDK'nın oturum kapsamlı geçmiş Compaction RPC'sini çağırır.
3. Çalışma alanı altında uyumluluk işaretleyici dosyaları yazmadan
   SDK Compaction sonucunu döndürür.

OpenClaw tarafındaki transkript yansısı (aşağıda) Compaction sonrası iletileri
almaya devam eder; böylece kullanıcıya yönelik sohbet geçmişi tutarlı kalır.

## Transkript yansıtma

`runCopilotAttempt`, her turun yansıtılabilir mesajlarını
`extensions/copilot/src/dual-write-transcripts.ts` aracılığıyla OpenClaw denetim transkriptine
çift yazar. Yansıtma oturum başına kapsamlandırılır
(`copilot:${sessionId}`) ve mesaj başına anahtarlanır
(`${role}:${sha256_16(role,content)}`); böylece yeniden yayımlanan önceki tur girdileri
çoğaltılmak yerine diskteki mevcut anahtarlarla çakışır.

Bir transkript yazma hatasının denemeyi hiçbir zaman başarısız kılmaması için
yansıtmayı iki hata sınırlama katmanı sarar: dahili bir azami çaba sarmalayıcısı
ve deneme düzeyinde derinlemesine savunma amaçlı bir `.catch(...)`.
Hatalar kaydedilir, kullanıcıya gösterilmez.

## Yan sorular (`/btw`)

`/btw`, bu harness üzerinde yerel olarak desteklenmez. `createCopilotAgentHarness()`,
`harness.runSideQuestion` değerini kasıtlı olarak tanımsız bırakır
(`extensions/copilot/harness.test.ts`, `describe("runSideQuestion")` içinde doğrulanır);
böylece OpenClaw'ın `/btw` dağıtıcısı (`src/agents/btw.ts`),
Codex dışındaki her çalışma zamanı için kullandığı aynı yola geçer:
yapılandırılmış model sağlayıcısı kısa bir yan soru istemiyle doğrudan çağrılır
ve yanıt `streamSimple` aracılığıyla akış halinde geri iletilir
(CLI oturumu ve ek havuz yuvası yoktur).

Bu, Copilot CLI oturumlarını aracının ana tur döngüsü için ayrılmış halde tutar
ve `/btw` davranışını Codex dışındaki diğer çalışma zamanlarıyla
aynı tutar.

## Doctor

`extensions/copilot/doctor-contract-api.ts`,
`src/plugins/doctor-contract-registry.ts` tarafından otomatik olarak yüklenir. Şunları sağlar:

- Boş bir `legacyConfigRules` (henüz kullanımdan kaldırılmış alan yoktur).
- İşlem yapmayan bir `normalizeCompatibilityConfig` (gelecekteki alan kullanımdan
  kaldırma işlemlerinin ağaç içinde kararlı bir yeri olması için tutulur).
- Bir `sessionRouteStateOwners` girdisi: sağlayıcı `github-copilot`,
  çalışma zamanı `copilot`, CLI oturum anahtarı `copilot`,
  kimlik doğrulama profili ön eki `github-copilot:`.

## Sınırlamalar

- Harness, `github-copilot` ile sahipsiz özel BYOK sağlayıcı kimliklerini
  üstlenir. Manifest sahibi yerel sağlayıcı kimlikleri, `agentRuntime.id`
  değeri `copilot` olarak zorlansa bile kendi çalışma zamanlarında kalır.
- TUI yüzeyi yoktur; eş yüzeyi bulunmayan çalışma zamanları için PI'ın TUI'ı
  yedek seçenek olmaya devam eder.
- Bir aracı `copilot` seçeneğine geçtiğinde PI oturum durumu taşınmaz.
  Seçim her deneme için ayrı yapılır; mevcut PI oturumları geçerliliğini korur.
- `ask_user`, Codex harness ile aynı OpenClaw istem ve yanıt yolunu
  kullanır: Copilot SDK kullanıcı girdisi istediğinde OpenClaw, etkin
  kanala/TUI'a engelleyici bir istem gönderir ve kuyruktaki bir sonraki
  kullanıcı mesajı SDK isteğini çözümler.

## İzinler ve ask_user

Köprülenmiş OpenClaw araçlarına yönelik izin uygulaması, SDK'nın
`onPermissionRequest` geri çağırması üzerinden değil, **araç sarmalayıcısının
içinde** gerçekleşir. PI'ın kullandığı aynı
`wrapToolWithBeforeToolCallHook` (`src/agents/agent-tools.before-tool-call.ts`),
`createOpenClawCodingTools` tarafından her kodlama aracına uygulanır: döngü algılama,
güvenilen Plugin politikaları, araç çağrısı öncesi kancalar ve Gateway
üzerinden iki aşamalı Plugin onayları (`plugin.approval.request`), yerel PI
denemeleriyle tamamen aynı kod yolundan geçer.

Copilot araç köprüsünün döndürdüğü her SDK aracı şunlarla işaretlenir:

- `overridesBuiltInTool: true` — aynı adlı yerleşik Copilot CLI aracının
  (edit, read, write, bash, ...) yerini alır; böylece her araç çağrısı yeniden
  OpenClaw'a yönlendirilir.
- `skipPermission: true` — SDK'ya, aracı çağırmadan önce
  `onPermissionRequest({kind: "custom-tool"})` tetiklememesini bildirir. Sarmalanmış
  `execute()` zaten daha kapsamlı OpenClaw politika denetimini
  gerçekleştirir; SDK düzeyindeki bir istem, OpenClaw uygulamasını ya kısa
  devreye uğratır (tümüne izin ver) ya da her araç çağrısını engeller
  (tümünü reddet) — ikisi de PI eşdeğerliğiyle uyuşmaz.

Ağaç içindeki Codex harness aynı ayrımı kullanır: köprülenmiş OpenClaw araçları
sarmalanır (`extensions/codex/src/app-server/dynamic-tools.ts`) ve codex-app-server'ın kendi yerel onay türleri
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`), `plugin.approval.request` üzerinden yönlendirilir
(`extensions/codex/src/app-server/approval-bridge.ts`). Copilot SDK'daki eşdeğeri olan ve
`onPermissionRequest` öğesine ulaşan `custom-tool` dışındaki herhangi bir tür
için kapalı hata veren `rejectAllPolicy`, aynı güvenlik ağıdır; uygulamada
hiçbir zaman tetiklenmez çünkü `overridesBuiltInTool: true` her yerleşik aracın yerini
alır.

Sarmalanmış araç katmanının PI'a eşdeğer politika kararları verebilmesi için
harness, PI'ın eksiksiz deneme-aracı bağlamını `createOpenClawCodingTools` öğesine
iletir: kimlik (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), kanal/yönlendirme (`groupId`,
`currentChannelId`, `replyToMode`, mesaj aracı açma-kapama seçenekleri),
kimlik doğrulama (`authProfileStore`), çalıştırma kimliği
(`sandboxSessionKey`, `runId` üzerinden türetilen
`sessionKey` / `runSessionKey`), model bağlamı
(`modelApi`, `modelContextWindowTokens`, `modelCompat`,
`modelHasVision`) ve çalıştırma kancaları (`onToolOutcome`,
`onYield`). Bu alanlar olmadan yalnızca sahibine yönelik izin
listeleri varsayılan olarak sessizce reddeder, Plugin güven politikaları doğru
kapsamı çözümleyemez ve `session_status: "current"` eski bir sandbox anahtarına
çözümlenir. Köprü oluşturucu `extensions/copilot/src/tool-bridge.ts` olup
`src/agents/embedded-agent-runner/run/attempt.ts:1262` konumundaki yetkili PI çağrısını yansıtır.
`runAttempt`, paylaşılan `resolveSandboxContext` bağlantı noktası üzerinden
sandbox bağlamını çözümler, SDK'ya etkin bir çalışma dizini iletir ve
`sandbox` ile alt aracı oluşturma çalışma alanını araç köprüsüne
aktarır. Köprü ayrıca SDK sınırında uygulayabildiği sınırlı araç oluşturma
denetimlerini de iletir: `includeCoreTools`, çalışma zamanı araç izin listesi
ve `toolConstructionPlan`.

Köprü, PI eşdeğerliği için `openclaw/plugin-sdk/agent-harness-tool-runtime` içindeki paylaşılan harness
araç yüzeyi yardımcısını da kullanır. Araç arama etkinleştirildiğinde SDK, tüm
OpenClaw araç şemaları yerine kompakt denetim araçlarını ve gizli bir katalog
yürütücüsünü görür. Kod modu etkinleştirildiğinde yardımcı, diğer aracı
harness'larının kullandığı aynı kod modu denetim yüzeyini ve katalog yaşam
döngüsünü oluşturur. Yerel model için yalın varsayılanlar, çalışma zamanıyla
uyumlu şema filtreleme, dizin doldurma ve katalog temizliği paylaşılan
yardımcıda kalır; böylece Copilot ile Codex'e komşu harness'lar birbirinden
sapmaz.

### Oturum düzeyinde GitHub belirteci

Copilot SDK sözleşmesi, **istemci düzeyindeki** GitHub belirtecini
(`CopilotClientOptions.gitHubToken`, CLI sürecinin kendisinin kimliğini doğrular)
**oturum düzeyindeki** belirteçten (`SessionConfig.gitHubToken`, söz konusu oturumun
içerik hariç tutmasını, model yönlendirmesini ve kotasını belirler;
hem `createSession` hem de `resumeSession` üzerinde dikkate alınır)
ayırır. Harness, kimlik doğrulamayı `resolveCopilotAuth` aracılığıyla bir kez
çözümler ve kimlik doğrulama modu `gitHubToken` olduğunda her iki alanı
da ayarlar (açık bir `auth.gitHubToken` veya yapılandırılmış bir
`github-copilot` kimlik doğrulama profilinden sözleşme yoluyla çözümlenen
bir `resolvedApiKey`). Çözümlenen mod `useLoggedInUser` olduğunda,
SDK'nın kimliği oturum açmış kimlikten türetmeye devam etmesi için oturum
düzeyindeki alan atlanır.

`ask_user`, `SessionConfig.onUserInputRequest` kullanır. Köprü, sabit seçenekli
istekler için seçenek dizinlerini veya etiketlerini kabul eder; SDK isteği
izin verdiğinde serbest biçimli yanıtları kabul eder ve OpenClaw denemesi
iptal edildiğinde bekleyen isteği iptal eder.

## İlgili

- [Aracı çalışma zamanları](/tr/concepts/agent-runtimes)
- [Codex harness](/tr/plugins/codex-harness)
- [Aracı harness Plugin'leri (SDK referansı)](/tr/plugins/sdk-agent-harness)
