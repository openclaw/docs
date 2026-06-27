---
read_when:
    - Utrzymujesz Plugin OpenClaw
    - Widzisz ostrzeżenie o zgodności pluginu
    - Planujesz migrację SDK Pluginu lub manifestu
summary: Umowy zgodności Plugin, metadane wycofywania i oczekiwania dotyczące migracji
title: Zgodność Plugin
x-i18n:
    generated_at: "2026-06-27T17:52:49Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 2e17881c393e3649cb6accb13996d83a855f434735da2e84738f823ac4eba0f5
    source_path: plugins/compatibility.md
    workflow: 16
---

OpenClaw utrzymuje starsze kontrakty Plugin podłączone przez nazwane adaptery
zgodności przed ich usunięciem. Chroni to istniejące bundled i external
plugins, gdy ewoluują kontrakty SDK, manifestu, konfiguracji, ustawień i
środowiska uruchomieniowego agenta.

## Rejestr zgodności

Kontrakty zgodności Plugin są śledzone w głównym rejestrze pod adresem
`src/plugins/compat/registry.ts`.

Każdy rekord ma:

- stabilny kod zgodności
- status: `active`, `deprecated`, `removal-pending` lub `removed`
- właściciela: SDK, konfigurację, ustawienia, kanał, dostawcę, wykonywanie
  Plugin, środowisko uruchomieniowe agenta albo core
- daty wprowadzenia i wycofania, gdy mają zastosowanie
- wskazówki dotyczące zamiennika
- dokumentację, diagnostykę i testy obejmujące stare i nowe zachowanie

Rejestr jest źródłem do planowania przez opiekunów i przyszłych kontroli
inspektora Plugin. Jeśli zmienia się zachowanie widoczne dla Plugin, dodaj lub
zaktualizuj rekord zgodności w tej samej zmianie, która dodaje adapter.

Zgodność napraw i migracji Doctor jest śledzona osobno pod adresem
`src/commands/doctor/shared/deprecation-compat.ts`. Te rekordy obejmują stare
kształty konfiguracji, układy ledger instalacji i shimy naprawcze, które mogą
musić pozostać dostępne po usunięciu ścieżki zgodności środowiska
uruchomieniowego.

Przeglądy wydań powinny sprawdzać oba rejestry. Nie usuwaj migracji Doctor
tylko dlatego, że pasujący rekord zgodności środowiska uruchomieniowego lub
konfiguracji wygasł; najpierw sprawdź, czy nie istnieje obsługiwana ścieżka
aktualizacji, która nadal potrzebuje tej naprawy. Ponownie zweryfikuj też każdą
adnotację zamiennika podczas planowania wydania, ponieważ właścicielstwo Plugin
i zakres konfiguracji mogą się zmieniać, gdy dostawcy i kanały wychodzą z core.

## Pakiet inspektora Plugin

Inspektor Plugin powinien znajdować się poza głównym repozytorium OpenClaw jako
osobny pakiet/repozytorium oparte na wersjonowanych kontraktach zgodności i
manifestu.

CLI pierwszego dnia powinno wyglądać tak:

```sh
openclaw-plugin-inspector ./my-plugin
```

Powinno emitować:

- walidację manifestu/schematu
- sprawdzaną wersję zgodności kontraktu
- kontrole metadanych instalacji/źródła
- kontrole importu ścieżki zimnej
- ostrzeżenia o wycofaniu i zgodności

Użyj `--json`, aby uzyskać stabilne, czytelne maszynowo wyjście w adnotacjach
CI. Core OpenClaw powinien udostępniać kontrakty i fixtures, które inspektor
może konsumować, ale nie powinien publikować binarium inspektora z głównego
pakietu `openclaw`.

### Ścieżka akceptacyjna opiekunów

Użyj Blacksmith Testbox wspieranego przez Crabbox dla ścieżki akceptacyjnej
pakietu instalowalnego podczas walidowania zewnętrznego inspektora względem
pakietów Plugin OpenClaw. Uruchom ją z czystego checkoutu OpenClaw po zbudowaniu
pakietu:

```sh
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "pnpm install && pnpm build && npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/telegram --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- ./extensions/discord --json"
pnpm crabbox:run -- --provider blacksmith-testbox --timing-json --shell -- "npm exec --yes @openclaw/plugin-inspector@0.1.0 -- <clawhub-plugin-dir> --json"
```

Utrzymuj tę ścieżkę jako opcjonalną dla opiekunów, ponieważ instaluje zewnętrzny
pakiet npm i może inspektować pakiety Plugin sklonowane poza repozytorium.
Lokalne zabezpieczenia repozytorium obejmują mapę eksportów SDK, metadane
rejestru zgodności, redukcję przestarzałych importów SDK i granice importów
bundled extension; dowód inspektora w Testbox obejmuje pakiet tak, jak konsumują
go zewnętrzni autorzy Plugin.

## Polityka wycofywania

OpenClaw nie powinien usuwać udokumentowanego kontraktu Plugin w tym samym
wydaniu, które wprowadza jego zamiennik.

Sekwencja migracji jest następująca:

1. Dodaj nowy kontrakt.
2. Utrzymaj stare zachowanie podłączone przez nazwany adapter zgodności.
3. Emituj diagnostykę lub ostrzeżenia, gdy autorzy Plugin mogą podjąć działanie.
4. Udokumentuj zamiennik i harmonogram.
5. Przetestuj zarówno stare, jak i nowe ścieżki.
6. Odczekaj przez ogłoszone okno migracji.
7. Usuń tylko za wyraźną zgodą na wydanie łamiące zgodność.

Wycofane rekordy muszą zawierać datę rozpoczęcia ostrzegania, zamiennik, link
do dokumentacji i ostateczną datę usunięcia nie późniejszą niż trzy miesiące po
rozpoczęciu ostrzegania. Nie dodawaj wycofanej ścieżki zgodności z otwartym
oknem usunięcia, chyba że opiekunowie wyraźnie zdecydują, że jest to trwała
zgodność, i zamiast tego oznaczą ją jako `active`.

## Obecne obszary zgodności

Obecne rekordy zgodności obejmują:

- starsze szerokie importy SDK, takie jak `openclaw/plugin-sdk/compat`
- starsze kształty Plugin oparte wyłącznie na hookach i `before_agent_start`
- starsze nazwy hooków czyszczenia `api.on("deactivate", ...)`, gdy Pluginy
  migrują do `gateway_stop`
- starsze punkty wejścia Plugin `activate(api)`, gdy Pluginy migrują do
  `register(api)`
- starsze aliasy SDK, takie jak `openclaw/extension-api`,
  `openclaw/plugin-sdk/channel-runtime`, konstruktory statusu
  `openclaw/plugin-sdk/command-auth`, `openclaw/plugin-sdk/test-utils`
  (zastąpione przez ukierunkowane podścieżki testowe
  `openclaw/plugin-sdk/*`) oraz aliasy typów `ClawdbotConfig` /
  `OpenClawSchemaType`
- listę dozwolonych bundled Plugin i zachowanie włączania
- starsze metadane manifestu zmiennych środowiskowych dostawcy/kanału
- starsze hooki Plugin dostawcy i aliasy typów, gdy dostawcy przechodzą na
  jawne hooki katalogu, uwierzytelniania, myślenia, replay i transportu
- starsze aliasy środowiska uruchomieniowego, takie jak `api.runtime.taskFlow`,
  `api.runtime.subagent.getSession`, `api.runtime.stt` oraz wycofane
  `api.runtime.config.loadConfig()` / `api.runtime.config.writeConfigFile(...)`
- płaskie pola callbacku WhatsApp `WebInboundMessage`, takie jak `body`,
  `chatId`, `reply(...)` i `mediaPath`, gdy konsumenci callbacków migrują do
  zagnieżdżonych kontekstów `event`, `payload`, `quote`, `group` i `platform`
  w `WebInboundCallbackMessage`
- pola admission najwyższego poziomu WhatsApp `WebInboundMessage`, takie jak
  `from`, `conversationId`, `accountId`, `accessControlPassed` i `chatType`,
  gdy konsumenci callbacków migrują do koperty `admission`
- starszą dzieloną rejestrację memory-plugin, gdy Pluginy pamięci przechodzą do
  `registerMemoryCapability`
- starszą rejestrację dostawcy embedding specyficzną dla pamięci, gdy dostawcy
  embedding przechodzą do `api.registerEmbeddingProvider(...)` i
  `contracts.embeddingProviders`
- starsze helpery SDK kanału dla natywnych schematów wiadomości, bramkowania
  wzmianek, formatowania kopert przychodzących i zagnieżdżania capability
  zatwierdzania
- starszy klucz trasy kanału i aliasy helperów porównywalnego celu, gdy Pluginy
  przechodzą do `openclaw/plugin-sdk/channel-route`
- wskazówki aktywacji, które są zastępowane przez właścicielstwo kontrybucji
  manifestu
- fallback środowiska uruchomieniowego `setup-api`, gdy deskryptory ustawień
  przechodzą do zimnych metadanych `setup.requiresRuntime: false`
- hooki `discovery` dostawcy, gdy hooki katalogu dostawcy przechodzą do
  `catalog.run(...)`
- metadane kanału `showConfigured` / `showInSetup`, gdy pakiety kanałów
  przechodzą do `openclaw.channel.exposure`
- starsze klucze konfiguracji runtime-policy, gdy Doctor migruje operatorów do
  `agentRuntime`
- wygenerowany fallback metadanych konfiguracji bundled channel, gdy trafiają
  metadane `channelConfigs` oparte najpierw na rejestrze
- utrwalone flagi środowiskowe wyłączenia rejestru Plugin i migracji instalacji,
  gdy przepływy naprawcze migrują operatorów do `openclaw plugins registry --refresh`
  i `openclaw doctor --fix`
- starsze ścieżki konfiguracji web search, web fetch i x_search należące do
  Plugin, gdy Doctor migruje je do `plugins.entries.<plugin>.config`
- starszą autorską konfigurację `plugins.installs` i aliasy ścieżki ładowania
  bundled plugin, gdy metadane instalacji przechodzą do ledger Plugin
  zarządzanego przez stan

Nowy kod Plugin powinien preferować zamiennik wymieniony w rejestrze i w
konkretnym przewodniku migracji. Istniejące Pluginy mogą nadal używać ścieżki
zgodności do czasu, aż dokumentacja, diagnostyka i notatki wydania ogłoszą okno
usunięcia.

### Płaskie aliasy callbacków przychodzących WhatsApp

Callbacki środowiska uruchomieniowego WhatsApp dostarczają `WebInboundMessage`:
kanoniczne zagnieżdżone konteksty `event`, `payload`, `quote`, `group` i
`platform` oraz wycofane płaskie aliasy dla dostarczonych pól callbacku. Nowy
kod callbacków powinien odczytywać zagnieżdżone konteksty. Kod, który konstruuje
czyste zagnieżdżone wiadomości callbacku, może używać
`WebInboundCallbackMessage`; listenery zgodności, które nadal wstrzykują stare
płaskie wiadomości testowe lub Plugin, powinny używać
`LegacyFlatWebInboundMessage` albo `WebInboundMessageInput`.

Płaskie aliasy pozostają dostępne do **2026-08-30**. To okno usunięcia dotyczy
tylko dostępu przez płaskie aliasy; zagnieżdżony kształt callbacku jest
kanonicznym kontraktem środowiska uruchomieniowego. Adnotacje TypeScript
`@deprecated` przy każdym płaskim aliasie wskazują jego dokładny zagnieżdżony
zamiennik. Typowe przykłady:

- `id`, `timestamp` i `isBatched` przechodzą pod `event`.
- `body`, `mediaPath`, `mediaType`, `mediaFileName`, `mediaUrl`, `location` i
  `untrustedStructuredContext` przechodzą pod `payload`.
- `to`, `chatId`, pola nadawcy/własne, `sendComposing`, `reply(...)` i
  `sendMedia(...)` przechodzą pod `platform`.
- pola `replyTo*` przechodzą pod `quote`, a pola tematu grupy, uczestnika i
  wzmianki przechodzą pod `group`.

`payload.untrustedStructuredContext` jest wyodrębniany z przychodzących payloadów
dostawcy. Pluginy powinny sprawdzić `label`, `source` i `type`, zanim potraktują
jego `payload` jako autorytatywny.

### Pola admission przychodzących WhatsApp

Zaakceptowane wiadomości callbacków WhatsApp zawierają teraz `admission`,
publicznie bezpieczną kopertę decyzji kontroli dostępu, która dopuściła
wiadomość. Nowy kod callbacków powinien odczytywać fakty admission z
`msg.admission` zamiast ze starszych pól admission najwyższego poziomu.

Pola najwyższego poziomu pozostają dostępne do **2026-08-30**. Adnotacje
TypeScript `@deprecated` wskazują każdy zamiennik:

- `from` i `conversationId` przechodzą do `admission.conversation.id`.
- `accountId` przechodzi do `admission.accountId`.
- `accessControlPassed` jest pochodnym widokiem zgodności dla
  `admission.ingress.decision === "allow"`; w wiadomościach, które już zawierają
  `admission`, zapis starszej wartości boolean nie przepisuje grafu ingress.
- `chatType` przechodzi do `admission.conversation.kind`.

## Notatki wydania

Notatki wydania powinny obejmować nadchodzące wycofania Plugin z docelowymi
datami i linkami do dokumentacji migracji. To ostrzeżenie musi nastąpić, zanim
ścieżka zgodności przejdzie do `removal-pending` albo `removed`.
