---
read_when:
    - Debugowanie skryptów deweloperskich tylko dla Node lub awarii trybu watch
    - Badanie awarii loadera tsx/esbuild w OpenClaw
summary: Uwagi i obejścia dotyczące awarii Node + tsx "__name is not a function"
title: Awaria Node + tsx
x-i18n:
    generated_at: "2026-04-05T13:52:02Z"
    model: gpt-5.4
    provider: openai
    source_hash: f5beab7cdfe7679680f65176234a617293ce495886cfffb151518adfa61dc8dc
    source_path: debug/node-issue.md
    workflow: 15
---

# Awaria Node + tsx "\_\_name is not a function"

## Podsumowanie

Uruchamianie OpenClaw przez Node z `tsx` kończy się niepowodzeniem przy starcie z błędem:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Zaczęło się to po przełączeniu skryptów deweloperskich z Bun na `tsx` (commit `2871657e`, 2026-01-06). Ta sama ścieżka środowiska uruchomieniowego działała z Bun.

## Środowisko

- Node: v25.x (zaobserwowano na v25.3.0)
- tsx: 4.21.0
- OS: macOS (odtworzenie jest prawdopodobne także na innych platformach uruchamiających Node 25)

## Odtworzenie (tylko Node)

```bash
# in repo root
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Minimalne odtworzenie w repozytorium

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Sprawdzenie wersji Node

- Node 25.3.0: kończy się błędem
- Node 22.22.0 (Homebrew `node@22`): kończy się błędem
- Node 24: jeszcze nie zainstalowano tutaj; wymaga weryfikacji

## Uwagi / hipoteza

- `tsx` używa esbuild do transformacji TS/ESM. `keepNames` w esbuild emituje helper `__name` i opakowuje definicje funkcji przez `__name(...)`.
- Awaria wskazuje, że `__name` istnieje, ale nie jest funkcją w czasie działania, co oznacza, że helper dla tego modułu jest brakujący albo nadpisany w ścieżce loadera Node 25.
- Podobne problemy z helperem `__name` były zgłaszane u innych użytkowników esbuild, gdy helper jest brakujący lub przepisany.

## Historia regresji

- `2871657e` (2026-01-06): skrypty zmieniono z Bun na tsx, aby Bun był opcjonalny.
- Wcześniej (ścieżka Bun) `openclaw status` i `gateway:watch` działały.

## Obejścia

- Używaj Bun do skryptów deweloperskich (obecne tymczasowe cofnięcie).
- Używaj Node + tsc watch, a następnie uruchamiaj skompilowane wyjście:

  ```bash
  pnpm exec tsc --watch --preserveWatchOutput
  node --watch openclaw.mjs status
  ```

- Potwierdzono lokalnie: `pnpm exec tsc -p tsconfig.json` + `node openclaw.mjs status` działa na Node 25.
- Wyłącz `keepNames` esbuild w loaderze TS, jeśli to możliwe (zapobiega wstawianiu helpera `__name`); `tsx` obecnie tego nie udostępnia.
- Przetestuj Node LTS (22/24) z `tsx`, aby sprawdzić, czy problem jest specyficzny dla Node 25.

## Odwołania

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Następne kroki

- Odtwórz problem na Node 22/24, aby potwierdzić regresję Node 25.
- Przetestuj `tsx` nightly albo przypnij wcześniejszą wersję, jeśli istnieje znana regresja.
- Jeśli problem odtwarza się na Node LTS, zgłoś minimalne odtworzenie upstream z tracebackiem `__name`.
