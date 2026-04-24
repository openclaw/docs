---
read_when:
    - Refaktoryzacja definicji scenariuszy QA lub kodu harnessu qa-lab
    - Przenoszenie zachowania QA między scenariuszami Markdown a logiką harnessu TypeScript
summary: Plan refaktoryzacji QA dla katalogu scenariuszy i konsolidacji harnessu
title: Refaktoryzacja QA
x-i18n:
    generated_at: "2026-04-24T09:30:55Z"
    model: gpt-5.4
    provider: openai
    source_hash: 0d774d7b5e0fffd5c2504d9a4d6063198d77b866263ea8448474dce6246012d4
    source_path: refactor/qa.md
    workflow: 15
---

Status: wdrożono migrację fundamentów.

## Cel

Przenieść QA OpenClaw z modelu definicji rozdzielonych do jednego źródła prawdy:

- metadane scenariusza
- prompty wysyłane do modelu
- konfiguracja i teardown
- logika harnessu
- asercje i kryteria sukcesu
- artefakty i wskazówki raportowania

Pożądanym stanem końcowym jest ogólny harness QA, który ładuje rozbudowane pliki definicji scenariuszy zamiast kodować większość zachowania na sztywno w TypeScript.

## Stan obecny

Główne źródło prawdy znajduje się teraz w `qa/scenarios/index.md` oraz po jednym pliku na
scenariusz w `qa/scenarios/<theme>/*.md`.

Zaimplementowano:

- `qa/scenarios/index.md`
  - kanoniczne metadane paczki QA
  - tożsamość operatora
  - misję startową
- `qa/scenarios/<theme>/*.md`
  - jeden plik markdown na scenariusz
  - metadane scenariusza
  - powiązania handlerów
  - konfiguracja wykonania specyficzna dla scenariusza
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser paczki markdown + walidacja zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - renderowanie planu z paczki markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - inicjalizuje wygenerowane pliki zgodności oraz `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - wybiera wykonywalne scenariusze przez powiązania handlerów zdefiniowane w markdown
- protokół + interfejs QA bus
  - ogólne załączniki inline do renderowania obrazu/wideo/audio/pliku

Pozostałe rozdzielone powierzchnie:

- `extensions/qa-lab/src/suite.ts`
  - nadal zarządza większością wykonywalnej niestandardowej logiki handlerów
- `extensions/qa-lab/src/report.ts`
  - nadal wyprowadza strukturę raportu z wyników runtime

Podział źródła prawdy został więc naprawiony, ale wykonanie nadal jest w większości oparte na handlerach, a nie w pełni deklaratywne.

## Jak wygląda rzeczywista powierzchnia scenariusza

Odczyt bieżącego suite pokazuje kilka odrębnych klas scenariuszy.

### Prosta interakcja

- baza kanału
- baza DM
- follow-up w wątku
- przełączenie modelu
- domknięcie zatwierdzenia
- reakcja/edycja/usunięcie

### Mutacja konfiguracji i runtime

- config patch skill disable
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift check

### Asercje systemu plików i repozytorium

- source/docs discovery report
- build Lobster Invaders
- generated image artifact lookup

### Orkiestracja pamięci

- memory recall
- memory tools in channel context
- memory failure fallback
- session memory ranking
- thread memory isolation
- memory dreaming sweep

### Integracja narzędzi i Pluginów

- MCP plugin-tools call
- skill visibility
- skill hot install
- native image generation
- image roundtrip
- image understanding from attachment

### Wiele tur i wielu aktorów

- subagent handoff
- subagent fanout synthesis
- style flows odzyskiwania po restarcie

Te kategorie mają znaczenie, ponieważ wyznaczają wymagania DSL. Płaska lista prompt + oczekiwany tekst nie wystarcza.

## Kierunek

### Jedno źródło prawdy

Używać `qa/scenarios/index.md` oraz `qa/scenarios/<theme>/*.md` jako
autoryzowanego źródła prawdy.

Paczka powinna pozostać:

- czytelna dla człowieka w review
- parsowalna maszynowo
- wystarczająco bogata, aby sterować:
  - wykonaniem suite
  - bootstrapem obszaru roboczego QA
  - metadanymi interfejsu QA Lab
  - promptami docs/discovery
  - generowaniem raportów

### Preferowany format authoringu

Używać markdown jako formatu najwyższego poziomu, z ustrukturyzowanym YAML wewnątrz.

Zalecany kształt:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - nadpisania modelu/dostawcy
  - prerequisites
- sekcje prozy
  - objective
  - notes
  - debugging hints
- bloki fenced YAML
  - setup
  - steps
  - assertions
  - cleanup

To daje:

- lepszą czytelność PR niż ogromny JSON
- bogatszy kontekst niż czysty YAML
- ścisłe parsowanie i walidację zod

Surowy JSON jest akceptowalny tylko jako pośrednia forma wygenerowana.

## Proponowany kształt pliku scenariusza

Przykład:

````md
---
id: image-generation-roundtrip
title: Image generation roundtrip
surface: image
tags: [media, image, roundtrip]
models:
  primary: openai/gpt-5.4
requires:
  tools: [image_generate]
  plugins: [openai, qa-channel]
docsRefs:
  - docs/help/testing.md
  - docs/concepts/model-providers.md
codeRefs:
  - extensions/qa-lab/src/suite.ts
  - src/gateway/chat-attachments.ts
---

# Cel

Zweryfikować, że wygenerowane multimedia są ponownie dołączane w turze follow-up.

# Konfiguracja

```yaml scenario.setup
- action: config.patch
  patch:
    agents:
      defaults:
        imageGenerationModel:
          primary: openai/gpt-image-1
- action: session.create
  key: agent:qa:image-roundtrip
```

# Kroki

```yaml scenario.steps
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Image generation check: generate a QA lighthouse image and summarize it in one short sentence.
- action: artifact.capture
  kind: generated-image
  promptSnippet: Image generation check
  saveAs: lighthouseImage
- action: agent.send
  session: agent:qa:image-roundtrip
  message: |
    Roundtrip image inspection check: describe the generated lighthouse attachment in one short sentence.
  attachments:
    - fromArtifact: lighthouseImage
```

# Oczekiwania

```yaml scenario.expect
- assert: outbound.textIncludes
  value: lighthouse
- assert: requestLog.matches
  where:
    promptIncludes: Roundtrip image inspection check
  imageInputCountGte: 1
- assert: artifact.exists
  ref: lighthouseImage
```
````

## Możliwości runnera, które DSL musi pokryć

Na podstawie bieżącego suite ogólny runner potrzebuje czegoś więcej niż wykonania promptu.

### Akcje środowiska i konfiguracji

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Akcje tury agenta

- `agent.send`
- `agent.wait`
- `bus.injectInbound`
- `bus.injectOutbound`

### Akcje konfiguracji i runtime

- `config.get`
- `config.patch`
- `config.apply`
- `gateway.restart`
- `tools.effective`
- `skills.status`

### Akcje plików i artefaktów

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Akcje pamięci i Cron

- `memory.indexForce`
- `memory.searchCli`
- `doctor.memory.status`
- `cron.list`
- `cron.run`
- `cron.waitCompletion`
- `sessionTranscript.write`

### Akcje MCP

- `mcp.callTool`

### Asercje

- `outbound.textIncludes`
- `outbound.inThread`
- `outbound.notInRoot`
- `tool.called`
- `tool.notPresent`
- `skill.visible`
- `skill.disabled`
- `file.contains`
- `memory.contains`
- `requestLog.matches`
- `sessionStore.matches`
- `cron.managedPresent`
- `artifact.exists`

## Zmienne i referencje artefaktów

DSL musi obsługiwać zapisane wyniki i późniejsze odwołania.

Przykłady z bieżącego suite:

- utworzyć wątek, a następnie ponownie użyć `threadId`
- utworzyć sesję, a następnie ponownie użyć `sessionKey`
- wygenerować obraz, a następnie dołączyć plik w następnej turze
- wygenerować ciąg wake marker, a następnie potwierdzić, że pojawia się później

Potrzebne możliwości:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- typowane referencje do ścieżek, kluczy sesji, identyfikatorów wątków, markerów, wyników narzędzi

Bez obsługi zmiennych harness będzie nadal przeciekał logiką scenariusza z powrotem do TypeScript.

## Co powinno pozostać jako awaryjne obejścia

W pełni czysto deklaratywny runner nie jest realistyczny w fazie 1.

Niektóre scenariusze są z natury silnie orkiestracyjne:

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- generated image artifact resolution by timestamp/path
- discovery-report evaluation

Na razie powinny one używać jawnych niestandardowych handlerów.

Zalecana zasada:

- 85-90% deklaratywne
- jawne kroki `customHandler` dla trudnej pozostałej części
- tylko nazwane i udokumentowane custom handlery
- brak anonimowego kodu inline w pliku scenariusza

To utrzymuje ogólny silnik w czystości, a jednocześnie pozwala na postęp.

## Zmiana architektury

### Obecnie

Markdown scenariusza jest już źródłem prawdy dla:

- wykonania suite
- plików bootstrap obszaru roboczego
- katalogu scenariuszy interfejsu QA Lab
- metadanych raportu
- promptów discovery

Wygenerowana zgodność:

- inicjalizowany obszar roboczy nadal zawiera `QA_KICKOFF_TASK.md`
- inicjalizowany obszar roboczy nadal zawiera `QA_SCENARIO_PLAN.md`
- inicjalizowany obszar roboczy zawiera teraz także `QA_SCENARIOS.md`

## Plan refaktoryzacji

### Faza 1: loader i schema

Zrobione.

- dodano `qa/scenarios/index.md`
- podzielono scenariusze do `qa/scenarios/<theme>/*.md`
- dodano parser nazwanej zawartości YAML paczki markdown
- zwalidowano przez zod
- przełączono konsumentów na sparsowaną paczkę
- usunięto repo-level `qa/seed-scenarios.json` i `qa/QA_KICKOFF_TASK.md`

### Faza 2: ogólny silnik

- podzielić `extensions/qa-lab/src/suite.ts` na:
  - loader
  - engine
  - rejestr akcji
  - rejestr asercji
  - custom handlery
- zachować istniejące funkcje pomocnicze jako operacje silnika

Rezultat:

- silnik wykonuje proste scenariusze deklaratywne

Zacząć od scenariuszy, które są głównie prompt + wait + assert:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

Rezultat:

- pierwsze rzeczywiste scenariusze zdefiniowane w markdown dostarczane przez ogólny silnik

### Faza 4: migracja scenariuszy średniego poziomu

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

Rezultat:

- zmienne, artefakty, asercje narzędzi i asercje request-log sprawdzone w praktyce

### Faza 5: pozostawić trudne scenariusze na custom handlerach

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

Rezultat:

- ten sam format authoringu, ale z jawnymi blokami custom-step tam, gdzie są potrzebne

### Faza 6: usunąć hardcoded scenario map

Gdy pokrycie paczki będzie wystarczająco dobre:

- usunąć większość rozgałęzień TypeScript specyficznych dla scenariuszy z `extensions/qa-lab/src/suite.ts`

## Fake Slack / obsługa rich media

Bieżący QA bus jest zorientowany na tekst.

Istotne pliki:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Obecnie QA bus obsługuje:

- tekst
- reakcje
- wątki

Nie modeluje jeszcze załączników mediów inline.

### Potrzebny kontrakt transportowy

Dodaj ogólny model załączników QA bus:

```ts
type QaBusAttachment = {
  id: string;
  kind: "image" | "video" | "audio" | "file";
  mimeType: string;
  fileName?: string;
  inline?: boolean;
  url?: string;
  contentBase64?: string;
  width?: number;
  height?: number;
  durationMs?: number;
  altText?: string;
  transcript?: string;
};
```

Następnie dodaj `attachments?: QaBusAttachment[]` do:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Dlaczego najpierw ogólne

Nie buduj modelu mediów tylko dla Slack.

Zamiast tego:

- jeden ogólny model transportu QA
- wiele rendererów ponad nim
  - bieżący czat QA Lab
  - przyszły fake Slack web
  - wszelkie inne widoki fałszywego transportu

To zapobiega duplikowaniu logiki i pozwala scenariuszom mediów pozostać niezależnymi od transportu.

### Potrzebne prace w UI

Zaktualizuj interfejs QA tak, aby renderował:

- podgląd obrazu inline
- odtwarzacz audio inline
- odtwarzacz wideo inline
- chip załącznika pliku

Bieżący interfejs potrafi już renderować wątki i reakcje, więc renderowanie załączników powinno dołożyć się do tego samego modelu karty wiadomości.

### Prace scenariuszowe odblokowane przez transport mediów

Gdy załączniki zaczną przepływać przez QA bus, będzie można dodać bogatsze scenariusze fałszywego czatu:

- odpowiedź z obrazem inline w fake Slack
- rozumienie załącznika audio
- rozumienie załącznika wideo
- mieszana kolejność załączników
- odpowiedź w wątku z zachowaniem mediów

## Rekomendacja

Następny fragment implementacji powinien wyglądać tak:

1. dodać loader scenariuszy markdown + schemat zod
2. wygenerować bieżący katalog z markdown
3. najpierw zmigrować kilka prostych scenariuszy
4. dodać ogólną obsługę załączników QA bus
5. renderować obraz inline w interfejsie QA
6. następnie rozszerzyć to o audio i wideo

To najmniejsza ścieżka, która dowodzi obu celów:

- ogólne QA definiowane w markdown
- bogatsze fałszywe powierzchnie wiadomości

## Otwarte pytania

- czy pliki scenariuszy powinny dopuszczać osadzone szablony promptów w markdown z interpolacją zmiennych
- czy setup/cleanup powinny być nazwanymi sekcjami, czy po prostu uporządkowanymi listami akcji
- czy referencje artefaktów powinny być silnie typowane w schemacie, czy oparte na stringach
- czy custom handlery powinny znajdować się w jednym rejestrze, czy w rejestrach per powierzchnia
- czy wygenerowany plik zgodności JSON powinien pozostać zacommitowany podczas migracji

## Powiązane

- [Automatyzacja QA E2E](/pl/concepts/qa-e2e-automation)
