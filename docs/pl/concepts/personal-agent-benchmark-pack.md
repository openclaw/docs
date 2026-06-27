---
read_when:
    - Uruchamianie lokalnych kontroli niezawodności osobistego agenta
    - Rozszerzanie katalogu scenariuszy QA wspieranego przez repozytorium
    - Weryfikowanie przypomnienia, odpowiedzi, pamięci, redakcji, bezpiecznej kontynuacji narzędzi, statusu zadania, diagnostyki bezpiecznej do udostępniania, twierdzeń o ukończeniu popartych dowodami oraz odzyskiwania po awarii
summary: Lokalne scenariusze qa-channel do sprawdzania przepływów pracy asystenta osobistego z zachowaniem prywatności.
title: Pakiet benchmarków osobistego agenta
x-i18n:
    generated_at: "2026-06-27T17:28:21Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: a5a6b653abbba0718a6287d4e471435f15ef5823aa62abd238a14d955fdc1e5a
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Personal Agent Benchmark Pack to mały, wspierany przez repozytorium pakiet scenariuszy QA dla
lokalnych przepływów pracy osobistego asystenta. Nie jest to ogólny benchmark modeli i
nie wymaga nowego runnera. Pakiet ponownie używa prywatnego stosu QA opisanego w
[omówieniu QA](/pl/concepts/qa-e2e-automation), syntetycznego
[kanału QA](/pl/channels/qa-channel) oraz istniejącego katalogu YAML `qa/scenarios`.

Pierwszy pakiet jest celowo wąski:

- fikcyjne osobiste przypomnienia przez lokalne dostarczanie cron
- fikcyjne trasowanie DM i odpowiedzi w wątkach przez `qa-channel`
- fikcyjne przywoływanie preferencji z tymczasowych plików pamięci obszaru roboczego QA
- fikcyjne kontrole braku echa sekretów
- bezpieczna kontynuacja użycia narzędzia oparta na odczycie po krótkiej turze w stylu zatwierdzenia
- zachowanie zatrzymania po odmowie zatwierdzenia dla wrażliwego lokalnego żądania odczytu
- raportowanie statusu zadania oparte na dowodach, które oddziela oczekujące, zablokowane i ukończone
- artefakty diagnostyczne bezpieczne do udostępniania, które zachowują przydatny status, pomijając surową treść osobistą
- deklaracje ukończenia oparte na dowodach, które unikają fałszywego postępu przed pojawieniem się lokalnych dowodów
- odzyskiwanie po awarii, które raportuje częściowy status i utrzymuje jasne granice ponownych prób

## Scenariusze

Metadane pakietu czytelne maszynowo znajdują się w
`extensions/qa-lab/src/scenario-packs.ts`. Uruchom pakiet z
`--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` działa addytywnie z powtórzonymi flagami `--scenario`. Jawnie wskazane scenariusze uruchamiają się
najpierw, a potem scenariusze pakietu uruchamiają się w kolejności `QA_PERSONAL_AGENT_SCENARIO_IDS` z
usuniętymi duplikatami.

Pakiet jest zaprojektowany dla `qa-channel` z `mock-openai` albo inną lokalną ścieżką
dostawcy QA. Nie należy kierować go do usług czatu na żywo ani prawdziwych
kont osobistych.

## Model Prywatności

Scenariusze używają tylko fikcyjnych użytkowników, fikcyjnych preferencji, fikcyjnych sekretów i
tymczasowego obszaru roboczego Gateway QA tworzonego przez zestaw. Nie mogą odczytywać ani zapisywać
prawdziwej pamięci użytkownika OpenClaw, sesji, poświadczeń, agentów uruchamiania, konfiguracji globalnych
ani stanu Gateway na żywo.

Artefakty pozostają w istniejącym katalogu artefaktów zestawu QA i należy je
traktować jak wynik testów. Kontrole redakcji używają fikcyjnych markerów, więc awarie można bezpiecznie
sprawdzać i zgłaszać w issue.

## Rozszerzanie Pakietu

Dodaj nowe przypadki `.yaml` w `qa/scenarios/personal/`, a następnie dodaj identyfikator scenariusza
do `QA_PERSONAL_AGENT_SCENARIO_IDS`. Każdy przypadek powinien być mały, lokalny, deterministyczny
w `mock-openai` i skupiony na jednym zachowaniu osobistego asystenta.

Dobre kandydatury do dalszych prac:

- kontrole eksportu trajektorii z redakcją
- kontrole przepływów pracy Plugin wyłącznie lokalnych

Unikaj dodawania nowego runnera, Plugin, zależności, transportu na żywo lub sędziego modelu,
dopóki katalog scenariuszy nie będzie miał wystarczająco wielu stabilnych przypadków, aby uzasadnić taką powierzchnię.
