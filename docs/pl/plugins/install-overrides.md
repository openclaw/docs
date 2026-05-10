---
read_when:
    - Testowanie przepływów wdrażania lub konfiguracji z użyciem lokalnie spakowanego pluginu
    - Weryfikowanie pakietu Plugin przed jego opublikowaniem
    - Zastępowanie automatycznej instalacji pluginu artefaktem testowym
sidebarTitle: Install overrides
summary: Testuj nadpisania spakowanych Plugin przy użyciu przepływów instalacji podczas konfiguracji
title: Nadpisania instalacji Plugin
x-i18n:
    generated_at: "2026-05-10T19:46:01Z"
    model: gpt-5.5
    provider: openai
    source_hash: f0fca17c1c78b11a87a1ec265510d9bc5aa9826822f4888e37ff1b3f3803598e
    source_path: plugins/install-overrides.md
    workflow: 16
---

Nadpisania instalacji Plugin pozwalają opiekunom testować instalacje Plugin wykonywane podczas konfiguracji względem
określonego pakietu npm albo lokalnego archiwum tarball utworzonego przez npm-pack. Są przeznaczone wyłącznie do walidacji E2E i pakietów. Zwykli użytkownicy powinni instalować Plugin za pomocą
[`openclaw plugins install`](/pl/cli/plugins).

<Warning>
Nadpisania wykonują kod Plugin ze wskazanego przez Ciebie źródła. Używaj ich tylko w
izolowanym katalogu stanu albo na jednorazowej maszynie testowej.
</Warning>

## Środowisko

Nadpisania są wyłączone, chyba że ustawione są obie zmienne:

```bash
export OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1
export OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{
  "codex": "npm-pack:/tmp/openclaw-codex-2026.5.8.tgz",
  "openclaw-web-search": "npm:@openclaw/web-search@2026.5.8"
}'
```

Mapa nadpisań to JSON z kluczami według identyfikatora Plugin. Wartości obsługują:

- `npm:<registry-spec>` dla pakietów z rejestru oraz dokładnych wersji lub tagów
- `npm-pack:<path.tgz>` dla lokalnych archiwów tarball utworzonych przez `npm pack`

Względne ścieżki `npm-pack:` są rozwiązywane względem bieżącego katalogu roboczego.

## Zachowanie

Gdy przepływ wykonywany podczas konfiguracji żąda instalacji Plugin, którego identyfikator występuje w mapie,
OpenClaw używa źródła z nadpisania zamiast katalogu, pakietu wbudowanego lub domyślnego
źródła npm. Dotyczy to onboardingu i innych przepływów, które używają współdzielonego
instalatora Plugin działającego podczas konfiguracji.

Nadpisania nadal wymuszają oczekiwany identyfikator Plugin. Archiwum tarball przypisane do `codex`
musi zainstalować Plugin, którego identyfikator w manifeście to `codex`.

Nadpisania nie dziedziczą oficjalnego statusu zaufanego źródła. Nawet gdy wpis katalogu
zwykle reprezentuje pakiet należący do OpenClaw, nadpisanie jest traktowane jako
dane testowe dostarczone przez operatora.

Pliki `.env` w obszarze roboczym nie mogą włączać nadpisań instalacji. Ustaw te zmienne w
zaufanej powłoce, zadaniu CI albo zdalnym poleceniu testowym, które uruchamia OpenClaw.

## E2E pakietu

Użyj izolowanego katalogu stanu, aby instalacje pakietów i rekordy instalacji nie
dotykały Twojego zwykłego stanu OpenClaw:

```bash
npm pack extensions/codex --pack-destination /tmp

OPENCLAW_STATE_DIR="$(mktemp -d)" \
OPENCLAW_ALLOW_PLUGIN_INSTALL_OVERRIDES=1 \
OPENCLAW_PLUGIN_INSTALL_OVERRIDES='{"codex":"npm-pack:/tmp/openclaw-codex-2026.5.8.tgz"}' \
pnpm openclaw onboard --mode local
```

Zweryfikuj zainstalowany pakiet w katalogu stanu:

```bash
find "$OPENCLAW_STATE_DIR/npm/node_modules" -maxdepth 3 -name package.json -print
grep -R '"@openclaw/codex"' "$OPENCLAW_STATE_DIR/npm/package-lock.json"
```

Dla E2E z aktywnym dostawcą pobierz rzeczywisty klucz API z zaufanej powłoki albo sekretu CI
przed uruchomieniem polecenia testowego. Nie wypisuj kluczy; raportuj tylko źródło i
to, czy klucz był obecny.
