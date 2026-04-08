---
x-i18n:
    generated_at: "2026-04-08T06:02:00Z"
    model: gpt-5.4
    provider: openai
    source_hash: 4a9066b2a939c5a9ba69141d75405f0e8097997b523164340e2f0e9a0d5060dd
    source_path: refactor/qa.md
    workflow: 15
---

# Refaktoryzacja QA

Status: podstawowa migracja została wdrożona.

## Cel

Przenieść QA OpenClaw z modelu podzielonych definicji do jednego źródła prawdy:

- metadane scenariuszy
- prompty wysyłane do modelu
- konfiguracja początkowa i końcowa
- logika harnessu
- asercje i kryteria powodzenia
- artefakty i wskazówki do raportów

Docelowym stanem ma być generyczny harness QA, który wczytuje rozbudowane pliki definicji scenariuszy zamiast kodować większość zachowań na sztywno w TypeScript.

## Stan obecny

Główne źródło prawdy znajduje się teraz w `qa/scenarios/index.md` oraz w jednym pliku
na scenariusz w `qa/scenarios/*.md`.

Wdrożone:

- `qa/scenarios/index.md`
  - kanoniczne metadane pakietu QA
  - tożsamość operatora
  - misja startowa
- `qa/scenarios/*.md`
  - jeden plik Markdown na scenariusz
  - metadane scenariusza
  - powiązania handlerów
  - konfiguracja wykonania specyficzna dla scenariusza
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser pakietu Markdown + walidacja zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - renderowanie planu z pakietu Markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - seeduje wygenerowane pliki zgodności oraz `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - wybiera wykonywalne scenariusze przez zdefiniowane w Markdown powiązania handlerów
- Protokół magistrali QA + UI
  - generyczne osadzone załączniki do renderowania obrazów/wideo/audio/plików

Pozostałe rozdzielone powierzchnie:

- `extensions/qa-lab/src/suite.ts`
  - nadal zawiera większość wykonywalnej niestandardowej logiki handlerów
- `extensions/qa-lab/src/report.ts`
  - nadal wyprowadza strukturę raportu na podstawie wyników wykonania

Czyli podział źródła prawdy został naprawiony, ale wykonanie nadal jest w większości oparte na handlerach zamiast w pełni deklaratywne.

## Jak naprawdę wygląda powierzchnia scenariuszy

Odczyt obecnego suite pokazuje kilka odrębnych klas scenariuszy.

### Prosta interakcja

- bazowy kanał
- bazowa DM
- wątkowana kontynuacja
- przełączenie modelu
- dokończenie po zatwierdzeniu
- reakcja/edycja/usunięcie

### Mutacja konfiguracji i środowiska uruchomieniowego

- wyłączenie umiejętności przez poprawkę konfiguracji
- config apply restart wake-up
- zmiana możliwości po restarcie konfiguracji
- sprawdzenie dryfu inwentarza runtime

### Asercje dotyczące systemu plików i repozytorium

- raport odkrywania źródeł/dokumentacji
- zbudowanie Lobster Invaders
- wyszukiwanie wygenerowanego artefaktu obrazu

### Orkiestracja pamięci

- przywołanie pamięci
- narzędzia pamięci w kontekście kanału
- awaryjny fallback pamięci
- ranking pamięci sesji
- izolacja pamięci wątku
- przebieg śnienia pamięci

### Integracja narzędzi i pluginów

- wywołanie MCP plugin-tools
- widoczność Skills
- hot install umiejętności
- natywne generowanie obrazów
- roundtrip obrazu
- rozumienie obrazu z załącznika

### Wieloturowe i wieloosobowe

- przekazanie do subagenta
- synteza fanout subagentów
- przepływy w stylu odzyskiwania po restarcie

Te kategorie są ważne, ponieważ wyznaczają wymagania DSL. Płaska lista promptów + oczekiwanego tekstu nie wystarczy.

## Kierunek

### Jedno źródło prawdy

Używać `qa/scenarios/index.md` oraz `qa/scenarios/*.md` jako redagowanego źródła
prawdy.

Pakiet powinien pozostać:

- czytelny dla człowieka w przeglądzie
- parsowalny maszynowo
- wystarczająco bogaty, by napędzać:
  - wykonywanie suite
  - bootstrap przestrzeni roboczej QA
  - metadane UI QA Lab
  - prompty dokumentacji/odkrywania
  - generowanie raportów

### Preferowany format redagowania

Używać Markdown jako formatu najwyższego poziomu, ze strukturalnym YAML wewnątrz.

Zalecany kształt:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - nadpisania modelu/dostawcy
  - wymagania wstępne
- sekcje opisowe
  - cel
  - uwagi
  - wskazówki debugowania
- ogrodzone bloki YAML
  - setup
  - steps
  - assertions
  - cleanup

Daje to:

- lepszą czytelność PR niż ogromny JSON
- bogatszy kontekst niż czysty YAML
- ścisłe parsowanie i walidację zod

Surowy JSON jest akceptowalny tylko jako pośrednia forma generowana.

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

# Objective

Verify generated media is reattached on the follow-up turn.

# Setup

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

# Steps

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

# Expect

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

## Możliwości runnera, które DSL musi obejmować

Na podstawie obecnego suite generyczny runner potrzebuje czegoś więcej niż wykonywania promptów.

### Akcje środowiskowe i konfiguracyjne

- `bus.reset`
- `gateway.waitHealthy`
- `channel.waitReady`
- `session.create`
- `thread.create`
- `workspace.writeSkill`

### Akcje tur agenta

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

### Akcje na plikach i artefaktach

- `file.write`
- `file.read`
- `file.delete`
- `file.touchTime`
- `artifact.captureGeneratedImage`
- `artifact.capturePath`

### Akcje pamięci i crona

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

## Zmienne i odwołania do artefaktów

DSL musi obsługiwać zapisane wyniki i późniejsze odwołania.

Przykłady z obecnego suite:

- utworzyć wątek, a potem ponownie użyć `threadId`
- utworzyć sesję, a potem ponownie użyć `sessionKey`
- wygenerować obraz, a następnie dołączyć plik w kolejnej turze
- wygenerować ciąg znacznika wybudzenia, a następnie sprawdzić, że pojawia się później

Potrzebne możliwości:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- typowane odwołania do ścieżek, kluczy sesji, identyfikatorów wątków, znaczników, wyników narzędzi

Bez obsługi zmiennych harness będzie dalej przeciekał logiką scenariuszy z powrotem do TypeScript.

## Co powinno pozostać furtkami awaryjnymi

W fazie 1 w pełni czysto deklaratywny runner nie jest realistyczny.

Niektóre scenariusze są z natury silnie orkiestracyjne:

- przebieg śnienia pamięci
- config apply restart wake-up
- config restart capability flip
- rozwiązywanie wygenerowanego artefaktu obrazu po znaczniku czasu/ścieżce
- ocena discovery-report

Na razie powinny używać jawnych niestandardowych handlerów.

Zalecana reguła:

- 85-90% deklaratywnie
- jawne kroki `customHandler` dla trudnej reszty
- tylko nazwane i udokumentowane niestandardowe handlery
- bez anonimowego kodu inline w pliku scenariusza

To utrzymuje generyczny silnik w czystości, a jednocześnie pozwala nadal robić postępy.

## Zmiana architektury

### Obecnie

Markdown scenariuszy jest już źródłem prawdy dla:

- wykonywania suite
- plików bootstrap przestrzeni roboczej
- katalogu scenariuszy UI QA Lab
- metadanych raportów
- promptów discovery

Wygenerowana zgodność:

- seedowana przestrzeń robocza nadal zawiera `QA_KICKOFF_TASK.md`
- seedowana przestrzeń robocza nadal zawiera `QA_SCENARIO_PLAN.md`
- seedowana przestrzeń robocza zawiera teraz także `QA_SCENARIOS.md`

## Plan refaktoryzacji

### Faza 1: loader i schemat

Gotowe.

- dodano `qa/scenarios/index.md`
- rozdzielono scenariusze do `qa/scenarios/*.md`
- dodano parser dla nazwanej zawartości pakietu Markdown YAML
- zwalidowano za pomocą zod
- przełączono konsumentów na sparsowany pakiet
- usunięto repozytoryjne `qa/seed-scenarios.json` oraz `qa/QA_KICKOFF_TASK.md`

### Faza 2: silnik generyczny

- podzielić `extensions/qa-lab/src/suite.ts` na:
  - loader
  - engine
  - rejestr akcji
  - rejestr asercji
  - niestandardowe handlery
- zachować istniejące funkcje pomocnicze jako operacje silnika

Rezultat:

- silnik wykonuje proste scenariusze deklaratywne

Zacząć od scenariuszy, które w większości sprowadzają się do prompt + wait + assert:

- wątkowana kontynuacja
- rozumienie obrazu z załącznika
- widoczność i wywoływanie umiejętności
- bazowy kanał

Rezultat:

- pierwsze rzeczywiste scenariusze zdefiniowane w Markdown dostarczane przez generyczny silnik

### Faza 4: migracja scenariuszy średniej trudności

- roundtrip generowania obrazu
- narzędzia pamięci w kontekście kanału
- ranking pamięci sesji
- przekazanie do subagenta
- synteza fanout subagentów

Rezultat:

- sprawdzone zmienne, artefakty, asercje narzędzi oraz asercje request-log

### Faza 5: pozostawić trudne scenariusze na niestandardowych handlerach

- przebieg śnienia pamięci
- config apply restart wake-up
- config restart capability flip
- dryf inwentarza runtime

Rezultat:

- ten sam format redagowania, ale z jawnymi blokami niestandardowych kroków tam, gdzie są potrzebne

### Faza 6: usunięcie zakodowanej na sztywno mapy scenariuszy

Gdy pokrycie pakietu będzie wystarczająco dobre:

- usunąć większość rozgałęzień TypeScript specyficznych dla scenariuszy z `extensions/qa-lab/src/suite.ts`

## Fake Slack / obsługa bogatych mediów

Obecna magistrala QA jest zorientowana głównie na tekst.

Istotne pliki:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Obecnie magistrala QA obsługuje:

- tekst
- reakcje
- wątki

Nie modeluje jeszcze osadzonych załączników multimedialnych.

### Potrzebny kontrakt transportowy

Dodać generyczny model załączników magistrali QA:

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

Następnie dodać `attachments?: QaBusAttachment[]` do:

- `QaBusMessage`
- `QaBusInboundMessageInput`
- `QaBusOutboundMessageInput`

### Dlaczego najpierw generycznie

Nie budować modelu mediów tylko dla Slack.

Zamiast tego:

- jeden generyczny model transportu QA
- wiele rendererów nad nim
  - obecny czat QA Lab
  - przyszły fake Slack web
  - wszelkie inne widoki fałszywego transportu

To zapobiega duplikacji logiki i pozwala scenariuszom multimedialnym pozostać niezależnymi od transportu.

### Potrzebne prace w UI

Zaktualizować UI QA, aby renderowało:

- podgląd obrazu inline
- odtwarzacz audio inline
- odtwarzacz wideo inline
- chip załącznika pliku

Obecne UI potrafi już renderować wątki i reakcje, więc renderowanie załączników powinno dać się nałożyć na ten sam model kart wiadomości.

### Prace nad scenariuszami odblokowane przez transport mediów

Gdy załączniki zaczną przepływać przez magistralę QA, będzie można dodać bogatsze scenariusze fałszywego czatu:

- odpowiedź z obrazem inline w fake Slack
- rozumienie załącznika audio
- rozumienie załącznika wideo
- mieszana kolejność załączników
- odpowiedź w wątku z zachowaniem mediów

## Rekomendacja

Kolejny etap implementacji powinien obejmować:

1. dodanie loadera scenariuszy Markdown + schematu zod
2. wygenerowanie obecnego katalogu z Markdown
3. najpierw migrację kilku prostych scenariuszy
4. dodanie generycznej obsługi załączników magistrali QA
5. renderowanie obrazu inline w UI QA
6. a potem rozszerzenie na audio i wideo

To najmniejsza ścieżka, która potwierdza oba cele:

- generyczne QA zdefiniowane w Markdown
- bogatsze fałszywe powierzchnie komunikacyjne

## Otwarte pytania

- czy pliki scenariuszy powinny pozwalać na osadzone szablony promptów Markdown z interpolacją zmiennych
- czy setup/cleanup powinny być nazwanymi sekcjami, czy tylko uporządkowanymi listami akcji
- czy odwołania do artefaktów powinny być silnie typowane w schemacie, czy oparte na ciągach znaków
- czy niestandardowe handlery powinny znajdować się w jednym rejestrze, czy w rejestrach per surface
- czy wygenerowany plik zgodności JSON powinien pozostać zatwierdzany w repozytorium podczas migracji
