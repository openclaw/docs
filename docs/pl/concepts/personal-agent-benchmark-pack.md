---
read_when:
    - Uruchamianie lokalnych testów niezawodności osobistego agenta
    - Rozszerzanie katalogu scenariuszy kontroli jakości opartego na repozytorium
    - Weryfikowanie przypomnień, odpowiedzi, pamięci, redagowania, bezpiecznej kontynuacji użycia narzędzi, statusu zadań, diagnostyki bezpiecznej do udostępniania, popartych dowodami deklaracji ukończenia oraz odzyskiwania po awarii
summary: Lokalne scenariusze qa-channel do sprawdzania przepływów pracy asystenta osobistego z zachowaniem prywatności.
title: Pakiet testów porównawczych osobistego agenta
x-i18n:
    generated_at: "2026-07-12T14:59:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 35da45e4b22b1044a777fa8d6bce87f9ace377950dd0af3f2419b40cfe4d9be6
    source_path: concepts/personal-agent-benchmark-pack.md
    workflow: 16
---

Personal Agent Benchmark Pack to niewielki, oparty na repozytorium pakiet scenariuszy QA dla
lokalnych przepływów pracy osobistego asystenta. Nie jest to ogólny benchmark modelu i
nie wymaga nowego mechanizmu uruchamiającego: ponownie wykorzystuje prywatny stos QA ([omówienie QA](/pl/concepts/qa-e2e-automation)),
syntetyczny [kanał QA](/pl/channels/qa-channel) oraz istniejący
katalog YAML `qa/scenarios`.

## Scenariusze

Dziesięć scenariuszy zdefiniowanych w `qa/scenarios/personal/*.yaml`:

| Identyfikator scenariusza                   | Sprawdza                                                                                                      |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `personal-reminder-roundtrip`              | Fikcyjne osobiste przypomnienia dostarczane przez lokalny Cron                                                |
| `personal-channel-thread-reply`            | Kierowanie fikcyjnych wiadomości prywatnych i odpowiedzi w wątku przez `qa-channel`                           |
| `personal-memory-preference-recall`        | Fikcyjne odtwarzanie preferencji z tymczasowych plików pamięci obszaru roboczego QA                           |
| `personal-redaction-no-secret-leak`        | Sprawdzenie, czy fikcyjny sekret nie jest powtarzany                                                          |
| `personal-tool-safety-followthrough`       | Bezpieczna kontynuacja działania narzędzia oparta na odczycie po krótkiej interakcji przypominającej zgodę    |
| `personal-approval-denial-stop`            | Zatrzymanie działania po odmowie zgody na żądanie odczytu wrażliwych danych lokalnych                         |
| `personal-task-followthrough-status`       | Raportowanie stanu zadania oparte na dowodach, z rozróżnieniem stanów oczekującego, zablokowanego i ukończonego |
| `personal-share-safe-diagnostics-artifact` | Bezpieczne do udostępnienia artefakty diagnostyczne, zachowujące użyteczny stan bez surowych danych osobistych |
| `personal-no-fake-progress`                | Oparte na dowodach deklaracje ukończenia, które nie sugerują fałszywego postępu przed uzyskaniem lokalnych dowodów |
| `personal-failure-recovery`                | Odzyskiwanie po awarii, które raportuje częściowy stan i jasno określa granice ponawiania                     |

Metadane pakietu w formacie czytelnym maszynowo (lista identyfikatorów, tytuł, opis) znajdują się w
`extensions/qa-lab/src/scenario-packs.ts` jako `QA_PERSONAL_AGENT_SCENARIO_IDS`.
Uruchom pakiet za pomocą `--pack personal-agent`:

```bash
OPENCLAW_ENABLE_PRIVATE_QA_CLI=1 pnpm openclaw qa suite \
  --provider-mode mock-openai \
  --pack personal-agent \
  --concurrency 1
```

`--pack` działa addytywnie z powtarzanymi flagami `--scenario`. Jawnie wskazane scenariusze są uruchamiane
najpierw, a następnie scenariusze pakietu w kolejności określonej przez `QA_PERSONAL_AGENT_SCENARIO_IDS`,
po usunięciu duplikatów.

Pakiet jest przeznaczony dla `qa-channel` z `mock-openai` lub inną lokalną ścieżką dostawcy QA.
Nie kieruj go do usług czatu działających na żywo ani do prawdziwych kont osobistych.

## Model prywatności

Scenariusze używają wyłącznie fikcyjnych użytkowników, fikcyjnych preferencji, fikcyjnych sekretów oraz
tymczasowego obszaru roboczego Gateway QA utworzonego przez zestaw. Nie mogą odczytywać ani
zapisywać rzeczywistej pamięci użytkownika OpenClaw, sesji, danych uwierzytelniających, agentów uruchamiania, globalnych
konfiguracji ani stanu działającego Gateway.

Artefakty pozostają w istniejącym katalogu artefaktów zestawu QA i są traktowane
jak wyniki testów. Kontrole redakcji używają fikcyjnych znaczników, dzięki czemu awarie można bezpiecznie
analizować i zgłaszać w problemach.

## Rozszerzanie pakietu

Dodaj nowe przypadki `.yaml` w `qa/scenarios/personal/`, a następnie dodaj identyfikator scenariusza
do `QA_PERSONAL_AGENT_SCENARIO_IDS`. Każdy przypadek powinien być mały, lokalny, deterministyczny
w `mock-openai` i skupiony na jednym zachowaniu osobistego asystenta.

Dobrzy kandydaci do dalszego rozwoju: kontrole eksportu trajektorii z redakcją danych, kontrole
przepływów pracy Plugin działających wyłącznie lokalnie.

Unikaj dodawania nowego mechanizmu uruchamiającego, Plugin, zależności, transportu działającego na żywo lub modelu oceniającego,
dopóki katalog scenariuszy nie będzie zawierał wystarczającej liczby stabilnych przypadków uzasadniających taką powierzchnię.
