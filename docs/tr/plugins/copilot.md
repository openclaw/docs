---
read_when:
    - Bir ajan için GitHub Copilot SDK çalışma çerçevesini kullanmak istiyorsunuz
    - '`copilot` çalışma zamanı için yapılandırma örneklerine ihtiyacınız var'
    - Bir aracıyı abonelik kapsamındaki Copilot'a (github / openclaw / copilot) bağlıyor ve Copilot CLI üzerinden çalışmasını istiyorsunuz
summary: OpenClaw gömülü ajan turlarını harici GitHub Copilot SDK yürütme altyapısı üzerinden çalıştırın
title: Copilot SDK çalışma çerçevesi
x-i18n:
    generated_at: "2026-07-12T12:29:14Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 4270a9b75a038540af6a8306f3e80c87d6085dde29d128adf85b930713209fc5
    source_path: plugins/copilot.md
    workflow: 16
---

Harici `@openclaw/copilot` Plugin'i, OpenClaw'ın yerleşik çalıştırma altyapısı yerine GitHub Copilot CLI (`@github/copilot-sdk`) aracılığıyla gömülü abonelik Copilot aracı turlarını çalıştırır. Düşük seviyeli aracı döngüsünün sahibi Copilot CLI oturumudur: yerel araç yürütme, yerel Compaction (`infiniteSessions`) ve `copilotHome` altındaki CLI tarafından yönetilen ileti dizisi durumu. OpenClaw; sohbet kanallarının, oturum dosyalarının, model seçiminin, dinamik araçların (köprülenmiş), onayların, medya tesliminin, görünür transkript yansısının, `/btw` yan sorularının (bkz. [Yan sorular (`/btw`)](#side-questions-btw)) ve `openclaw doctor` komutunun sahibi olmaya devam eder.

Daha geniş model/sağlayıcı/çalışma zamanı ayrımı için
[Aracı çalışma zamanları](/tr/concepts/agent-runtimes) ile başlayın.

## Gereksinimler

- `@openclaw/copilot` Plugin'i yüklü OpenClaw.
- Yapılandırmanız `plugins.allow` kullanıyorsa `copilot` değerini (Plugin'in bildirdiği manifest kimliği) ekleyin. npm paket adı `@openclaw/copilot` için bir izin listesi girdisi eşleşmez ve `agentRuntime.id: "copilot"` ayarlanmış olsa bile Plugin'in engellenmesine neden olur.
- Copilot CLI'ı çalıştırabilen bir GitHub Copilot aboneliği veya başsız ya da Cron çalıştırmaları için bir `gitHubToken` ortam değişkeni / kimlik doğrulama profili girdisi.
- Yazılabilir bir `copilotHome` dizini. OpenClaw bir aracı dizini sağladığında varsayılan değer `<agentDir>/copilot`, aksi durumda `~/.openclaw/agents/<agentId>/copilot` olur.

`openclaw doctor`, oturum durumu sahipliği ve gelecekteki yapılandırma geçişleri için Plugin'in [doctor sözleşmesini](#doctor) çalıştırır. Copilot CLI ortamını yoklamaz.

## Kurulum

Copilot çalışma zamanı harici bir Plugin olarak sunulur; böylece çekirdek `openclaw` paketi `@github/copilot-sdk` veya platforma özgü `@github/copilot-<platform>-<arch>` CLI ikili dosyasını (birlikte yaklaşık 260 MB) içermez. Yalnızca bu çalışma zamanını kullanmayı seçen aracılar için yükleyin:

```bash
openclaw plugins install @openclaw/copilot
```

Kurulum sihirbazı, ilk kez bir `github-copilot/*` modeli seçtiğinizde **ve** yapılandırmanız bu modeli (veya sağlayıcısını) `agentRuntime: { id: "copilot" }` aracılığıyla Copilot çalışma zamanına yönlendirdiğinde Plugin'i otomatik olarak yükler; bkz. [Hızlı başlangıç](#quickstart). Bu açık seçim olmadan OpenClaw, yerleşik GitHub Copilot sağlayıcısını kullanır ve bu Plugin'i hiçbir zaman yüklemez.

Çalışma zamanı SDK'yı şu sırayla çözümler:

1. Yüklü `@openclaw/copilot` paketinden `import("@github/copilot-sdk")`.
2. Yedek dizin `~/.openclaw/npm-runtime/copilot/` (eski isteğe bağlı kurulum hedefi).

Eksik bir SDK, `COPILOT_SDK_MISSING` koduna ve yukarıdaki yeniden yükleme komutuna sahip tek bir hata olarak gösterilir.

## Hızlı başlangıç

Bir modeli (veya bir sağlayıcıyı) çalıştırma altyapısına sabitleyin:

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

Yalnızca ilgili modeli çalıştırma altyapısından geçirmek için tek bir model girdisinde, sağlayıcı altındaki her modeli yönlendirmek içinse sağlayıcıda `agentRuntime.id` ayarlayın.

`github-copilot/auto`, taşınabilir başlangıç noktasıdır. Adlandırılmış Copilot modelleri hesap ve kuruluş politikalarına bağlıdır; bir modeli sabitlemeden önce kimliği doğrulanmış Copilot CLI'ınızın o modeli gerçekten sunduğunu doğrulayın.

## Desteklenen sağlayıcılar

Çalıştırma altyapısı, standart `github-copilot` sağlayıcısını (`extensions/github-copilot` sahipliğinde) ve modelin boş olmayan bir `baseUrl` değerine ve aşağıdaki `api` biçimlerinden birine sahip olduğu özel `models.providers` girdilerini destekler:

- `anthropic-messages`
- `azure-openai-responses`
- `ollama` (OpenAI uyumlu tamamlamalar)
- `openai-completions`
- `openai-responses`

Yerel sağlayıcı kimlikleri (`openai`, `anthropic`, `google`, `ollama`) kendi yerel çalışma zamanlarının sahipliğinde kalır. Bir uç noktayı Copilot BYOK üzerinden yönlendirmek için farklı bir özel sağlayıcı kimliği kullanın.

Copilot BYOK uç noktaları genel HTTPS URL'leri olmalıdır. Çalıştırma altyapısı, Copilot SDK'ya her deneme için bir local loopback proxy'si verir ve ardından sağlayıcı trafiğini OpenClaw'ın korumalı fetch yolu üzerinden iletir; böylece DNS sabitleme ve SSRF politikası OpenClaw'ın sahipliğinde kalır. Yerel Ollama, LM Studio veya LAN model sunucuları için yerel OpenClaw çalışma zamanını kullanın.

## BYOK

Copilot BYOK, SDK'nın oturum düzeyindeki özel sağlayıcı sözleşmesini kullanır. OpenClaw; çözümlenmiş model uç noktasını, API anahtarını, taşıyıcı belirteç modunu, üstbilgileri, model kimliğini ve bağlam/çıktı sınırlarını iletir; sağlayıcı aktarım mantığı çekirdekte değil SDK'da kalır.

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

BYOK oturumları, abonelik oturumlarından ve diğer BYOK uç noktalarından ya da kimlik bilgilerinden ayrı anahtarlanır. Anahtarın, üstbilgilerin, modelin veya uç noktanın değiştirilmesi, uyumsuz durumu sürdürmek yerine yeni bir Copilot SDK oturumu başlatır.

## Kimlik doğrulama

`runCopilotAttempt` sırasında aracı başına uygulanan öncelik sırası:

1. Deneme girdisindeki **açık `useLoggedInUser: true`** — aracının `copilotHome` dizini altındaki Copilot CLI oturum açmış kullanıcısını kullanır.
2. Deneme girdisindeki **açık `gitHubToken`** (`profileId` + `profileVersion` gerektirir). Kimlik doğrulama profili çözümlemesini atlaması gereken doğrudan CLI çağrıları ve testler içindir.
3. **Sözleşme tarafından çözümlenen `resolvedApiKey` + `authProfileId`** — ana üretim yolu. Çekirdek, çalıştırma altyapısını çağırmadan önce aracının yapılandırılmış `github-copilot` kimlik doğrulama profilini (`src/infra/provider-usage.auth.ts:resolveProviderAuths`) çözümler; böylece bir `github-copilot:<profile>` kimlik doğrulama profili, ortam değişkenleri olmadan başsız, Cron veya çok profilli kurulumlarda uçtan uca çalışır.
4. **Ortam değişkeni yedeği**, şu sırayla denetlenir (ilk boş olmayan değer kazanır, boş dizeler yok sayılır; `extensions/github-copilot/auth.ts` içindeki yayımlanmış `github-copilot` sağlayıcı önceliğini yansıtır):
   1. `OPENCLAW_GITHUB_TOKEN` — çalıştırma altyapısına özgü geçersiz kılma; sistem genelindeki `gh` / Copilot CLI yapılandırmasını bozmadan OpenClaw çalıştırma altyapısı için bir belirteç sabitlemenizi sağlar.
   2. `COPILOT_GITHUB_TOKEN` — standart Copilot SDK / CLI ortam değişkeni.
   3. `GH_TOKEN` — standart `gh` CLI ortam değişkeni.
   4. `GITHUB_TOKEN` — genel GitHub belirteci yedeği.

   Sentezlenen havuz profili kimliği `env:<NAME>` değeridir; profil sürümü, belirtecin geri döndürülemez sha256 parmak izidir. Böylece ortam değerinin değiştirilmesi istemci havuzunu temiz biçimde geçersiz kılar.

5. Hiçbir belirteç sinyali bulunmadığında **varsayılan `useLoggedInUser`**.

Her aracı kendi `copilotHome` dizinine sahip olur; böylece aynı makinedeki aracılar arasında Copilot CLI belirteçleri, oturumları ve yapılandırması hiçbir zaman sızmaz. Varsayılan:
`<agentDir>/copilot` (SDK durumunu OpenClaw'ın `models.json` / `auth-profiles.json` dosyalarıyla aynı dizinin dışında tutar) veya aracı dizini sağlanmadığında `~/.openclaw/agents/<agentId>/copilot`.
Özel bir konum için (örneğin geçiş amacıyla paylaşılan bir bağlama noktası) deneme girdisinde `copilotHome: <path>` ile geçersiz kılın.

Canlı çalıştırma altyapısı testleri, doğrudan belirteç için `OPENCLAW_COPILOT_AGENT_LIVE_TOKEN` kullanır. Paylaşılan canlı test kurulumu, gerçek kimlik doğrulama profillerini yalıtılmış test ana dizinine yerleştirdikten sonra `COPILOT_GITHUB_TOKEN`, `GH_TOKEN` ve `GITHUB_TOKEN` değerlerini temizler. Böylece özel değişken üzerinden geçirilen bir `gh auth token` değeri, ilgisiz test paketlerine sızmadan hatalı atlamaları önler.

## Yapılandırma yüzeyi

Çalıştırma altyapısı, deneme başına girdiden (`runCopilotAttempt({...})`) ve `extensions/copilot/src/` içindeki küçük bir ortam varsayılanları kümesinden yapılandırma okur:

| Alan                     | Amaç                                                                                                                                                                                                                                                                                                                                 |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `copilotHome`            | Aracı başına CLI durum dizini (varsayılanlar yukarıdadır).                                                                                                                                                                                                                                                                           |
| `model`                  | Dize veya `{ provider, id, api?, baseUrl?, headers?, authHeader? }`. Aracının normal model seçimini kullanmak için belirtmeyin; çalıştırma altyapısı çözümlenen sağlayıcının desteklendiğini doğrular.                                                                                                                                |
| `reasoningEffort`        | `"low" \| "medium" \| "high" \| "xhigh"`. `auto-reply/thinking.ts` içindeki OpenClaw `ThinkLevel` / `ReasoningLevel` çözümlemesinden eşlenir.                                                                                                                                                                                         |
| `infiniteSessionConfig`  | `harness.compact` tarafından yönlendirilen SDK `infiniteSessions` bloğu için isteğe bağlı geçersiz kılma. Olduğu gibi bırakılması güvenlidir.                                                                                                                                                                                          |
| `hooksConfig`            | Araç/MCP, kullanıcı istemi, oturum ve hata geri çağrıları için isteğe bağlı yerel Copilot SDK `SessionHooks` yapılandırması. OpenClaw'ın taşınabilir yaşam döngüsü kancalarından ayrıdır.                                                                                                                                               |
| `permissionPolicy`       | Yerleşik SDK araç türleri (`shell`, `write`, `read`, `url`, `mcp`, `memory`, `hook`) için SDK'nın `onPermissionRequest` işleyicisini isteğe bağlı olarak geçersiz kılar. Güvenlik ağı olarak varsayılanı `rejectAllPolicy` değeridir; neden gerçekte hiçbir zaman tetiklenmediği için bkz. [İzinler ve ask_user](#permissions-and-ask_user). |
| `enableSessionTelemetry` | İsteğe bağlı SDK oturum telemetrisi bayrağı.                                                                                                                                                                                                                                                                                          |

OpenClaw Plugin kancaları, Copilot'a özgü bir deneme yapılandırması gerektirmez. Çalıştırma altyapısı; standart çalıştırma altyapısı yardımcıları üzerinden `before_prompt_build` (ve eski `before_agent_start` uyumluluk kancası), `llm_input`, `llm_output` ve `agent_end` kancalarını çalıştırır. Başarılı SDK Compaction işlemleri ayrıca `before_compaction` ve `after_compaction` kancalarını çalıştırır. Köprülenmiş OpenClaw araçları `before_tool_call` kancasını çalıştırır ve `after_tool_call` üzerinden rapor verir; `hooksConfig`, taşınabilir eşdeğeri bulunmayan yalnızca SDK'ya özgü yerel geri çağrılar için kullanılmaya devam eder.

OpenClaw içindeki başka hiçbir bileşenin bu alanları bilmesi gerekmez. Diğer Plugin'ler, kanallar ve çekirdek kod yalnızca standart `AgentHarnessAttemptParams` / `AgentHarnessAttemptResult` biçimini görür.

## Compaction

`harness.compact` çalıştığında Copilot SDK çalıştırma altyapısı:

1. Bekleyen çalışmayı sürdürmeden izlenen SDK oturumunu devam ettirir.
2. SDK'nın oturum kapsamlı geçmiş Compaction RPC'sini çağırır.
3. Çalışma alanı altında uyumluluk işaretleyici dosyaları yazmadan SDK Compaction sonucunu döndürür.

OpenClaw tarafındaki transkript yansısı (aşağıda), Compaction sonrasındaki iletileri almaya devam eder; böylece kullanıcıya gösterilen sohbet geçmişi tutarlı kalır.

## Transkript yansıtma

`runCopilotAttempt`, her turun yansıtılabilir iletilerini `extensions/copilot/src/dual-write-transcripts.ts` aracılığıyla OpenClaw denetim transkriptine çift yazar. Yansı, oturum başına kapsamlandırılır (`copilot:${sessionId}`) ve ileti başına anahtarlanır (`${role}:${sha256_16(role,content)}`); böylece yeniden yayımlanan önceki tur girdileri çoğaltılmak yerine diskteki mevcut anahtarlarla çakışır.

Yazım dökümü hatasının denemeyi asla başarısız kılmaması için aynayı iki hata yalıtımı katmanı sarar: dahili bir en iyi çaba sarmalayıcısı ve deneme düzeyinde derinlemesine savunma amaçlı bir `.catch(...)`. Hatalar günlüğe kaydedilir, kullanıcıya yansıtılmaz.

## Yan sorular (`/btw`)

`/btw`, bu düzenek üzerinde **yerel değildir**. `createCopilotAgentHarness()`, `harness.runSideQuestion` özelliğini kasıtlı olarak tanımsız bırakır
(`extensions/copilot/harness.test.ts` içindeki `describe("runSideQuestion")` bölümünde doğrulanır);
bu nedenle OpenClaw'ın `/btw` dağıtıcısı (`src/agents/btw.ts`), Codex dışındaki tüm çalışma zamanları için kullandığı aynı yola geçer: yapılandırılmış model sağlayıcısı, kısa bir yan soru istemiyle doğrudan çağrılır ve yanıt `streamSimple` aracılığıyla akış hâlinde geri gönderilir (CLI oturumu ve ek havuz yuvası yoktur).

Bu, Copilot CLI oturumlarını ajanın ana tur döngüsü için ayrılmış tutar ve `/btw` davranışını Codex dışındaki diğer çalışma zamanlarıyla aynı kılar.

## Doctor

`extensions/copilot/doctor-contract-api.ts`, `src/plugins/doctor-contract-registry.ts` tarafından otomatik olarak yüklenir. Şunları sağlar:

- Boş bir `legacyConfigRules` (henüz kullanımdan kaldırılmış alan yoktur).
- İşlem yapmayan bir `normalizeCompatibilityConfig` (gelecekteki alan kaldırma işlemlerinin kaynak ağacında kararlı bir yeri olması için korunur).
- Bir `sessionRouteStateOwners` girdisi: sağlayıcı `github-copilot`, çalışma zamanı `copilot`, CLI oturum anahtarı `copilot`, kimlik doğrulama profili ön eki `github-copilot:`.

## Sınırlamalar

- Düzenek, `github-copilot` ile sahipliği belirlenmemiş özel BYOK sağlayıcı kimliklerini üstlenir. Manifest sahipliğindeki yerel sağlayıcı kimlikleri, `agentRuntime.id` değeri zorla `copilot` olarak ayarlansa bile sahip çalışma zamanlarında kalır.
- TUI yüzeyi yoktur; eşdeğer bir yüzeyi bulunmayan çalışma zamanlarında Pi'nin TUI'si yedek seçenek olarak kalır.
- Bir ajan `copilot` çalışma zamanına geçtiğinde Pi oturum durumu taşınmaz. Seçim her deneme için ayrı yapılır; mevcut Pi oturumları geçerliliğini korur.
- `ask_user`, Codex düzeneğiyle aynı OpenClaw istem-ve-yanıt yolunu kullanır: Copilot SDK kullanıcı girdisi istediğinde OpenClaw, etkin kanala/TUI'ye engelleyici bir istem gönderir ve sıraya alınan bir sonraki kullanıcı mesajı SDK isteğini sonuçlandırır.

## İzinler ve ask_user

Köprülenen OpenClaw araçları için izin uygulaması, SDK'nın `onPermissionRequest` geri çağrısı üzerinden değil, **araç sarmalayıcısının içinde** gerçekleşir. Pi'nin kullandığı aynı `wrapToolWithBeforeToolCallHook`
(`src/agents/agent-tools.before-tool-call.ts`), `createOpenClawCodingTools` tarafından her kodlama aracına uygulanır: döngü algılama, güvenilir Plugin politikaları, araç çağrısı öncesi kancalar ve Gateway üzerinden iki aşamalı Plugin onayları (`plugin.approval.request`), yerel Pi denemeleriyle tamamen aynı kod yolundan geçer.

`convertOpenClawToolToSdkTool` tarafından döndürülen SDK Aracı şu şekilde işaretlenir:

- `overridesBuiltInTool: true` — aynı adlı Copilot CLI yerleşik aracının (edit, read, write, bash, ...) yerini alır; böylece her araç çağrısı OpenClaw'a geri yönlendirilir.
- `skipPermission: true` — SDK'ya, aracı çağırmadan önce `onPermissionRequest({kind: "custom-tool"})` olayını tetiklememesini söyler. Sarmalanmış `execute()` zaten daha kapsamlı OpenClaw politika denetimini gerçekleştirir; SDK düzeyindeki bir istem, OpenClaw'ın uygulamasını ya kısa devreye uğratır (tümüne izin ver) ya da her araç çağrısını engeller (tümünü reddet) — bunların hiçbiri Pi ile davranış eşitliği sağlamaz.

Kaynak ağacındaki Codex düzeneği aynı ayrımı kullanır: köprülenen OpenClaw araçları sarmalanır (`extensions/codex/src/app-server/dynamic-tools.ts`) ve codex-app-server'ın kendi yerel onay türleri
(`item/commandExecution/requestApproval`, `item/fileChange/requestApproval`,
`item/permissions/requestApproval`), `plugin.approval.request` üzerinden yönlendirilir
(`extensions/codex/src/app-server/approval-bridge.ts`). Copilot SDK'daki eşdeğeri — `onPermissionRequest` noktasına ulaşan `custom-tool` dışındaki herhangi bir tür için kapalı durumda reddeden `rejectAllPolicy` — aynı güvenlik ağıdır ve `overridesBuiltInTool: true` her yerleşik aracın yerini aldığı için pratikte hiçbir zaman tetiklenmez.

Sarmalanmış araç katmanının Pi'ye eşdeğer politika kararları verebilmesi için düzenek, Pi'nin tüm deneme aracı bağlamını `createOpenClawCodingTools` işlevine iletir: kimlik (`senderIsOwner`, `memberRoleIds`,
`ownerOnlyToolAllowlist`, ...), kanal/yönlendirme (`groupId`,
`currentChannelId`, `replyToMode`, mesaj aracı anahtarları), kimlik doğrulama
(`authProfileStore`), çalıştırma kimliği (`sandboxSessionKey` değerinden türetilen `sessionKey` / `runSessionKey`, `runId`), model bağlamı (`modelApi`,
`modelContextWindowTokens`, `modelCompat`, `modelHasVision`) ve çalıştırma kancaları
(`onToolOutcome`, `onYield`). Bu alanlar olmadan yalnızca sahip kullanımına açık izin listeleri varsayılan olarak sessizce reddeder, Plugin güven politikaları doğru kapsamı çözümleyemez ve `session_status: "current"` eski bir korumalı alan anahtarına çözümlenir. Köprü oluşturucu `extensions/copilot/src/tool-bridge.ts` dosyasındadır ve `src/agents/embedded-agent-runner/run/attempt.ts:1262` konumundaki yetkili Pi çağrısını yansıtır.
`runAttempt`, korumalı alan bağlamını paylaşılan `resolveSandboxContext` bağlantı noktası üzerinden çözümler, SDK'ya etkin bir çalışma dizini geçirir ve `sandbox` ile alt ajan oluşturma çalışma alanını araç köprüsüne iletir. Köprü ayrıca SDK sınırında uygulayabildiği sınırlı araç oluşturma denetimlerini de iletir: `includeCoreTools`, çalışma zamanı araç izin listesi ve `toolConstructionPlan`.

Köprü, Pi ile davranış eşitliği için `openclaw/plugin-sdk/agent-harness-tool-runtime` içindeki paylaşılan düzenek araç yüzeyi yardımcısını da kullanır. Araç arama etkinleştirildiğinde SDK, her OpenClaw araç şeması yerine kompakt denetim araçlarını ve gizli bir katalog yürütücüsünü görür. Kod modu etkinleştirildiğinde yardımcı, diğer ajan düzenekleri tarafından kullanılan aynı kod modu denetim yüzeyini ve katalog yaşam döngüsünü oluşturur. Yerel model için yalın varsayılanlar, çalışma zamanıyla uyumlu şema filtreleme, dizin doldurma ve katalog temizleme işlemlerinin tümü paylaşılan yardımcıda kalır; böylece Copilot ve Codex'e komşu düzenekler birbirinden sapmaz.

### Oturum düzeyinde GitHub belirteci

Copilot SDK sözleşmesi, **istemci düzeyindeki** GitHub belirtecini
(`CopilotClientOptions.gitHubToken`, CLI işleminin kendisinin kimliğini doğrular)
**oturum düzeyindeki** belirteçten (`SessionConfig.gitHubToken`, ilgili oturumun içerik hariç tutma, model yönlendirme ve kotasını belirler; hem `createSession` hem de `resumeSession` tarafından dikkate alınır) ayırır. Düzenek, kimlik doğrulamayı `resolveCopilotAuth` üzerinden bir kez çözümler ve kimlik doğrulama modu `gitHubToken` olduğunda her iki alanı da ayarlar (açıkça belirtilmiş bir `auth.gitHubToken` veya yapılandırılmış bir `github-copilot` kimlik doğrulama profilinden sözleşme aracılığıyla çözümlenmiş `resolvedApiKey`). Çözümlenen mod `useLoggedInUser` olduğunda, SDK'nın kimliği oturum açmış kimlikten türetmeye devam etmesi için oturum düzeyindeki alan atlanır.

`ask_user`, `SessionConfig.onUserInputRequest` kullanır. Köprü, sabit seçenekli isteklerde seçenek indekslerini veya etiketlerini kabul eder, SDK isteği izin verdiğinde serbest biçimli yanıtları kabul eder ve OpenClaw denemesi iptal edildiğinde bekleyen isteği iptal eder.

## İlgili

- [Ajan çalışma zamanları](/tr/concepts/agent-runtimes)
- [Codex düzeneği](/tr/plugins/codex-harness)
- [Ajan düzenek Pluginleri (SDK başvurusu)](/tr/plugins/sdk-agent-harness)
