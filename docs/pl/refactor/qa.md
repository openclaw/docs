---
x-i18n:
    generated_at: "2026-04-18T09:35:21Z"
    model: gpt-5.4
    provider: openai
    source_hash: dbb2c70c82da7f6f12d90e25666635ff4147c52e8a94135e902d1de4f5cbccca
    source_path: refactor/qa.md
    workflow: 15
---

# Refaktoryzacja QA

Status: migracja fundamentalna została wdrożona.

## Cel

Przenieść QA OpenClaw z modelu rozdzielonych definicji do jednego źródła prawdy dla:

- metadanych scenariusza
- promptów wysyłanych do modelu
- konfiguracji i teardown
- logiki harnessu
- asercji i kryteriów sukcesu
- artefaktów i wskazówek do raportów

Pożądanym stanem końcowym jest generyczny harness QA, który ładuje rozbudowane pliki definicji scenariuszy zamiast hardcodować większość zachowań w TypeScript.

## Stan obecny

Główne źródło prawdy znajduje się teraz w `qa/scenarios/index.md` oraz po jednym pliku na
scenariusz w `qa/scenarios/<theme>/*.md`.

Wdrożone:

- `qa/scenarios/index.md`
  - kanoniczne metadane pakietu QA
  - tożsamość operatora
  - misja startowa
- `qa/scenarios/<theme>/*.md`
  - jeden plik markdown na scenariusz
  - metadane scenariusza
  - powiązania handlerów
  - konfiguracja wykonania specyficzna dla scenariusza
- `extensions/qa-lab/src/scenario-catalog.ts`
  - parser pakietu markdown + walidacja zod
- `extensions/qa-lab/src/qa-agent-bootstrap.ts`
  - renderowanie planu z pakietu markdown
- `extensions/qa-lab/src/qa-agent-workspace.ts`
  - seeduje wygenerowane pliki zgodności oraz `QA_SCENARIOS.md`
- `extensions/qa-lab/src/suite.ts`
  - wybiera wykonywalne scenariusze przez powiązania handlerów zdefiniowane w markdown
- protokół magistrali QA + UI
  - generyczne załączniki inline do renderowania obrazów/wideo/audio/plików

Pozostałe rozdzielone powierzchnie:

- `extensions/qa-lab/src/suite.ts`
  - nadal zawiera większość wykonywalnej logiki niestandardowych handlerów
- `extensions/qa-lab/src/report.ts`
  - nadal wyprowadza strukturę raportu z wyników runtime

Rozdzielenie źródła prawdy zostało więc naprawione, ale wykonanie nadal jest w większości oparte na handlerach, a nie w pełni deklaratywne.

## Jak wygląda rzeczywista powierzchnia scenariuszy

Odczyt bieżącego suite pokazuje kilka odrębnych klas scenariuszy.

### Prosta interakcja

- bazowy kanał
- bazowy DM
- dalszy ciąg w wątku
- przełączanie modelu
- doprowadzenie zatwierdzenia do końca
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

### Integracja narzędzi i Plugin

- MCP plugin-tools call
- skill visibility
- skill hot install
- native image generation
- image roundtrip
- image understanding from attachment

### Wiele tur i wielu aktorów

- subagent handoff
- subagent fanout synthesis
- flows w stylu restart recovery

Te kategorie mają znaczenie, ponieważ determinują wymagania DSL. Płaska lista prompt + oczekiwany tekst nie wystarczy.

## Kierunek

### Jedno źródło prawdy

Używaj `qa/scenarios/index.md` oraz `qa/scenarios/<theme>/*.md` jako autorskiego
źródła prawdy.

Pakiet powinien pozostać:

- czytelny dla człowieka w review
- parsowalny maszynowo
- wystarczająco bogaty, aby obsługiwać:
  - wykonanie suite
  - bootstrap obszaru roboczego QA
  - metadane UI QA Lab
  - prompty docs/discovery
  - generowanie raportów

### Preferowany format autorski

Używaj markdown jako formatu najwyższego poziomu, ze strukturalnym YAML w środku.

Zalecany kształt:

- YAML frontmatter
  - id
  - title
  - surface
  - tags
  - docs refs
  - code refs
  - model/provider overrides
  - prerequisites
- sekcje prozy
  - objective
  - notes
  - debugging hints
- ogrodzone bloki YAML
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

Na podstawie bieżącego suite generyczny runner potrzebuje więcej niż wykonywania promptów.

### Akcje środowiska i konfiguracji

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

## Zmienne i referencje do artefaktów

DSL musi obsługiwać zapisane wyjścia i późniejsze referencje.

Przykłady z bieżącego suite:

- utworzyć wątek, a następnie ponownie użyć `threadId`
- utworzyć sesję, a następnie ponownie użyć `sessionKey`
- wygenerować obraz, a następnie dołączyć plik w następnej turze
- wygenerować ciąg wake marker, a następnie sprawdzić, czy pojawi się później

Potrzebne możliwości:

- `saveAs`
- `${vars.name}`
- `${artifacts.name}`
- typowane referencje dla ścieżek, kluczy sesji, identyfikatorów wątków, markerów, wyjść narzędzi

Bez obsługi zmiennych harness będzie nadal wypychał logikę scenariuszy z powrotem do TypeScript.

## Co powinno pozostać jako escape hatches

W pełni czysto deklaratywny runner nie jest realistyczny w fazie 1.

Niektóre scenariusze z natury wymagają cięższej orkiestracji:

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- generated image artifact resolution by timestamp/path
- discovery-report evaluation

Na razie powinny one używać jawnych niestandardowych handlerów.

Zalecana zasada:

- 85-90% deklaratywnie
- jawne kroki `customHandler` dla trudnej pozostałości
- tylko nazwane i udokumentowane custom handlery
- brak anonimowego kodu inline w pliku scenariusza

To utrzymuje generyczny silnik w czystości, a jednocześnie pozwala iść naprzód.

## Zmiana architektury

### Obecnie

Markdown scenariusza jest już źródłem prawdy dla:

- wykonania suite
- plików bootstrap obszaru roboczego
- katalogu scenariuszy UI QA Lab
- metadanych raportów
- promptów discovery

Wygenerowana zgodność:

- seedowany obszar roboczy nadal zawiera `QA_KICKOFF_TASK.md`
- seedowany obszar roboczy nadal zawiera `QA_SCENARIO_PLAN.md`
- seedowany obszar roboczy zawiera teraz także `QA_SCENARIOS.md`

## Plan refaktoryzacji

### Faza 1: loader i schemat

Gotowe.

- dodano `qa/scenarios/index.md`
- rozdzielono scenariusze do `qa/scenarios/<theme>/*.md`
- dodano parser nazwanej zawartości pakietu markdown YAML
- zwalidowano za pomocą zod
- przełączono konsumentów na sparsowany pakiet
- usunięto repo-level `qa/seed-scenarios.json` oraz `qa/QA_KICKOFF_TASK.md`

### Faza 2: generyczny silnik

- rozdziel `extensions/qa-lab/src/suite.ts` na:
  - loader
  - silnik
  - rejestr akcji
  - rejestr asercji
  - custom handlery
- zachowaj istniejące funkcje pomocnicze jako operacje silnika

Rezultat:

- silnik wykonuje proste scenariusze deklaratywne

Zacznij od scenariuszy, które są głównie prompt + wait + assert:

- threaded follow-up
- image understanding from attachment
- skill visibility and invocation
- channel baseline

Rezultat:

- pierwsze rzeczywiste scenariusze zdefiniowane w markdown dostarczane przez generyczny silnik

### Faza 4: migracja scenariuszy średniej trudności

- image generation roundtrip
- memory tools in channel context
- session memory ranking
- subagent handoff
- subagent fanout synthesis

Rezultat:

- udowodnione zmienne, artefakty, asercje narzędzi i asercje request-log

### Faza 5: pozostawienie trudnych scenariuszy na custom handlerach

- memory dreaming sweep
- config apply restart wake-up
- config restart capability flip
- runtime inventory drift

Rezultat:

- ten sam format autorski, ale z jawnymi blokami custom-step tam, gdzie to potrzebne

### Faza 6: usunięcie hardcodowanej mapy scenariuszy

Gdy pokrycie pakietu będzie wystarczająco dobre:

- usuń większość branchingu TypeScript specyficznego dla scenariuszy z `extensions/qa-lab/src/suite.ts`

## Obsługa fake Slack / rich media

Obecna magistrala QA jest zorientowana przede wszystkim na tekst.

Istotne pliki:

- `extensions/qa-channel/src/protocol.ts`
- `extensions/qa-lab/src/bus-state.ts`
- `extensions/qa-lab/src/bus-queries.ts`
- `extensions/qa-lab/src/bus-server.ts`
- `extensions/qa-lab/web/src/ui-render.ts`

Dziś magistrala QA obsługuje:

- tekst
- reakcje
- wątki

Nie modeluje jeszcze załączników multimedialnych inline.

### Potrzebny kontrakt transportowy

Dodaj generyczny model załączników magistrali QA:

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

### Dlaczego najpierw generycznie

Nie buduj modelu mediów tylko dla Slack.

Zamiast tego:

- jeden generyczny model transportu QA
- wiele rendererów nad nim
  - bieżący czat QA Lab
  - przyszły web fake Slack
  - dowolne inne widoki fałszywego transportu

To zapobiega duplikacji logiki i pozwala scenariuszom multimedialnym pozostać niezależnymi od transportu.

### Potrzebne prace w UI

Zaktualizuj UI QA, aby renderować:

- podgląd obrazu inline
- odtwarzacz audio inline
- odtwarzacz wideo inline
- chip załącznika pliku

Obecne UI potrafi już renderować wątki i reakcje, więc renderowanie załączników powinno zostać dołożone do tego samego modelu karty wiadomości.

### Prace nad scenariuszami odblokowane przez transport multimediów

Gdy załączniki będą przepływać przez magistralę QA, będzie można dodać bogatsze scenariusze fake-chat:

- odpowiedź z obrazem inline w fake Slack
- rozumienie załącznika audio
- rozumienie załącznika wideo
- mieszana kolejność załączników
- odpowiedź w wątku z zachowaniem mediów

## Rekomendacja

Następny fragment implementacji powinien obejmować:

1. dodanie loadera scenariuszy markdown + schematu zod
2. generowanie bieżącego katalogu z markdown
3. najpierw migrację kilku prostych scenariuszy
4. dodanie generycznej obsługi załączników magistrali QA
5. renderowanie obrazu inline w UI QA
6. następnie rozszerzenie na audio i wideo

To najmniejsza ścieżka, która potwierdza oba cele:

- generyczne QA definiowane w markdown
- bogatsze fałszywe powierzchnie komunikacyjne

## Otwarte pytania

- czy pliki scenariuszy powinny pozwalać na osadzone szablony promptów w markdown z interpolacją zmiennych
- czy setup/cleanup powinny być nazwanymi sekcjami, czy po prostu uporządkowanymi listami akcji
- czy referencje do artefaktów powinny być silnie typowane w schemacie, czy oparte na stringach
- czy custom handlery powinny znajdować się w jednym rejestrze, czy w rejestrach per surface
- czy wygenerowany plik zgodności JSON powinien pozostać commitowany w trakcie migracji
