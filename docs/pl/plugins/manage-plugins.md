---
read_when:
    - Potrzebujesz szybkich przykładów instalowania, wyświetlania listy, aktualizowania lub odinstalowywania Pluginów
    - Chcesz wybrać między ClawHub a dystrybucją pluginów przez npm
    - Publikujesz pakiet Plugin
sidebarTitle: Manage plugins
summary: Szybkie przykłady instalowania, wyświetlania listy, odinstalowywania, aktualizowania i publikowania pluginów OpenClaw
title: Zarządzanie pluginami
x-i18n:
    generated_at: "2026-05-02T20:48:02Z"
    model: gpt-5.5
    provider: openai
    source_hash: c5a1c58da41b243cebe1c163048918a94c492b77fdae1613bd008cb267670041
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Większość przepływów pracy Plugin to kilka poleceń: wyszukiwanie, instalacja, restart Gateway,
weryfikacja i odinstalowanie, gdy Plugin nie jest już potrzebny.

## Wyświetlanie listy Plugin

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Użyj `--json` w skryptach. Zawiera diagnostykę rejestru oraz statyczny
`dependencyStatus` każdego Plugin, gdy pakiet Plugin deklaruje `dependencies` lub
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` to zimne sprawdzenie inwentarza. Pokazuje, co OpenClaw może wykryć
z konfiguracji, manifestów i rejestru Plugin; nie dowodzi, że już uruchomiony
proces Gateway zaimportował środowisko runtime Plugin.

## Instalowanie Plugin

```bash
# Search ClawHub for plugin packages.
openclaw plugins search "calendar"

# Bare package specs try ClawHub first, then npm fallback.
openclaw plugins install <package>

# Force one source.
openclaw plugins install clawhub:<package>
openclaw plugins install npm:<package>

# Install a specific version or dist-tag.
openclaw plugins install clawhub:<package>@1.2.3
openclaw plugins install clawhub:<package>@beta
openclaw plugins install npm:@scope/openclaw-plugin@1.2.3
openclaw plugins install npm:@openclaw/codex@beta

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Po zainstalowaniu kodu Plugin zrestartuj Gateway obsługujący Twoje kanały:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Użyj `inspect --runtime`, gdy potrzebujesz dowodu, że Plugin zarejestrował
powierzchnie runtime, takie jak narzędzia, hooki, usługi, metody Gateway lub
polecenia CLI należące do Plugin.

## Aktualizowanie Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Jeśli Plugin zainstalowano z tagu dist-tag npm, takiego jak `@beta`, późniejsze
wywołania `update <plugin-id>` ponownie użyją tego zapisanego tagu. Przekazanie
jawnej specyfikacji npm przełącza śledzoną instalację na tę specyfikację dla
przyszłych aktualizacji.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Drugie polecenie przenosi Plugin z powrotem na domyślną linię wydań rejestru,
gdy wcześniej był przypięty do dokładnej wersji lub tagu.

Gdy `openclaw update` działa w kanale beta, rekordy Plugin npm i ClawHub z
domyślnej linii najpierw próbują dopasowanego wydania Plugin `@beta`. Jeśli to
wydanie beta nie istnieje, OpenClaw wraca do zapisanej domyślnej/najnowszej
specyfikacji. Dokładne wersje i jawne tagi, takie jak `@rc` lub `@beta`, są
zachowywane.

## Odinstalowywanie Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Odinstalowanie usuwa wpis konfiguracji Plugin, rekord indeksu Plugin, wpisy list
allow/deny oraz połączone ścieżki ładowania, gdy ma to zastosowanie. Zarządzane
katalogi instalacji są usuwane, chyba że przekażesz `--keep-files`.

## Publikowanie Plugin

Zewnętrzne Plugin możesz publikować w [ClawHub](https://clawhub.ai), npmjs.com
albo w obu miejscach.

### Publikowanie w ClawHub

ClawHub jest główną publiczną powierzchnią odkrywania Plugin dla OpenClaw. Przed
instalacją daje użytkownikom przeszukiwalne metadane, historię wersji i wyniki
skanowania rejestru.

```bash
npm i -g clawhub
clawhub login
clawhub package publish your-org/your-plugin --dry-run
clawhub package publish your-org/your-plugin
clawhub package publish your-org/your-plugin@v1.0.0
```

Użytkownicy instalują z ClawHub za pomocą:

```bash
openclaw plugins install clawhub:<package>
openclaw plugins install <package>
```

Forma bez prefiksu nadal najpierw sprawdza ClawHub.

### Publikowanie w npmjs.com

Natywne Plugin npm muszą zawierać manifest Plugin i metadane punktu wejścia
OpenClaw w `package.json`.

```json package.json
{
  "name": "@acme/openclaw-plugin",
  "version": "1.0.0",
  "type": "module",
  "openclaw": {
    "extensions": ["./dist/index.js"]
  }
}
```

```bash
npm publish --access public
```

Użytkownicy instalują wariant dostępny tylko przez npm za pomocą:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Jeśli ten sam pakiet jest także dostępny w ClawHub, `npm:` pomija wyszukiwanie w
ClawHub i wymusza rozwiązywanie przez npm.

## Wybór źródła

- **ClawHub**: użyj, gdy chcesz natywne dla OpenClaw odkrywanie, podsumowania
  skanowania, wersje i wskazówki instalacji.
- **npmjs.com**: użyj, gdy już dostarczasz pakiety JavaScript lub potrzebujesz
  przepływów pracy tagów dist-tag/prywatnego rejestru npm.
- **Git**: użyj, gdy chcesz instalować bezpośrednio z gałęzi, tagu lub commitu.
- **Ścieżka lokalna**: użyj, gdy rozwijasz lub testujesz Plugin na tej samej
  maszynie.

## Powiązane

- [Plugin](/pl/tools/plugin) - omówienie i rozwiązywanie problemów
- [`openclaw plugins`](/pl/cli/plugins) - pełna dokumentacja CLI
- [ClawHub](/pl/tools/clawhub) - publikowanie i operacje rejestru
- [Tworzenie Plugin](/pl/plugins/building-plugins) - utwórz pakiet Plugin
- [Manifest Plugin](/pl/plugins/manifest) - manifest i metadane pakietu
