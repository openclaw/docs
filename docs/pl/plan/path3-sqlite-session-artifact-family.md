---
read_when:
    - Implementujesz clawdbot-d63.2 / clawdbot-04b
    - Modyfikujesz retencję, resetowanie lub usuwanie sesji SQLite albo archiwizację przy usuwaniu agenta
    - Należy odróżnić rodziny artefaktów z ery SQLite od starszych plików pomocniczych JSONL
summary: Plan ścieżki 3 dotyczący archiwizacji wszystkich artefaktów transkrypcji SQLite należących do sesji
title: Ścieżka 3 — rodzina artefaktów sesji SQLite
x-i18n:
    generated_at: "2026-07-16T18:47:02Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: adb2c31293ab63cb80449d037600d78fbb228e91f380d1ccaf15fb00728a9057
    source_path: plan/path3-sqlite-session-artifact-family.md
    workflow: 16
---

# Ścieżka 3: rodzina artefaktów sesji SQLite

Ta notatka określa zakres `clawdbot-d63.2`, natomiast `clawdbot-d63.1` odpowiada za nakładający się
pomocnik archiwizacji resetowania/usuwania w `src/config/sessions/session-accessor.sqlite.ts`.
Plik implementacji zawierał niezapisane zmiany podczas tej iteracji, dlatego ten artefakt dokumentuje
dokładny kontrakt i punkty poprawek bez powodowania konfliktu z pracą równoległego procesu.

## Rodzina miarodajna

Po przejściu na SQLite aktywne transkrypcje sesji są wierszami SQLite. Rodzina
archiwizacyjna sesji obejmuje:

- Wiersze `transcript_events`, `transcript_event_identities` i `sessions`
  dla bieżącego `sessionId` wpisu.
- Ten sam zestaw wierszy transkrypcji SQLite dla każdego `sessionId`, do którego odwołuje się
  `entry.compactionCheckpoints[*].preCompaction.sessionId`.
- Ten sam zestaw wierszy transkrypcji SQLite dla każdego `sessionId`, do którego odwołuje się
  `entry.compactionCheckpoints[*].postCompaction.sessionId`.
- Ten sam zestaw wierszy transkrypcji SQLite dla każdego `sessionId` w
  `entry.usageFamilySessionIds`.

Należy archiwizować tylko wiersze, do których nie odwołuje się już żaden pozostały
wiersz `session_entries` ani metadane Compaction lub rodziny użycia żadnego pozostałego
wpisu. Pozwala to zachować stan rozgałęziania/przywracania punktów kontrolnych i agregacji użycia do czasu
usunięcia ostatniego aktywnego odwołania.

## Artefakty spoza rodziny po przejściu

Wygenerowane warianty plików transkrypcji tematów i pliki poboczne trajektorii nie są aktywnym
stanem środowiska uruchomieniowego SQLite. Są to starsze artefakty plikowe:

- Warianty tematów, takie jak `<sessionId>-topic-<thread>.jsonl`, istnieją tylko dla
  formatu transkrypcji opartego na plikach. SQLite używa kanonicznego identyfikatora sesji oraz
  metadanych dostarczania `session_routes`/wpisu zamiast plików JSONL dla poszczególnych tematów.
- Pliki poboczne trajektorii, takie jak `.trajectory.jsonl` i `.trajectory-path.json`,
  otrzymują nazwy na podstawie rzeczywistych ścieżek JSONL `sessionFile`. Wartości SQLite `sessionFile` są
  znacznikami `sqlite:<agentId>:<sessionId>:<storePath>` i nie wskazują plików
  pobocznych.
- Czytniki warstwy archiwum muszą nadal odczytywać starsze zarchiwizowane pliki JSONL, ale
  mechanizm przechowywania w środowisku uruchomieniowym nie może skanować katalogów aktywnych sesji ani ponownie otwierać plików
  transkrypcji JSONL dla sesji SQLite.

Import narzędzia Doctor pozostaje właścicielem migracji starszych podstawowych plików JSONL i
sąsiadujących z nimi plików pobocznych trajektorii. Mechanizm przechowywania SQLite w środowisku uruchomieniowym nie powinien dodawać
drugiego importera ani mechanizmu awaryjnego opartego na plikach.

## Punkty poprawek

Należy rozszerzyć pomocnik archiwizacji SQLite wprowadzony przez `clawdbot-d63.1`, zamiast
dodawać równoległą ścieżkę.

1. Dodać lokalny kolektor w pobliżu `deleteSqliteSessionStateIfUnreferenced`:
   - `collectSqliteSessionArtifactFamily(entry: SessionEntry): Set<string>`
   - Uwzględnić `entry.sessionId`, identyfikatory sesji przed punktem kontrolnym i po nim oraz
     `usageFamilySessionIds`.
   - Odfiltrować puste ciągi i deterministycznie usunąć duplikaty.

2. Dodać kolektor odwołań dla magazynu po usunięciu:
   - `readReferencedSqliteSessionArtifactFamilyIds(database): Set<string>`
   - Przejść przez bieżące `session_entries`, przeanalizować każde `entry_json` i zebrać
     te same identyfikatory rodziny ze wszystkich zachowanych wpisów.

3. Zmienić wywołania resetowania/usuwania/konserwacji, które obecnie archiwizują jeden
   usunięty `sessionId`, tak aby przekazywały pełną rodzinę usuniętego wpisu.

4. Dla każdego identyfikatora rodziny zarchiwizować wiersze transkrypcji SQLite z powodem podanym przez wywołującego
   (`reset` lub `deleted`), a następnie usunąć wiersz `sessions` tylko wtedy, gdy
   identyfikator rodziny nie występuje w zestawie odwołań po usunięciu.

5. Usuwanie zdarzeń transkrypcji pozostawić scentralizowane w istniejącej ścieżce
   czyszczenia wierszy sesji SQLite. Nie dodawać odczytów aktywnych plików JSONL.

## Testy ukierunkowane

Dodać testy dotyczące wyłącznie SQLite do `src/config/sessions/session-accessor.conformance.test.ts`
lub równoległego testu cyklu życia po zatwierdzeniu zmian przez `clawdbot-d63.1`:

- Usunięcie wpisu z transkrypcją sprzed Compaction archiwizuje zarówno bieżącą
  sesję, jak i sesję sprzed Compaction, a następnie usuwa oba zestawy wierszy SQLite.
- Usunięcie jednego z dwóch wpisów współdzielących sesję sprzed Compaction nie archiwizuje
  niczego dla współdzielonej wcześniejszej sesji, dopóki nie zostanie usunięty ostatni odwołujący się
  wpis.
- Usunięcie wpisu z `usageFamilySessionIds` archiwizuje wiersze transkrypcji SQLite
  poprzednika, gdy żaden inny wpis nie odwołuje się do tej rodziny użycia.
- Klucz sesji o strukturze tematu ze znacznikiem SQLite nie powoduje odczytu żadnego wygenerowanego
  pliku JSONL tematu ani wyszukiwania pliku pobocznego.

Weryfikacja ukierunkowana powinna używać:

```bash
node scripts/run-vitest.mjs src/config/sessions/session-accessor.conformance.test.ts
```

Jeśli ostateczne testy znajdą się w `store.session-lifecycle-mutation.test.ts`, należy uruchomić ten
plik jawnie przy użyciu tego samego skryptu opakowującego. Szerokie bramki `pnpm` powinny pozostać w
Crabbox/Testbox dla tego drzewa roboczego Codex.
