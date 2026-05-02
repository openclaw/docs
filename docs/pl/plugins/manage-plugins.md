---
read_when:
    - Chcesz szybkie przykłady instalacji, wyświetlania listy, aktualizacji lub odinstalowania Pluginów
    - Chcesz wybrać między ClawHub a dystrybucją Pluginów przez npm
    - Publikujesz pakiet Plugin
sidebarTitle: Manage plugins
summary: Krótkie przykłady instalowania, wyświetlania, odinstalowywania, aktualizowania i publikowania pluginów OpenClaw
title: Zarządzaj Pluginami
x-i18n:
    generated_at: "2026-05-02T22:20:06Z"
    model: gpt-5.5
    provider: openai
    source_hash: ec25a811b942f155f5d5e4cac475dbef74f0616bc85ff182c74598184e910320
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Większość przepływów pracy z Pluginami to kilka poleceń: wyszukanie, instalacja, ponowne uruchomienie Gateway,
weryfikacja i odinstalowanie, gdy Plugin nie jest już potrzebny.

## Lista Pluginów

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Użyj `--json` w skryptach. Obejmuje diagnostykę rejestru oraz statyczny
`dependencyStatus` każdego Pluginu, gdy pakiet Pluginu deklaruje `dependencies` lub
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` to zimne sprawdzenie inwentarza. Pokazuje, co OpenClaw może wykryć
z konfiguracji, manifestów i rejestru Pluginów; nie dowodzi, że
już uruchomiony proces Gateway zaimportował środowisko uruchomieniowe Pluginu.

## Instalowanie Pluginów

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
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Po zainstalowaniu kodu Pluginu uruchom ponownie Gateway obsługujący Twoje kanały:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Użyj `inspect --runtime`, gdy potrzebujesz dowodu, że Plugin zarejestrował powierzchnie
środowiska uruchomieniowego, takie jak narzędzia, hooki, usługi, metody Gateway lub należące do Pluginu polecenia
CLI.

## Aktualizowanie Pluginów

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Jeśli Plugin został zainstalowany z npm dist-tag, takiego jak `@beta`, późniejsze
wywołania `update <plugin-id>` ponownie używają tego zapisanego tagu. Przekazanie jawnej specyfikacji npm
przełącza śledzoną instalację na tę specyfikację dla przyszłych aktualizacji.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Drugie polecenie przenosi Plugin z powrotem na domyślną linię wydań rejestru,
gdy wcześniej był przypięty do dokładnej wersji lub tagu.

Gdy `openclaw update` działa w kanale beta, wpisy Pluginów npm z linii domyślnej i ClawHub
najpierw próbują dopasowanego wydania Pluginu `@beta`. Jeśli takie wydanie beta
nie istnieje, OpenClaw wraca do zapisanej specyfikacji domyślnej/najnowszej.
Dokładne wersje i jawne tagi, takie jak `@rc` lub `@beta`, są zachowywane.

## Odinstalowywanie Pluginów

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Odinstalowanie usuwa wpis konfiguracji Pluginu, wpis indeksu Pluginu, wpisy list
zezwoleń/odmów oraz powiązane ścieżki ładowania, gdy ma to zastosowanie. Katalogi instalacji zarządzanej są
usuwane, chyba że przekażesz `--keep-files`.

## Publikowanie Pluginów

Zewnętrzne Pluginy możesz publikować w [ClawHub](https://clawhub.ai), npmjs.com albo
w obu miejscach.

### Publikowanie w ClawHub

ClawHub to główna publiczna powierzchnia odkrywania Pluginów OpenClaw. Zapewnia
użytkownikom przeszukiwalne metadane, historię wersji i wyniki skanowania rejestru przed
instalacją.

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

Natywne Pluginy npm muszą zawierać manifest Pluginu i metadane punktu wejścia OpenClaw
w `package.json`.

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

Użytkownicy instalują wyłącznie z npm za pomocą:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Jeśli ten sam pakiet jest również dostępny w ClawHub, `npm:` pomija wyszukiwanie w ClawHub i
wymusza rozwiązywanie przez npm.

## Wybór źródła

- **ClawHub**: użyj, gdy chcesz natywnego dla OpenClaw odkrywania, podsumowań skanowania,
  wersji i wskazówek instalacji.
- **npmjs.com**: użyj, gdy już dostarczasz pakiety JavaScript albo potrzebujesz przepływów pracy npm
  dist-tags/prywatnego rejestru.
- **Git**: użyj, gdy chcesz instalować bezpośrednio z gałęzi, tagu lub commita.
- **Ścieżka lokalna**: użyj, gdy rozwijasz lub testujesz Plugin na tej samej
  maszynie.

## Powiązane

- [Pluginy](/pl/tools/plugin) - przegląd i rozwiązywanie problemów
- [`openclaw plugins`](/pl/cli/plugins) - pełna dokumentacja CLI
- [ClawHub](/pl/tools/clawhub) - publikowanie i operacje rejestru
- [Tworzenie Pluginów](/pl/plugins/building-plugins) - utwórz pakiet Pluginu
- [Manifest Pluginu](/pl/plugins/manifest) - manifest i metadane pakietu
