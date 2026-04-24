---
read_when:
    - Debugowanie awarii skryptów deweloperskich tylko dla Node lub trybu watch
    - Badanie awarii loadera tsx/esbuild w OpenClaw
summary: Notatki o awarii Node + tsx „__name is not a function” i obejściach problemu
title: Awaria Node + tsx
x-i18n:
    generated_at: "2026-04-24T09:08:11Z"
    model: gpt-5.4
    provider: openai
    source_hash: 7d043466f71eae223fa568a3db82e424580ce3269ca11d0e84368beefc25bd25
    source_path: debug/node-issue.md
    workflow: 15
---

# Awaria Node + tsx „\_\_name is not a function”

## Podsumowanie

Uruchamianie OpenClaw przez Node z `tsx` kończy się błędem przy starcie:

```
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (.../src/logging/subsystem.ts:203:25)
    at .../src/agents/auth-profiles/constants.ts:25:20
```

Zaczęło się to po przełączeniu skryptów deweloperskich z Bun na `tsx` (commit `2871657e`, 2026-01-06). Ta sama ścieżka runtime działała z Bun.

## Środowisko

- Node: v25.x (zaobserwowano na v25.3.0)
- tsx: 4.21.0
- OS: macOS (reprodukcja prawdopodobna także na innych platformach uruchamiających Node 25)

## Reprodukcja (tylko Node)

```bash
# w katalogu głównym repo
node --version
pnpm install
node --import tsx src/entry.ts status
```

## Minimalna reprodukcja w repo

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

## Sprawdzenie wersji Node

- Node 25.3.0: kończy się błędem
- Node 22.22.0 (Homebrew `node@22`): kończy się błędem
- Node 24: nie jest tu jeszcze zainstalowany; wymaga weryfikacji

## Uwagi / hipoteza

- `tsx` używa esbuild do transformacji TS/ESM. `keepNames` w esbuild emituje helper `__name` i opakowuje definicje funkcji przez `__name(...)`.
- Błąd wskazuje, że `__name` istnieje, ale nie jest funkcją w runtime, co sugeruje brak helpera albo jego nadpisanie dla tego modułu w ścieżce loadera Node 25.
- Podobne problemy z helperem `__name` były zgłaszane w innych konsumentach esbuild, gdy helper był brakujący albo przepisany.

## Historia regresji

- `2871657e` (2026-01-06): skrypty zostały zmienione z Bun na tsx, aby Bun był opcjonalny.
- Wcześniej (ścieżka Bun) `openclaw status` i `gateway:watch` działały.

## Obejścia

- Używaj Bun dla skryptów deweloperskich (obecne tymczasowe cofnięcie).
- Użyj `tsgo` do sprawdzania typów w repo, a następnie uruchom zbudowane wyjście:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Uwaga historyczna: podczas debugowania tego problemu Node/tsx używano tutaj `tsc`, ale ścieżki sprawdzania typów w repo używają teraz `tsgo`.
- Jeśli to możliwe, wyłącz `keepNames` esbuild w loaderze TS (zapobiega wstawianiu helpera `__name`); tsx obecnie tego nie udostępnia.
- Przetestuj Node LTS (22/24) z `tsx`, aby sprawdzić, czy problem jest specyficzny dla Node 25.

## Referencje

- [https://opennext.js.org/cloudflare/howtos/keep_names](https://opennext.js.org/cloudflare/howtos/keep_names)
- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Następne kroki

- Zreprodukuj na Node 22/24, aby potwierdzić regresję Node 25.
- Przetestuj `tsx` nightly albo przypnij wcześniejszą wersję, jeśli istnieje znana regresja.
- Jeśli problem odtwarza się na Node LTS, zgłoś minimalną reprodukcję upstream z trace `__name`.

## Powiązane

- [Instalacja Node.js](/pl/install/node)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
