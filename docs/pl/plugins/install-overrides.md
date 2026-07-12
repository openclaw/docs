---
read_when:
    - Testowanie procesów wdrażania lub konfiguracji z użyciem lokalnie spakowanego pluginu
    - Weryfikowanie pakietu Pluginu przed jego opublikowaniem
    - Zastępowanie automatycznej instalacji pluginu artefaktem testowym
sidebarTitle: Install overrides
summary: Testuj zastępowanie spakowanych pluginów za pomocą przepływów instalacji podczas konfiguracji
title: Nadpisania instalacji Pluginu
x-i18n:
    generated_at: "2026-07-12T15:20:34Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: adc823f49ea9f8fa86e6a89933e43fdc309d808ac24397770495dbe81cb4b0d7
    source_path: plugins/install-overrides.md
    workflow: 16
---

Nadpisania instalacji Pluginów pozwalają opiekunom wskazać podczas konfiguracji konkretny pakiet npm lub lokalne archiwum utworzone przez `npm pack` zamiast źródła z katalogu, wbudowanego albo domyślnego źródła npm. Służą wyłącznie do testów E2E i walidacji pakietów; zwykli użytkownicy instalują Pluginy za pomocą polecenia [`openclaw plugins install`](/pl/cli/plugins).

<Warning>
Nadpisania wykonują kod Pluginu z podanego źródła. Używaj ich wyłącznie w odizolowanym katalogu stanu lub na jednorazowej maszynie testowej.
</Warning>

## Środowisko

Nadpisania są wyłączone, jeśli nie ustawiono obu zmiennych:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

Mapa nadpisań ma format JSON, a jej kluczami są identyfikatory Pluginów. Wartości obsługują:

| Prefiks               | Źródło                                                                                                                  |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `npm:<registry-spec>` | Pakiety z rejestru, dokładne wersje lub tagi                                                                            |
| `npm-pack:<path.tgz>` | Lokalne archiwa utworzone przez `npm pack`; ścieżki względne są rozwiązywane względem bieżącego katalogu roboczego       |

## Działanie

Gdy proces konfiguracji instaluje Plugin, którego identyfikator znajduje się w mapie, OpenClaw używa źródła nadpisania zamiast źródła z katalogu, wbudowanego albo domyślnego źródła npm. Dotyczy to wdrażania początkowego oraz każdego innego procesu korzystającego ze współdzielonego instalatora Pluginów na etapie konfiguracji.

- Nadpisania nadal wymuszają oczekiwany identyfikator Pluginu: archiwum przypisane do `codex` musi instalować Plugin, którego identyfikator w manifeście to `codex`.
- Nadpisania nie dziedziczą oficjalnego statusu zaufanego źródła. Nawet jeśli wpis w katalogu zwykle reprezentuje pakiet należący do OpenClaw, nadpisanie jest traktowane jako testowe dane wejściowe dostarczone przez operatora.
- Pliki `.env` przestrzeni roboczej nie mogą włączać nadpisań instalacji; obie zmienne środowiskowe znajdują się na liście zmiennych dotenv blokowanych w przestrzeni roboczej. Ustaw je w zaufanej powłoce, zadaniu CI lub zdalnym poleceniu testowym uruchamiającym OpenClaw.

## Testy E2E pakietu

Użyj odizolowanego katalogu stanu, aby instalacje pakietów i rekordy instalacji nie wpływały na zwykły stan OpenClaw:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Zweryfikuj zainstalowany pakiet w katalogu stanu:

```bash
find "$OPENCLAW_STATE_DIR/npm/projects" -path '*/node_modules/@openclaw/codex/package.json' -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/projects"/*/package-lock.json
```

W przypadku testów E2E z rzeczywistym dostawcą przed uruchomieniem polecenia testowego wczytaj prawdziwy klucz API z zaufanej powłoki lub sekretu CI. Nie wyświetlaj kluczy; podaj jedynie źródło oraz informację, czy klucz był dostępny.
