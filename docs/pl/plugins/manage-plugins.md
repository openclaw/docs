---
read_when:
    - Chcesz szybkich przykładów instalowania, wyświetlania listy, aktualizowania lub odinstalowywania Plugin
    - Chcesz wybrać między ClawHub a dystrybucją pluginów przez npm
    - Publikujesz pakiet Plugin
sidebarTitle: Manage plugins
summary: Szybkie przykłady instalowania, wyświetlania, odinstalowywania, aktualizowania i publikowania pluginów OpenClaw
title: Zarządzaj pluginami
x-i18n:
    generated_at: "2026-05-05T01:49:07Z"
    model: gpt-5.5
    provider: openai
    source_hash: 7fa7aa78c1ba9c83ba09bea073987ed5e037031f7c7f29307fe18934b0bd2a1c
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Większość przepływów pracy z pluginami to kilka poleceń: wyszukiwanie, instalacja, ponowne uruchomienie Gateway,
weryfikacja i odinstalowanie, gdy plugin nie jest już potrzebny.

## Lista pluginów

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Używaj `--json` w skryptach. Obejmuje diagnostykę rejestru oraz statyczny
`dependencyStatus` każdego plugina, gdy pakiet plugina deklaruje `dependencies` lub
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` to zimne sprawdzenie inwentarza. Pokazuje, co OpenClaw może wykryć
z konfiguracji, manifestów i rejestru pluginów; nie dowodzi, że już uruchomiony
proces Gateway zaimportował środowisko wykonawcze plugina.

## Instalowanie pluginów

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

Po zainstalowaniu kodu plugina uruchom ponownie Gateway obsługujący Twoje kanały:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Używaj `inspect --runtime`, gdy potrzebujesz dowodu, że plugin zarejestrował
powierzchnie środowiska wykonawczego, takie jak narzędzia, hooki, usługi, metody Gateway lub należące do plugina polecenia CLI.

## Aktualizowanie pluginów

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Jeśli plugin został zainstalowany z dist-tagu npm, takiego jak `@beta`, późniejsze
wywołania `update <plugin-id>` ponownie używają tego zapisanego tagu. Przekazanie jawnej specyfikacji npm
przełącza śledzoną instalację na tę specyfikację dla przyszłych aktualizacji.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Drugie polecenie przenosi plugina z powrotem na domyślną linię wydań rejestru,
gdy wcześniej był przypięty do dokładnej wersji lub tagu.

Gdy `openclaw update` działa w kanale beta, rekordy pluginów npm i ClawHub z domyślnej linii
najpierw próbują dopasowanego wydania plugina `@beta`. Jeśli to wydanie beta
nie istnieje, OpenClaw wraca do zapisanej domyślnej/najnowszej specyfikacji.
W przypadku pluginów npm OpenClaw wraca też do poprzedniej ścieżki, gdy pakiet beta istnieje, ale nie przechodzi
walidacji instalacji. Dokładne wersje i jawne tagi, takie jak `@rc` lub `@beta`,
są zachowywane.

## Odinstalowywanie pluginów

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Odinstalowanie usuwa wpis konfiguracji plugina, rekord indeksu plugina, wpisy listy zezwoleń/odmów
oraz połączone ścieżki ładowania, gdy ma to zastosowanie. Zarządzane katalogi instalacji są
usuwane, chyba że przekażesz `--keep-files`.

## Publikowanie pluginów

Możesz publikować zewnętrzne pluginy w [ClawHub](https://clawhub.ai), npmjs.com lub
w obu miejscach.

### Publikowanie w ClawHub

ClawHub to podstawowa publiczna powierzchnia odkrywania pluginów OpenClaw. Daje
użytkownikom możliwe do przeszukiwania metadane, historię wersji i wyniki skanowania rejestru przed
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

Natywne pluginy npm muszą zawierać manifest plugina i metadane punktu wejścia OpenClaw w `package.json`.

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

Użytkownicy instalują pluginy dostępne tylko w npm za pomocą:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Jeśli ten sam pakiet jest także dostępny w ClawHub, `npm:` pomija wyszukiwanie w ClawHub i
wymusza rozwiązywanie przez npm.

## Wybór źródła

- **ClawHub**: używaj, gdy chcesz natywne dla OpenClaw odkrywanie, podsumowania skanowania,
  wersje i wskazówki instalacji.
- **npmjs.com**: używaj, gdy już dostarczasz pakiety JavaScript lub potrzebujesz
  przepływów pracy z dist-tagami npm/prywatnym rejestrem.
- **Git**: używaj, gdy chcesz instalować bezpośrednio z gałęzi, tagu lub commita.
- **Ścieżka lokalna**: używaj, gdy tworzysz lub testujesz plugina na tej samej
  maszynie.

## Powiązane

- [Pluginy](/pl/tools/plugin) - omówienie i rozwiązywanie problemów
- [`openclaw plugins`](/pl/cli/plugins) - pełna dokumentacja referencyjna CLI
- [ClawHub](/pl/tools/clawhub) - operacje publikowania i rejestru
- [Tworzenie pluginów](/pl/plugins/building-plugins) - utwórz pakiet plugina
- [Manifest plugina](/pl/plugins/manifest) - manifest i metadane pakietu
