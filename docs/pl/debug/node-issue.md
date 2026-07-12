---
read_when:
    - Badanie awarii modułu ładującego tsx/esbuild, która informuje o brakującym helperze __name
summary: Historyczna awaria Node + tsx „__name is not a function” i jej przyczyna
title: Awaria Node + tsx
x-i18n:
    generated_at: "2026-07-12T15:07:41Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 97d2f62d24860cee65753027ba84c14c8d4ffb910ee17bb0032cf0409c427589
    source_path: debug/node-issue.md
    workflow: 16
---

# Awaria Node + tsx „\_\_name is not a function”

## Stan

Rozwiązano. Ta awaria nie występuje w obecnej wersji `tsx` przypiętej w
`package.json` (`4.22.3`) ani w aktualnych wydaniach Node. Zachowano tę stronę na wypadek,
gdyby przyszła aktualizacja `tsx`/esbuild ponownie wprowadziła ten problem.

## Pierwotny objaw

Uruchamianie skryptów deweloperskich OpenClaw za pośrednictwem `tsx` kończyło się niepowodzeniem podczas uruchamiania:

```text
[openclaw] Failed to start CLI: TypeError: __name is not a function
    at createSubsystemLogger (src/logging/subsystem.ts)
    at <caller> (src/agents/auth-profiles/constants.ts)
```

Numery wierszy pominięto; oba pliki zmieniły się od czasu pierwotnej awarii
i konkretne wiersze już się nie zgadzają.

Problem pojawił się po przejściu skryptów deweloperskich z Bun na `tsx` (`2871657e`,
2026-01-06), aby Bun stał się opcjonalny. Odpowiednia ścieżka oparta na Bun nie ulegała awarii.
Problem pierwotnie zaobserwowano w Node v25.3.0 na macOS; uznano, że może on również
dotyczyć innych platform korzystających z Node 25.

## Przyczyna

`tsx` przekształca TS/ESM za pośrednictwem esbuild z ustawieniem `keepNames: true` zakodowanym na stałe
w opcjach transformacji. To ustawienie powoduje, że esbuild opakowuje nazwane deklaracje funkcji/klas
w wywołanie funkcji pomocniczej `__name`, dzięki czemu `fn.name` zostaje zachowane podczas minifikacji
i pakowania. Awaria oznacza, że w dotkniętej kombinacji `tsx`/Node funkcja pomocnicza
była niedostępna lub przesłonięta w miejscu wywołania tego modułu, dlatego `__name(...)`
zgłaszało wyjątek zamiast zwracać opakowaną wartość.

## Obecna kontrola reprodukcji

```bash
node --version
pnpm install
node --import tsx src/entry.ts status
```

Minimalna izolowana reprodukcja (ładuje tylko moduł z pierwotnego śladu stosu):

```bash
node --import tsx scripts/repro/tsx-name-repro.ts
```

Oba polecenia kończą się obecnie bez błędów. Jeśli którekolwiek z nich ponownie zgłosi
`__name is not a function`, przed zgłoszeniem problemu w projekcie nadrzędnym zapisz dokładną wersję Node, wersję `tsx`
(`node_modules/tsx/package.json`) oraz pełny ślad stosu.

## Obejścia (jeśli awaria powróci)

- Uruchamiaj skrypty deweloperskie za pomocą Bun zamiast `node --import tsx`.
- Uruchom `pnpm tsgo`, aby sprawdzić typy, a następnie uruchom zbudowany wynik zamiast
  kodu źródłowego za pośrednictwem `tsx`:

  ```bash
  pnpm tsgo
  node openclaw.mjs status
  ```

- Wypróbuj inną wersję `tsx` (`pnpm add -D tsx@<version>` zmienia zależności
  i zgodnie z zasadami repozytorium wymaga zatwierdzenia), aby metodą bisekcji ustalić, czy dołączona
  wersja esbuild ponownie wprowadziła błąd.
- Przetestuj inną główną/poboczną wersję Node, aby sprawdzić, czy awaria jest zależna
  od wersji.

## Materiały referencyjne

- [https://esbuild.github.io/api/#keep-names](https://esbuild.github.io/api/#keep-names)
- [https://github.com/evanw/esbuild/issues/1031](https://github.com/evanw/esbuild/issues/1031)

## Powiązane

- [Instalacja Node.js](/pl/install/node)
- [Rozwiązywanie problemów z Gateway](/pl/gateway/troubleshooting)
