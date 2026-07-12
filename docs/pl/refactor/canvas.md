---
read_when:
    - Przenoszenie własności hosta Canvas, narzędzi, poleceń, dokumentacji lub protokołu
    - Sprawdzanie, czy Canvas nadal jest własnością rdzenia
    - Przygotowywanie lub przegląd eksperymentalnego PR-a dotyczącego pluginu Canvas
summary: Plan i lista kontrolna audytu dotyczące przeniesienia Canvas z rdzenia do dołączonego eksperymentalnego pluginu.
title: Refaktoryzacja pluginu Canvas
x-i18n:
    generated_at: "2026-07-12T15:37:11Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 1470edb74d5f8fe96224d38821ba0b3b13f8ce756124125af64fc3e49df0fcb8
    source_path: refactor/canvas.md
    workflow: 16
---

# Refaktoryzacja pluginu Canvas

Canvas jest rzadko używany i eksperymentalny. Traktuj go jako dołączony plugin, a nie funkcję rdzenia. Rdzeń może zachować ogólną infrastrukturę Gateway, Node, HTTP, uwierzytelniania, konfiguracji i klientów natywnych, ale zachowanie specyficzne dla Canvas powinno znajdować się w `extensions/canvas`.

## Cel

Przenieść odpowiedzialność za Canvas do `extensions/canvas`, zachowując bieżące działanie sparowanego Node:

- narzędzie `canvas` dostępne dla agenta jest rejestrowane przez plugin Canvas
- polecenia Node dla Canvas są dozwolone tylko wtedy, gdy zarejestruje je plugin Canvas
- pliki hosta i źródłowe A2UI znajdują się w pluginie Canvas
- materializacja dokumentów Canvas znajduje się w pluginie Canvas
- implementacja polecenia CLI znajduje się w pluginie Canvas lub deleguje przez należący do pluginu moduł zbiorczy środowiska wykonawczego
- dokumentacja i wykaz pluginów opisują Canvas jako rozwiązanie eksperymentalne i oparte na pluginie

## Poza zakresem

- Nie przeprojektowuj w ramach tej refaktoryzacji interfejsu Canvas w aplikacji natywnej.
- Nie usuwaj obsługi protokołu ani klienta Canvas z systemów iOS, Android lub macOS, chyba że odrębna decyzja produktowa nakaże usunięcie Canvas.
- Nie twórz rozbudowanej struktury usług pluginów wyłącznie dla Canvas, chyba że co najmniej jeden inny dołączony plugin potrzebuje tego samego punktu integracji.

## Bieżący stan gałęzi

Ukończono:

- Dodano pakiet dołączonego pluginu w `extensions/canvas`.
- Dodano `extensions/canvas/openclaw.plugin.json`.
- Przeniesiono narzędzie agenta `canvas` z `src/agents/tools/canvas-tool.ts` do `extensions/canvas/src/tool.ts`.
- Usunięto rejestrację `createCanvasTool` w rdzeniu z `src/agents/openclaw-tools.ts`.
- Przeniesiono implementację hosta Canvas z `src/canvas-host` do `extensions/canvas/src/host`.
- Zachowano `extensions/canvas/runtime-api.ts` jako należący do pluginu moduł zbiorczy zgodności na potrzeby testów, pakowania i zewnętrznych publicznych funkcji pomocniczych Canvas.
- Przeniesiono materializację dokumentów Canvas z `src/gateway/canvas-documents.ts` do `extensions/canvas/src/documents.ts`.
- Przeniesiono implementację CLI Canvas i funkcje pomocnicze JSONL A2UI do `extensions/canvas/src/cli.ts`.
- Przeniesiono adres URL hosta Canvas i funkcje pomocnicze ograniczonych zakresowo możliwości do `extensions/canvas/src`.
- Przeniesiono domyślne polecenia Node dla Canvas z zakodowanych na stałe list rdzenia do `nodeInvokePolicies` pluginu.
- Dodano należącą do pluginu konfigurację hosta Canvas w `plugins.entries.canvas.config.host`.
- Przeniesiono udostępnianie Canvas i A2UI przez HTTP za rejestrację tras HTTP pluginu Canvas.
- Dodano ogólną obsługę podnoszenia połączeń WebSocket dla tras HTTP należących do pluginów.
- Zastąpiono specyficzne dla Canvas uwierzytelnianie adresu URL hosta Gateway i możliwości Node ogólnymi funkcjami pomocniczymi hostowanej powierzchni pluginu i możliwości Node.
- Dodano należące do pluginu mechanizmy rozpoznawania hostowanych multimediów, dzięki czemu adresy URL dokumentów Canvas są rozpoznawane przez plugin Canvas zamiast przez importowanie przez rdzeń wewnętrznych elementów dokumentów Canvas.
- Dodano `api.registerNodeCliFeature(...)`, aby Canvas mógł deklarować `openclaw nodes canvas` jako należącą do pluginu funkcję Node bez ręcznego określania ścieżki polecenia nadrzędnego.
- Usunięto produkcyjne importy `extensions/canvas/runtime-api.js` z `src/**`.
- Przeniesiono źródło pakietu A2UI z `apps/shared/OpenClawKit/Tools/CanvasA2UI` do `extensions/canvas/src/host/a2ui-app`.
- Przeniesiono implementację budowania i kopiowania A2UI do `extensions/canvas/scripts` oraz zastąpiono główną konfigurację procesu budowania ogólnymi punktami zaczepienia zasobów dołączonych pluginów.
- Usunięto starszy alias konfiguracji `canvasHost` najwyższego poziomu ze środowiska wykonawczego.
- Zachowano migrację Canvas w narzędziu diagnostycznym, aby `openclaw doctor --fix` przepisywało stare konfiguracje `canvasHost` do `plugins.entries.canvas.config.host`.
- Usunięto zgodność protokołu Canvas ze starszymi agentami za bramą protokołu Gateway v4. Klienci natywni i Gateway używają teraz wyłącznie `pluginSurfaceUrls.canvas` oraz `node.pluginSurface.refresh`; przestarzała ścieżka `canvasHostUrl`, `canvasCapability` i `node.canvas.capability.refresh` celowo nie jest obsługiwana w tej eksperymentalnej refaktoryzacji.
- Zaktualizowano wygenerowany wykaz pluginów, aby uwzględnić Canvas.
- Dodano dokumentację referencyjną pluginu w `docs/plugins/reference/canvas.md`.

Znane pozostałe powierzchnie Canvas należące do rdzenia:

- Procedury obsługi Canvas w aplikacjach natywnych w `apps/` nadal celowo korzystają z powierzchni pluginu Canvas
- procedury obsługi protokołu i klienta Canvas w aplikacjach natywnych w `apps/`
- dane wyjściowe opublikowanego artefaktu nadal używają `dist/canvas-host/a2ui` w celu zachowania zgodności wstecznej podczas wyszukiwania w środowisku wykonawczym, ale etap kopiowania należy teraz do pluginu

## Docelowa struktura

`extensions/canvas` powinno odpowiadać za:

- manifest pluginu i metadane pakietu
- rejestrację narzędzia agenta
- zasady wywoływania poleceń Node
- host Canvas i środowisko wykonawcze A2UI
- źródło pakietu Canvas A2UI oraz skrypty budowania i kopiowania zasobów
- tworzenie dokumentów Canvas i rozpoznawanie zasobów
- implementację CLI Canvas
- stronę dokumentacji Canvas i wpis w wykazie pluginów

Rdzeń powinien odpowiadać wyłącznie za ogólne punkty integracji:

- wykrywanie i rejestrację pluginów
- ogólny rejestr narzędzi agenta
- ogólny rejestr zasad wywoływania Node
- ogólną obsługę HTTP i uwierzytelniania Gateway oraz podnoszenia połączeń WebSocket
- ogólne rozpoznawanie adresów URL hostowanych powierzchni pluginów
- ogólną rejestrację mechanizmów rozpoznawania hostowanych multimediów
- ogólny transport możliwości Node
- ogólną obsługę konfiguracji
- ogólne wykrywanie punktów zaczepienia zasobów dołączonych pluginów

Aplikacje natywne mogą zachować procedury obsługi poleceń Canvas jako klienci protokołu. Nie są właścicielem środowiska wykonawczego pluginu.

## Kroki migracji

1. Traktuj `plugins.entries.canvas.config.host` jako należącą do pluginu powierzchnię konfiguracji.
2. Zaktualizuj dokumentację tak, aby Canvas był opisywany jako eksperymentalny dołączony plugin.
3. Uruchom ukierunkowane testy Canvas, kontrole wykazu pluginów, kontrole API SDK pluginów oraz bramki budowania i typów, na które wpływają granice środowiska wykonawczego.

## Lista kontrolna audytu

Przed uznaniem refaktoryzacji za ukończoną:

- `rg "src/canvas-host|../canvas-host"` nie zwraca żadnych aktywnych importów źródłowych.
- `rg "canvas-tool|createCanvasTool" src` nie znajduje należącej do rdzenia implementacji narzędzia Canvas.
- `rg "canvas.present|canvas.snapshot|canvas.a2ui" src/gateway` nie znajduje zakodowanych na stałe domyślnych list dozwolonych poza testami ogólnych zasad pluginów.
- Wynik `rg "extensions/canvas/runtime-api" src --glob '!**/*.test.ts'` jest pusty.
- Wynik `rg "canvas-documents" src` jest pusty.
- Wynik `rg "registerNodesCanvasCommands|nodes-canvas" src` jest pusty; plugin Canvas rejestruje `openclaw nodes canvas` za pośrednictwem zagnieżdżonych metadanych CLI pluginu.
- `rg "createCanvasHostHandler|handleA2uiHttpRequest" src/gateway` nie zwraca żadnych elementów środowiska wykonawczego należących do Gateway.
- `rg "apps/shared/OpenClawKit/Tools/CanvasA2UI|canvas-a2ui-copy|extensions/canvas/src/host/a2ui" scripts .github package.json` znajduje wyłącznie opakowania zgodności lub ścieżki należące do pluginu.
- `pnpm plugins:inventory:check` przechodzi pomyślnie.
- `pnpm plugin-sdk:api:check` przechodzi pomyślnie albo wygenerowane wartości bazowe API zostały celowo zaktualizowane i sprawdzone.
- Ukierunkowane testy Canvas przechodzą pomyślnie.
- Testy zmienionych ścieżek przechodzą pomyślnie dla ścieżek hosta Canvas i A2UI.
- Treść PR jednoznacznie stwierdza, że Canvas jest eksperymentalny i oparty na pluginie.

## Polecenia weryfikacyjne

Podczas iteracji używaj ukierunkowanych kontroli lokalnych:

```sh
pnpm test extensions/canvas/src/host/server.test.ts extensions/canvas/src/host/server.state-dir.test.ts extensions/canvas/src/host/file-resolver.test.ts
pnpm test src/gateway/server.plugin-node-capability-auth.test.ts src/gateway/server-import-boundary.test.ts
pnpm test extensions/canvas/src/config-migration.test.ts src/commands/doctor-legacy-config.migrations.test.ts
pnpm test test/scripts/changed-lanes.test.ts test/scripts/build-all.test.ts extensions/canvas/scripts/bundle-a2ui.test.ts test/scripts/bundled-plugin-assets.test.ts extensions/canvas/scripts/copy-a2ui.test.ts src/infra/run-node.test.ts
pnpm tsgo:extensions
pnpm plugins:inventory:check
pnpm plugin-sdk:api:check
```

Uruchom `pnpm build` przed wypchnięciem zmian, jeśli zmienia się moduł zbiorczy środowiska wykonawczego, import leniwy, pakowanie lub opublikowane powierzchnie pluginu.
