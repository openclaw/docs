---
read_when:
    - Chcesz szybkich przykładów instalacji, wyświetlania listy, aktualizacji lub odinstalowania Plugin
    - Chcesz wybrać między ClawHub a dystrybucją Pluginów przez npm
    - Publikujesz pakiet Plugin
sidebarTitle: Manage plugins
summary: Szybkie przykłady instalowania, wyświetlania, odinstalowywania, aktualizowania i publikowania Pluginów OpenClaw
title: Zarządzanie pluginami
x-i18n:
    generated_at: "2026-05-06T17:59:24Z"
    model: gpt-5.5
    provider: openai
    source_hash: 265777b03434dd07caee6191765c34e17fda4c8347e0327c2f37d47f9dd7a054
    source_path: plugins/manage-plugins.md
    workflow: 16
---

Większość przepływów pracy z pluginami to kilka poleceń: wyszukiwanie, instalacja, ponowne uruchomienie Gateway,
weryfikacja i odinstalowanie, gdy Plugin nie jest już potrzebny.

## Wyświetlanie listy pluginów

```bash
openclaw plugins list
openclaw plugins list --enabled
openclaw plugins list --verbose
openclaw plugins list --json
```

Użyj `--json` w skryptach. Obejmuje diagnostykę rejestru oraz statyczny
`dependencyStatus` każdego pluginu, gdy pakiet pluginu deklaruje `dependencies` lub
`optionalDependencies`.

```bash
openclaw plugins list --json \
  | jq '.plugins[] | {id, enabled, format, source, dependencyStatus}'
```

`plugins list` to zimne sprawdzenie inwentarza. Pokazuje, co OpenClaw może wykryć
z konfiguracji, manifestów i rejestru pluginów; nie dowodzi, że już uruchomiony
proces Gateway zaimportował środowisko uruchomieniowe pluginu.

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

Po zainstalowaniu kodu pluginu uruchom ponownie Gateway obsługujący Twoje kanały:

```bash
openclaw gateway restart
openclaw plugins inspect <plugin-id> --runtime --json
```

Użyj `inspect --runtime`, gdy potrzebujesz dowodu, że Plugin zarejestrował powierzchnie
środowiska uruchomieniowego, takie jak narzędzia, haki, usługi, metody Gateway lub należące do pluginu
polecenia CLI.

## Aktualizowanie pluginów

```bash
openclaw plugins update <plugin-id>
openclaw plugins update <npm-package-or-spec>
openclaw plugins update --all
```

Jeśli Plugin został zainstalowany z dist-tagu npm, takiego jak `@beta`, późniejsze
wywołania `update <plugin-id>` ponownie używają tego zapisanego tagu. Przekazanie jawnej specyfikacji npm
przełącza śledzoną instalację na tę specyfikację dla przyszłych aktualizacji.

```bash
openclaw plugins update @scope/openclaw-plugin@beta
openclaw plugins update @scope/openclaw-plugin
```

Drugie polecenie przenosi Plugin z powrotem do domyślnej linii wydań rejestru,
gdy wcześniej był przypięty do dokładnej wersji lub tagu.

Gdy `openclaw update` działa w kanale beta, rekordy pluginów npm i ClawHub
z domyślnej linii najpierw próbują dopasowanego wydania pluginu `@beta`. Jeśli takie wydanie beta
nie istnieje, OpenClaw wraca do zapisanej domyślnej/najnowszej specyfikacji.
W przypadku pluginów npm OpenClaw wraca również wtedy, gdy pakiet beta istnieje, ale nie przechodzi
walidacji instalacji. Dokładne wersje i jawne tagi, takie jak `@rc` lub `@beta`,
są zachowywane.

## Odinstalowywanie pluginów

```bash
openclaw plugins uninstall <plugin-id> --dry-run
openclaw plugins uninstall <plugin-id>
openclaw plugins uninstall <plugin-id> --keep-files
openclaw gateway restart
```

Odinstalowanie usuwa wpis konfiguracji pluginu, rekord indeksu pluginów, wpisy list
zezwoleń/odmów oraz powiązane ścieżki ładowania, gdy ma to zastosowanie. Zarządzane katalogi instalacji są
usuwane, chyba że przekażesz `--keep-files`.

W trybie Nix (`OPENCLAW_NIX_MODE=1`) polecenia instalowania, aktualizowania, odinstalowywania, włączania
i wyłączania pluginów są wyłączone. Zamiast tego zarządzaj tymi wyborami w źródle Nix dla
instalacji; w przypadku nix-openclaw użyj ukierunkowanego na agenta
[Szybkiego startu](https://github.com/openclaw/nix-openclaw#quick-start).

## Publikowanie pluginów

Możesz publikować zewnętrzne pluginy w [ClawHub](https://clawhub.ai), npmjs.com albo
w obu miejscach.

### Publikowanie w ClawHub

ClawHub to podstawowa publiczna powierzchnia odkrywania pluginów OpenClaw. Zapewnia
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

Natywne pluginy npm muszą zawierać manifest pluginu oraz metadane punktu wejścia OpenClaw
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

Użytkownicy instalują tylko z npm za pomocą:

```bash
openclaw plugins install npm:@acme/openclaw-plugin
openclaw plugins install npm:@acme/openclaw-plugin@beta
openclaw plugins install npm:@acme/openclaw-plugin@1.0.0
```

Jeśli ten sam pakiet jest również dostępny w ClawHub, `npm:` pomija wyszukiwanie w ClawHub i
wymusza rozwiązywanie przez npm.

## Wybór źródła

- **ClawHub**: użyj, gdy chcesz mieć natywne dla OpenClaw odkrywanie, podsumowania skanowania,
  wersje i wskazówki instalacji.
- **npmjs.com**: użyj, gdy już dostarczasz pakiety JavaScript albo potrzebujesz przepływów pracy
  z dist-tagami npm/prywatnym rejestrem.
- **Git**: użyj, gdy chcesz instalować bezpośrednio z gałęzi, tagu lub commitu.
- **Ścieżka lokalna**: użyj, gdy tworzysz lub testujesz Plugin na tej samej
  maszynie.

## Powiązane

- [Pluginy](/pl/tools/plugin) - omówienie i rozwiązywanie problemów
- [`openclaw plugins`](/pl/cli/plugins) - pełna dokumentacja CLI
- [ClawHub](/pl/tools/clawhub) - publikowanie i operacje rejestru
- [Tworzenie pluginów](/pl/plugins/building-plugins) - tworzenie pakietu pluginu
- [Manifest pluginu](/pl/plugins/manifest) - manifest i metadane pakietu
