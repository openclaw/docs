---
read_when:
    - Utrzymujesz plugin OpenClaw
    - Widzisz ostrzeżenie o zgodności pluginu
    - Planujesz migrację zestawu SDK lub manifestu pluginu
summary: Kontrakty zgodności Pluginów, metadane wycofywania i wymagania dotyczące migracji
title: Zgodność Pluginu
x-i18n:
    generated_at: "2026-07-12T15:24:28Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 26f737e40175652cb24327c91d2af9dbf72b1b254011115f5b512a309707711c
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw utrzymuje starsze kontrakty pluginów podłączone za pośrednictwem nazwanych adapterów zgodności, zanim je usunie. Chroni to istniejące wbudowane i zewnętrzne pluginy w czasie rozwoju kontraktów SDK, manifestu, konfiguracji początkowej, konfiguracji oraz środowiska uruchomieniowego agenta.

## Rejestr zgodności

Kontrakty zgodności pluginów są śledzone w głównym rejestrze w pliku `src/plugins/compat/registry.ts`. Każdy rekord zawiera:

- stabilny kod zgodności
- status: `active`, `deprecated`, `removal-pending` lub `removed`
- właściciela: `sdk`, `config`, `setup`, `channel`, `provider`, `plugin-execution`, `agent-runtime` lub `core`
- daty wprowadzenia i wycofania, jeśli mają zastosowanie
- wskazówki dotyczące zamiennika
- dokumentację, diagnostykę i testy obejmujące stare oraz nowe zachowanie

Rejestr jest źródłem informacji do planowania prac przez opiekunów oraz przyszłych kontroli inspektora pluginów. Jeśli zachowanie dostępne dla pluginów ulega zmianie, dodaj lub zaktualizuj rekord zgodności w tej samej zmianie, która dodaje adapter.

Zgodność napraw i migracji wykonywanych przez doctor jest śledzona osobno w pliku `src/commands/doctor/shared/deprecation-compat.ts`. Rekordy te obejmują stare struktury konfiguracji, układy rejestru instalacji oraz podkładki naprawcze, które mogą wymagać zachowania dostępności po usunięciu ścieżki zgodności środowiska uruchomieniowego.

Przeglądy przed wydaniem powinny sprawdzać oba rejestry. Nie usuwaj migracji doctor tylko dlatego, że odpowiadający jej rekord zgodności środowiska uruchomieniowego lub konfiguracji wygasł; najpierw sprawdź, czy nie istnieje nadal obsługiwana ścieżka aktualizacji wymagająca tej naprawy. Podczas planowania wydania ponownie zweryfikuj także każdą adnotację zamiennika, ponieważ własność pluginów i zakres konfiguracji mogą się zmieniać w miarę przenoszenia dostawców i kanałów poza rdzeń.

## Zasady wycofywania

OpenClaw nie powinien usuwać udokumentowanego kontraktu pluginu w tym samym wydaniu, które wprowadza jego zamiennik. Kolejność migracji:

1. Dodaj nowy kontrakt.
2. Zachowaj stare zachowanie podłączone za pośrednictwem nazwanego adaptera zgodności.
3. Emituj komunikaty diagnostyczne lub ostrzeżenia, gdy autorzy pluginów mogą podjąć działanie.
4. Udokumentuj zamiennik i harmonogram.
5. Przetestuj zarówno starą, jak i nową ścieżkę.
6. Odczekaj ogłoszony okres migracji.
7. Usuń dopiero po wyraźnym zatwierdzeniu wydania wprowadzającego niezgodne zmiany.

Wycofane rekordy muszą zawierać datę rozpoczęcia ostrzeżeń, zamiennik, odnośnik do dokumentacji oraz ostateczną datę usunięcia przypadającą nie później niż trzy miesiące od rozpoczęcia ostrzeżeń. Nie dodawaj wycofanej ścieżki zgodności z bezterminowym okresem usunięcia, chyba że opiekunowie wyraźnie zdecydują, że jest to trwała zgodność, i zamiast tego oznaczą ją jako `active`.

## Bieżące obszary zgodności

Rejestr śledzi obecnie około 70 kodów zgodności w poniższych obszarach. Nowy kod pluginu powinien korzystać z zamiennika w każdym obszarze i w odpowiednim przewodniku migracji; istniejące pluginy mogą nadal korzystać ze ścieżki zgodności, dopóki dokumentacja, diagnostyka i informacje o wydaniu nie ogłoszą okresu jej usunięcia.

- starsze szerokie importy SDK, takie jak `openclaw/plugin-sdk/compat`
- starsze struktury pluginów oparte wyłącznie na hookach oraz `before_agent_start`
- starsze nazwy hooków czyszczenia `api.on("deactivate", ...)` w czasie migracji pluginów do `gateway_stop`
- starsze punkty wejścia pluginów `activate(api)` w czasie migracji pluginów do `register(api)`
- starsze aliasy SDK, takie jak `openclaw/extension-api`, konstruktory statusu `openclaw/plugin-sdk/channel-runtime`, `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils` (zastąpione wyspecjalizowanymi podścieżkami testowymi `openclaw/plugin-sdk/*`) oraz aliasy typów `ClawdbotConfig` / `OpenClawSchemaType`
- lista dozwolonych wbudowanych pluginów i zachowanie związane z ich włączaniem
- starsze metadane manifestu zmiennych środowiskowych dostawców/kanałów
- starsze hooki pluginów dostawców i aliasy typów w czasie przechodzenia dostawców na jawne hooki katalogu, uwierzytelniania, rozumowania, odtwarzania i transportu
- starsze aliasy środowiska uruchomieniowego, takie jak `api.runtime.taskFlow`, `api.runtime.subagent.getSession`, `api.runtime.stt` oraz wycofane `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- płaskie pola wywołania zwrotnego `WebInboundMessage` w WhatsApp (patrz niżej)
- pola dopuszczenia najwyższego poziomu `WebInboundMessage` w WhatsApp (patrz niżej)
- starsza rozdzielona rejestracja pluginów pamięci w czasie przechodzenia pluginów pamięci na `registerMemoryCapability`
- starsza rejestracja dostawcy osadzania specyficzna dla pamięci w czasie przechodzenia dostawców osadzania na `api.registerEmbeddingProvider(...)` oraz `contracts.embeddingProviders`
- starsze funkcje pomocnicze SDK kanałów dotyczące natywnych schematów wiadomości, ograniczania na podstawie wzmianek, formatowania kopert przychodzących oraz zagnieżdżania możliwości zatwierdzania
- starsze aliasy klucza trasy kanału i funkcji pomocniczej porównywalnego celu w czasie przechodzenia pluginów na `openclaw/plugin-sdk/channel-route`
- zastępowanie wskazówek aktywacji własnością wkładów manifestu
- rezerwowa ścieżka środowiska uruchomieniowego `setup-api` w czasie przenoszenia deskryptorów konfiguracji początkowej do metadanych zimnej ścieżki `setup.requiresRuntime: false`
- hooki `discovery` dostawcy w czasie przechodzenia hooków katalogu dostawcy na `catalog.run(...)`
- metadane kanału `showConfigured` / `showInSetup` w czasie przechodzenia pakietów kanałów na `openclaw.channel.exposure`
- starsze klucze konfiguracji zasad środowiska uruchomieniowego w czasie migrowania operatorów przez doctor do `agentRuntime`
- rezerwowa ścieżka wygenerowanych metadanych konfiguracji wbudowanych kanałów w czasie wdrażania metadanych `channelConfigs`, w których rejestr jest źródłem nadrzędnym
- utrwalone flagi środowiskowe wyłączania rejestru pluginów i migracji instalacji w czasie migrowania operatorów przez przepływy naprawcze do `openclaw plugins registry --refresh` oraz `openclaw doctor --fix`
- starsze ścieżki konfiguracji wyszukiwania internetowego, pobierania zasobów internetowych i x_search należące do pluginów w czasie migrowania ich przez doctor do `plugins.entries.<plugin>.config`
- starsza konfiguracja `plugins.installs` tworzona przez użytkowników oraz aliasy ścieżek ładowania wbudowanych pluginów w czasie przenoszenia metadanych instalacji do zarządzanego przez stan rejestru pluginów

### Płaskie aliasy przychodzących wywołań zwrotnych WhatsApp

Wywołania zwrotne środowiska uruchomieniowego WhatsApp dostarczają `WebInboundMessage`: kanoniczne zagnieżdżone konteksty `event`, `payload`, `quote`, `group` i `platform` oraz wycofane płaskie aliasy opublikowanych pól wywołań zwrotnych. Nowy kod wywołań zwrotnych powinien odczytywać zagnieżdżone konteksty. Kod konstruujący czyste, zagnieżdżone wiadomości wywołań zwrotnych może używać `WebInboundCallbackMessage`; nasłuchiwacze zgodności, które nadal wstrzykują stare płaskie wiadomości testowe lub pluginów, powinny używać `LegacyFlatWebInboundMessage` albo `WebInboundMessageInput`.

Płaskie aliasy pozostają dostępne do **2026-08-30**; ten okres dotyczy wyłącznie dostępu przez płaskie aliasy, a nie zagnieżdżonej struktury, która stanowi kanoniczny kontrakt środowiska uruchomieniowego. Adnotacja TypeScript `@deprecated` każdego płaskiego aliasu wskazuje jego dokładny zagnieżdżony zamiennik. Typowe przykłady:

- `id`, `timestamp` i `isBatched` przechodzą do `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location` i `untrustedStructuredContext` przechodzą do `payload`.
- `to`, `chatId`, pola nadawcy/własnej tożsamości, `sendComposing`, `reply(...)` i `sendMedia(...)` przechodzą do `platform`.
- Pola `replyTo*` przechodzą do `quote`; pola tematu grupy, uczestnika i wzmianki przechodzą do `group`.

`payload.untrustedStructuredContext` jest wyodrębniany z przychodzących ładunków dostawcy. Pluginy powinny sprawdzać `label`, `source` i `type`, zanim uznają jego `payload` za miarodajny.

### Pola dopuszczenia wiadomości przychodzących WhatsApp

Zaakceptowane wiadomości wywołań zwrotnych WhatsApp zawierają `admission`, bezpieczną do publicznego udostępnienia kopertę decyzji kontroli dostępu, która dopuściła wiadomość. Nowy kod wywołań zwrotnych powinien odczytywać informacje o dopuszczeniu z `msg.admission` zamiast ze starszych pól dopuszczenia najwyższego poziomu.

Pola najwyższego poziomu pozostają dostępne do **2026-08-30**. Adnotacja TypeScript `@deprecated` każdego pola wskazuje jego zamiennik:

- `from` i `conversationId` przechodzą do `admission.conversation.id`.
- `accountId` przechodzi do `admission.accountId`.
- `accessControlPassed` jest pochodnym widokiem zgodności wyrażenia `admission.ingress.decision === "allow"`; w wiadomościach, które już zawierają `admission`, zapis starszej wartości logicznej nie przepisuje grafu ruchu przychodzącego.
- `chatType` przechodzi do `admission.conversation.kind`.

## Pakiet inspektora pluginów

Inspektor pluginów powinien znajdować się poza głównym repozytorium OpenClaw jako osobny pakiet/repozytorium oparte na wersjonowanych kontraktach zgodności i manifestu. Początkowa postać CLI powinna wyglądać następująco:

```sh
openclaw-plugin-inspector ./my-plugin
```

Powinien generować wyniki walidacji manifestu/schematu, sprawdzaną wersję zgodności kontraktu, kontrole metadanych instalacji/źródła, kontrole importów zimnej ścieżki oraz ostrzeżenia dotyczące wycofania/zgodności. Użyj `--json`, aby uzyskać stabilne dane wyjściowe do odczytu maszynowego w adnotacjach CI. Rdzeń OpenClaw powinien udostępniać kontrakty i dane testowe, z których może korzystać inspektor, ale nie powinien publikować pliku wykonywalnego inspektora z głównego pakietu `openclaw`.

### Ścieżka akceptacyjna dla opiekunów

Podczas walidowania zewnętrznego inspektora względem pakietów pluginów OpenClaw używaj Blacksmith Testbox opartego na Crabbox jako ścieżki akceptacyjnej instalowalnego pakietu. Uruchom ją z czystego drzewa roboczego OpenClaw po zbudowaniu pakietu:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Ta ścieżka powinna być opcjonalna i przeznaczona dla opiekunów, ponieważ instaluje zewnętrzny pakiet npm i może sprawdzać pakiety pluginów sklonowane poza repozytorium. Lokalne zabezpieczenia repozytorium obejmują mapę eksportów SDK, metadane rejestru zgodności, stopniowe eliminowanie wycofanych importów SDK oraz granice importów wbudowanych rozszerzeń; weryfikacja inspektora w Testbox obejmuje pakiet w sposób, w jaki korzystają z niego autorzy zewnętrznych pluginów.

## Informacje o wydaniu

Informacje o wydaniu powinny zawierać nadchodzące wycofania pluginów wraz z docelowymi datami i odnośnikami do dokumentacji migracji, zanim ścieżka zgodności przejdzie do stanu `removal-pending` lub `removed`.
