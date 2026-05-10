---
read_when:
    - Chcesz szybkie przykłady instalowania, wyświetlania listy, aktualizowania lub odinstalowywania pluginów
    - Chcesz wybrać między dystrybucją Pluginów przez ClawHub a dystrybucją Pluginów przez npm
    - Publikujesz pakiet Plugin
sidebarTitle: Manage plugins
summary: Szybkie przykłady instalowania, wyświetlania, odinstalowywania, aktualizowania i publikowania Pluginów OpenClaw
title: Zarządzanie pluginami
x-i18n:
    generated_at: "2026-05-10T19:46:25Z"
    model: gpt-5.5
    provider: openai
    source_hash: 5f666a8196c802190dfd69e8b6a679a47db22f97c4c14d2f9fed73e8fb1ffe5a
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Większość przepływów pracy z Plugin to kilka poleceń: wyszukanie, instalacja, ponowne uruchomienie Gateway,
weryfikacja i odinstalowanie, gdy Plugin nie jest już potrzebny.

## Lista Plugin

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
z konfiguracji, manifestów i rejestru Plugin; nie dowodzi, że już działający
proces Gateway zaimportował środowisko uruchomieniowe Plugin.

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
openclaw plugins install npm:@openclaw/codex

# Install from git or a local development checkout.
openclaw plugins install git:github.com/acme/openclaw-plugin@v1.0.0
openclaw plugins install ./my-plugin
openclaw plugins install --link ./my-plugin
```

Po zainstalowaniu kodu Plugin uruchom ponownie Gateway obsługujący Twoje kanały:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Użyj `inspect --runtime`, gdy potrzebujesz dowodu, że Plugin zarejestrował powierzchnie
środowiska uruchomieniowego, takie jak narzędzia, hooki, usługi, metody Gateway lub
polecenia CLI należące do Plugin.

## Aktualizowanie Plugin

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Jeśli Plugin został zainstalowany z npm dist-tag, takiego jak `@beta`, późniejsze
wywołania `update <plugin-id>` ponownie używają zapisanego tagu. Przekazanie jawnej specyfikacji npm
przełącza śledzoną instalację na tę specyfikację dla przyszłych aktualizacji.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Drugie polecenie przenosi Plugin z powrotem do domyślnej linii wydań rejestru,
gdy wcześniej był przypięty do dokładnej wersji lub tagu.

Gdy `openclaw update` działa w kanale beta, rekordy Plugin npm i ClawHub
z domyślnej linii najpierw próbują dopasowanego wydania Plugin `@beta`. Jeśli takie wydanie beta
nie istnieje, OpenClaw wraca do zapisanej domyślnej/najnowszej specyfikacji.
W przypadku Plugin npm OpenClaw wraca też wtedy, gdy pakiet beta istnieje, ale nie przechodzi
walidacji instalacji. Dokładne wersje i jawne tagi, takie jak `@rc` lub `@beta`,
są zachowywane.

## Odinstalowywanie Plugin

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Odinstalowanie usuwa wpis konfiguracji Plugin, rekord indeksu Plugin, wpisy listy dozwolonych/zabronionych
oraz połączone ścieżki ładowania, gdy ma to zastosowanie. Zarządzane katalogi instalacyjne są
usuwane, chyba że przekażesz `--keep-files`.

W trybie Nix (`OPENCLAW_NIX_MODE=1`) polecenia instalacji, aktualizacji, odinstalowania, włączania
i wyłączania Plugin są wyłączone. Zarządzaj tymi wyborami w źródle Nix dla
instalacji; w przypadku nix-openclaw użyj najpierw agenta
[Quick Start](https://github.com/openclaw/nix-openclaw#quick-start).

## Publikowanie Plugin

Możesz publikować zewnętrzne Plugin w [ClawHub](https://clawhub.ai), npmjs.com lub
w obu miejscach.

### Publikowanie w ClawHub

ClawHub to podstawowa publiczna powierzchnia odkrywania Plugin OpenClaw. Daje
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

Natywne Plugin npm muszą zawierać manifest Plugin oraz metadane punktu wejścia OpenClaw
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
  wersji i wskazówek instalacyjnych.
- **npmjs.com**: użyj, gdy już publikujesz pakiety JavaScript lub potrzebujesz przepływów pracy npm
  dist-tags/prywatnego rejestru.
- **Git**: użyj, gdy chcesz instalować bezpośrednio z gałęzi, tagu lub commita.
- **Ścieżka lokalna**: użyj, gdy rozwijasz lub testujesz Plugin na tej samej
  maszynie.

## Powiązane

- [Plugin](/pl/tools/plugin) - omówienie i rozwiązywanie problemów
- [`openclaw plugins`](/pl/cli/plugins) - pełna dokumentacja CLI
- [ClawHub](/pl/clawhub/cli) - publikowanie i operacje rejestru
- [Tworzenie Plugin](/pl/plugins/building-plugins) - tworzenie pakietu Plugin
- [Manifest Plugin](/pl/plugins/manifest) - manifest i metadane pakietu
