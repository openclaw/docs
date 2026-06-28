---
read_when:
    - Przenoszenie odpowiedzialności za hosta Canvas, narzędzia, polecenia, dokumentację lub protokół
    - Audyt tego, czy Canvas nadal należy do rdzenia
    - Przygotowywanie lub recenzowanie eksperymentalnego PR-a Plugin Canvas
summary: Plan i lista kontrolna audytu przeniesienia Canvas z rdzenia jako dołączony eksperymentalny Plugin.
title: Refaktoryzacja Pluginu Canvas
x-i18n:
    generated_at: "2026-05-07T13:25:11Z"
    model: gpt-5.5
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
    postprocess_version: locale-links-v1
---

# Refaktoryzacja Plugin Canvas

Canvas jest mało używany i eksperymentalny. Traktuj go jako dołączony Plugin, a nie funkcję rdzenia. Rdzeń może zachować ogólną obsługę Gateway, Node, HTTP, uwierzytelniania, konfiguracji i natywnego klienta, ale zachowanie specyficzne dla Canvas powinno znajdować się w `extensions/canvas`.

## Cel

Przenieść własność Canvas do `extensions/canvas`, zachowując obecne zachowanie sparowanego węzła:

- narzędzie `canvas` przeznaczone dla agenta jest rejestrowane przez Plugin Canvas
- polecenia węzła Canvas są dozwolone tylko wtedy, gdy Plugin Canvas je rejestruje
- pliki hosta/źródłowe A2UI znajdują się w Plugin Canvas
- materializacja dokumentów Canvas znajduje się w Plugin Canvas
- implementacja polecenia CLI znajduje się w Plugin Canvas albo deleguje przez należący do Plugin barrel środowiska uruchomieniowego
- dokumentacja i inwentarz Plugin opisują Canvas jako eksperymentalny i oparty na Plugin

## Poza zakresem

- Nie przeprojektowuj natywnego interfejsu Canvas w tej refaktoryzacji.
- Nie usuwaj obsługi protokołu/klienta Canvas z iOS, Androida ani macOS, chyba że osobna decyzja produktowa mówi, że Canvas należy usunąć.
- Nie buduj szerokiej platformy usług Plugin tylko dla Canvas, chyba że co najmniej jeden inny dołączony Plugin potrzebuje tego samego punktu integracji.

## Obecny stan gałęzi

Zrobione:

- Dodano pakiet dołączonego Plugin w `extensions/canvas`.
- Dodano `extensions/canvas/openclaw.plugin.json`.
- Przeniesiono narzędzie agenta `canvas` z `src/agents/tools/canvas-tool.ts` do `extensions/canvas/src/tool.ts`.
- Usunięto rejestrację rdzeniową `createCanvasTool` z `src/agents/openclaw-tools.ts`.
- Przeniesiono implementację hosta Canvas z `src/canvas-host` do `extensions/canvas/src/host`.
- Zachowano `extensions/canvas/runtime-api.ts` jako należący do Plugin barrel zgodności dla testów, pakowania i zewnętrznych publicznych helperów Canvas.
- Przeniesiono materializację dokumentów Canvas z `src/gateway/canvas-documents.ts` do `extensions/canvas/src/documents.ts`.
- Przeniesiono implementację CLI Canvas i helpery JSONL A2UI do `extensions/canvas/src/cli.ts`.
- Przeniesiono URL hosta Canvas i helpery ograniczonych capability do `extensions/canvas/src`.
- Przeniesiono domyślne polecenia węzła Canvas z zakodowanych na stałe list rdzenia do Plugin `nodeInvokePolicies`.
- Dodano należącą do Plugin konfigurację hosta Canvas w `plugins.entries.canvas.config.host`.
- Przeniesiono serwowanie HTTP Canvas i A2UI za rejestrację tras HTTP Plugin Canvas.
- Dodano ogólne przekazywanie upgrade WebSocket Plugin dla należących do Plugin tras HTTP.
- Zastąpiono specyficzne dla Canvas uwierzytelnianie URL hosta Gateway i capability węzła ogólną powierzchnią hostowanego Plugin oraz helperami capability węzła.
- Dodano należące do Plugin resolvery hostowanych mediów, aby adresy URL dokumentów Canvas były rozwiązywane przez Plugin Canvas zamiast importowania przez rdzeń wewnętrznych części dokumentów Canvas.
- Dodano `api.registerNodeCliFeature(...)`, aby Canvas mógł deklarować `openclaw nodes canvas` jako należącą do Plugin funkcję węzła bez ręcznego wypisywania ścieżki polecenia nadrzędnego.
- Usunięto produkcyjne importy `src/**` z `extensions/canvas/runtime-api.js`.
- Przeniesiono źródło pakietu A2UI z `apps/shared/OpenClawKit/Tools/CanvasA2UI` do `extensions/canvas/src/host/a2ui-app`.
- Przeniesiono implementację budowania/kopiowania A2UI pod `extensions/canvas/scripts` i zastąpiono główne powiązanie budowania ogólnymi hookami zasobów dołączonych Plugin.
- Usunięto alias starszej konfiguracji najwyższego poziomu `canvasHost` z runtime.
- Zachowano migrację doctor dla Canvas, aby `openclaw doctor --fix` przepisywało stare konfiguracje `canvasHost` do `plugins.entries.canvas.config.host`.
- Usunięto zgodność starego protokołu Canvas agenta za Gateway protocol v4. Natywni klienci i Gateway używają teraz wyłącznie `pluginSurfaceUrls.canvas` oraz `node.pluginSurface.refresh`; przestarzałe ścieżki `canvasHostUrl`, `canvasCapability` i `node.canvas.capability.refresh` są celowo nieobsługiwane w tej eksperymentalnej refaktoryzacji.
- Zaktualizowano wygenerowany inwentarz Plugin, aby uwzględniał Canvas.
- Dodano dokumentację referencyjną Plugin w `docs/plugins/reference/canvas.md`.

Znane pozostałe powierzchnie Canvas należące do rdzenia:

- Handlery Canvas natywnej aplikacji pod `apps/` nadal celowo używają powierzchni Plugin Canvas
- handlery protokołu/klienta Canvas natywnej aplikacji pod `apps/`
- wyjście publikowanego artefaktu nadal używa `dist/canvas-host/a2ui` dla zgodnego wstecznie wyszukiwania runtime, ale krok kopiowania należy teraz do Plugin

## Docelowy kształt

`extensions/canvas` powinno posiadać:

- manifest Plugin i metadane pakietu
- rejestrację narzędzia agenta
- politykę poleceń wywołań węzła
- host Canvas i runtime A2UI
- źródło pakietu Canvas A2UI oraz skrypty budowania/kopiowania zasobów
- tworzenie dokumentów Canvas i rozwiązywanie zasobów
- implementację CLI Canvas
- stronę dokumentacji Canvas i wpis w inwentarzu Plugin

Rdzeń powinien posiadać tylko ogólne punkty integracji:

- wykrywanie i rejestrację Plugin
- ogólny rejestr narzędzi agenta
- ogólny rejestr polityk wywołań węzła
- ogólne HTTP/uwierzytelnianie Gateway i przekazywanie upgrade WebSocket
- ogólne rozwiązywanie URL powierzchni hostowanego Plugin
- ogólną rejestrację resolvera hostowanych mediów
- ogólny transport capability węzła
- ogólne okablowanie konfiguracji
- ogólne wykrywanie hooków zasobów dołączonych Plugin

Natywne aplikacje mogą zachować handlery poleceń Canvas jako klienci protokołu. Nie są właścicielem runtime Plugin.

## Kroki migracji

1. Traktuj `plugins.entries.canvas.config.host` jako należącą do Plugin powierzchnię konfiguracji.
2. Zaktualizuj dokumentację, aby Canvas był opisany jako eksperymentalny dołączony Plugin.
3. Uruchom ukierunkowane testy Canvas, sprawdzenia inwentarza Plugin, sprawdzenia API Plugin SDK oraz bramki build/type, na które wpływają granice runtime.

## Lista kontrolna audytu

Przed uznaniem refaktoryzacji za ukończoną:

- `rg "src/canvas-host|../canvas-host"` nie zwraca żadnych aktywnych importów źródłowych.
- `rg "canvas-tool|createCanvasTool" src` nie znajduje należącej do rdzenia implementacji narzędzia Canvas.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` nie znajduje zakodowanych na stałe domyślnych list dozwolonych poza ogólnymi testami polityk Plugin.
- `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` jest puste.
- `rg "canvas-documents" src` jest puste.
- `rg "registerNodesCanvasCommands|nodes-canvas" src` jest puste; Plugin Canvas rejestruje `openclaw nodes canvas` przez zagnieżdżone metadane CLI Plugin.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` nie zwraca własności runtime Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` znajduje tylko wrappery zgodności albo ścieżki należące do Plugin.
- `pnpm plugins:inventory:check` przechodzi.
- `pnpm plugin-sdk:api:check` przechodzi albo wygenerowane baseline’y API są celowo zaktualizowane i sprawdzone.
- Ukierunkowane testy Canvas przechodzą.
- Testy changed-lanes przechodzą dla ścieżek hosta Canvas/A2UI.
- Treść PR wyraźnie mówi, że Canvas jest eksperymentalny i oparty na Plugin.

## Polecenia weryfikacyjne

Używaj ukierunkowanych lokalnych sprawdzeń podczas iteracji:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Uruchom `pnpm build` przed push, jeśli zmienia się barrel runtime, leniwy import, pakowanie albo publikowane powierzchnie Plugin.
