---
read_when:
    - Debugowanie skryptów deweloperskich działających wyłącznie w Node lub awarii trybu obserwowania
    - Badanie awarii loadera tsx/esbuild w OpenClaw
summary: 'Node + tsx: notatki dotyczące awarii "__name is not a function" i obejścia'
title: Awaria Node + tsx
x-i18n:
    generated_at: "2026-05-06T17:55:14Z"
    model: gpt-5.5
    provider: openai
    source_hash: 808f04959c70c96c983fb2517234d4c06712049d7afebb9b1b4b340df75d7d70
    source_path: debug/node-issue.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Awaria Node + tsx „__name is not a function”

## Podsumowanie

Uruchamianie OpenClaw przez Node z `tsx` kończy się niepowodzeniem podczas startu:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Problem pojawił się po przełączeniu skryptów deweloperskich z Bun na `tsx` (commit `2871657e`, 2026-01-06). Ta sama ścieżka uruchomieniowa działała z Bun.

## Środowisko

- Node: v25.x (zaobserwowano na v25.3.0)
- tsx: 4.21.0
- System operacyjny: macOS (reprodukcja prawdopodobnie także na innych platformach uruchamiających Node 25)

## Reprodukcja (tylko Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Minimalna reprodukcja w repozytorium

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Sprawdzenie wersji Node

- Node 25.3.0: kończy się niepowodzeniem
- Node 22.22.0 (Homebrew `node@22`): kończy się niepowodzeniem
- Node 24: jeszcze nie zainstalowano tutaj; wymaga weryfikacji

## Notatki / hipoteza

- `tsx` używa esbuild do transformacji TS/ESM. `keepNames` w esbuild emituje helper `__name` i opakowuje definicje funkcji przez `__name(...)`.
- Awaria wskazuje, że `__name` istnieje, ale w czasie działania nie jest funkcją, co sugeruje, że helpera brakuje albo został nadpisany dla tego modułu w ścieżce loadera Node 25.
- Podobne problemy z helperem `__name` zgłaszano w innych narzędziach używających esbuild, gdy helpera brakowało albo był przepisywany.

## Historia regresji

- `2871657e` (2026-01-06): skrypty zmieniono z Bun na tsx, aby Bun był opcjonalny.
- Wcześniej (ścieżka Bun) `openclaw status` i `gateway:watch` działały.

## Obejścia

- Użyj Bun dla skryptów deweloperskich (obecne tymczasowe wycofanie).
- Użyj `tsgo` do sprawdzania typów w repozytorium, a następnie uruchom zbudowany wynik:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Uwaga historyczna: podczas debugowania tego problemu Node/tsx używano tutaj `tsc`, ale ścieżki sprawdzania typów w repozytorium używają teraz `tsgo`.
- Wyłącz esbuild keepNames w loaderze TS, jeśli to możliwe (zapobiega wstawianiu helpera `__name`); tsx obecnie tego nie udostępnia.
- Przetestuj Node LTS (22/24) z `tsx`, aby sprawdzić, czy problem jest specyficzny dla Node 25.

## Odnośniki

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Następne kroki

- Odtwórz na Node 22/24, aby potwierdzić regresję w Node 25.
- Przetestuj nightly `tsx` albo przypnij wcześniejszą wersję, jeśli istnieje znana regresja.
- Jeśli problem odtwarza się na Node LTS, zgłoś upstream minimalną reprodukcję ze śladem stosu `__name`.

## Powiązane

- [Instalacja Node.js](/pl/install/node)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
