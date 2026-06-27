---
read_when:
    - Testowanie przepływów wdrażania lub konfiguracji na lokalnie spakowanym Plugin
    - Weryfikowanie pakietu Plugin przed jego opublikowaniem
    - Zastępowanie automatycznej instalacji Plugin artefaktem testowym
sidebarTitle: Install overrides
summary: Testuj nadpisania spakowanych Pluginów z przepływami instalacji podczas konfiguracji
title: Nadpisania instalacji Plugin
x-i18n:
    generated_at: "2026-06-27T17:53:50Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 9ac3d8074f0455a3287c22447d134bebf57805bc06302652172eb5f87e47e548
    source_path: plugins/install-overrides.md
    workflow: 16
---

Nadpisania instalacji Plugin pozwalają maintainerom testować instalacje Plugin podczas konfiguracji względem określonego pakietu npm lub lokalnego tarballa utworzonego przez `npm pack`. Są przeznaczone wyłącznie do E2E i walidacji pakietów. Zwykli użytkownicy powinni instalować Pluginy za pomocą [`openclaw plugins install`](/pl/cli/plugins).

<Warning>
Nadpisania wykonują kod Plugin ze wskazanego źródła. Używaj ich tylko w izolowanym katalogu stanu lub na jednorazowej maszynie testowej.
</Warning>

## Środowisko

Nadpisania są wyłączone, chyba że ustawiono obie zmienne:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

Mapa nadpisań to JSON indeksowany identyfikatorem Plugin. Wartości obsługują:

- `npm:<registry-spec>` dla pakietów z rejestru oraz dokładnych wersji lub tagów
- `npm-pack:<path.tgz>` dla lokalnych tarballi utworzonych przez `npm pack`

Względne ścieżki `npm-pack:` są rozwiązywane względem bieżącego katalogu roboczego.

## Zachowanie

Gdy przepływ uruchamiany podczas konfiguracji prosi o instalację Plugin, którego identyfikator występuje w mapie, OpenClaw używa źródła nadpisania zamiast źródła z katalogu, wbudowanego lub domyślnego źródła npm. Dotyczy to onboardingu i innych przepływów, które używają współdzielonego instalatora Plugin uruchamianego podczas konfiguracji.

Nadpisania nadal egzekwują oczekiwany identyfikator Plugin. Tarball zmapowany na `codex` musi zainstalować Plugin, którego identyfikator w manifeście to `codex`.

Nadpisania nie dziedziczą oficjalnego statusu zaufanego źródła. Nawet gdy wpis w katalogu zwykle reprezentuje pakiet należący do OpenClaw, nadpisanie jest traktowane jako dane testowe dostarczone przez operatora.

Pliki `.env` w przestrzeni roboczej nie mogą włączać nadpisań instalacji. Ustaw te zmienne w zaufanej powłoce, zadaniu CI lub zdalnym poleceniu testowym, które uruchamia OpenClaw.

## E2E pakietu

Użyj izolowanego katalogu stanu, aby instalacje pakietów i rekordy instalacji nie dotykały zwykłego stanu OpenClaw:

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

W przypadku E2E z dostawcą live pobierz prawdziwy klucz API z zaufanej powłoki lub sekretu CI przed uruchomieniem polecenia testowego. Nie drukuj kluczy; raportuj tylko źródło oraz to, czy klucz był obecny.
