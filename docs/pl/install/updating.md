---
read_when:
    - Aktualizowanie OpenClaw
    - Coś przestaje działać po aktualizacji
summary: Bezpieczne aktualizowanie OpenClaw (instalacja globalna lub ze źródeł) oraz strategia wycofania zmian
title: Aktualizowanie
x-i18n:
    generated_at: "2026-04-24T09:18:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: 04ed583916ce64c9f60639c8145a46ce5b27ebf5a6dfd09924312d7acfefe1ab
    source_path: install/updating.md
    workflow: 15
---

Aktualizuj OpenClaw na bieżąco.

## Zalecane: `openclaw update`

Najszybszy sposób aktualizacji. Wykrywa typ instalacji (npm albo git), pobiera najnowszą wersję, uruchamia `openclaw doctor` i restartuje gateway.

```bash
openclaw update
```

Aby przełączyć kanały albo wskazać konkretną wersję:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # podgląd bez zastosowania
```

`--channel beta` preferuje beta, ale runtime wraca do stable/latest, gdy
tag beta nie istnieje albo jest starszy niż najnowsze stabilne wydanie. Użyj `--tag beta`,
jeśli chcesz surowego npm beta dist-tag do jednorazowej aktualizacji pakietu.

Zobacz [Kanały deweloperskie](/pl/install/development-channels), aby poznać semantykę kanałów.

## Alternatywa: uruchom instalator ponownie

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Dodaj `--no-onboard`, aby pominąć onboarding. Dla instalacji ze źródeł przekaż `--install-method git --no-onboard`.

## Alternatywa: ręczne npm, pnpm lub bun

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Globalne instalacje npm należące do root

Niektóre konfiguracje npm na Linux instalują globalne pakiety w katalogach należących do root, takich jak
`/usr/lib/node_modules/openclaw`. OpenClaw obsługuje taki układ: zainstalowany
pakiet jest traktowany jako tylko do odczytu w runtime, a zależności runtime
bundled Pluginów są przygotowywane w zapisywalnym katalogu runtime zamiast modyfikować
drzewo pakietu.

Dla utwardzonych jednostek systemd ustaw zapisywalny katalog stage, który jest uwzględniony w
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Jeśli `OPENCLAW_PLUGIN_STAGE_DIR` nie jest ustawione, OpenClaw używa `$STATE_DIRECTORY`, gdy
systemd je dostarcza, a potem wraca do `~/.openclaw/plugin-runtime-deps`.

## Auto-updater

Auto-updater jest domyślnie wyłączony. Włącz go w `~/.openclaw/openclaw.json`:

```json5
{
  update: {
    channel: "stable",
    auto: {
      enabled: true,
      stableDelayHours: 6,
      stableJitterHours: 12,
      betaCheckIntervalHours: 1,
    },
  },
}
```

| Kanał    | Zachowanie                                                                                                  |
| -------- | ----------------------------------------------------------------------------------------------------------- |
| `stable` | Czeka `stableDelayHours`, a potem stosuje z deterministycznym jitter w obrębie `stableJitterHours` (rozłożone wdrożenie). |
| `beta`   | Sprawdza co `betaCheckIntervalHours` (domyślnie: co godzinę) i stosuje natychmiast.                        |
| `dev`    | Brak automatycznego stosowania. Używaj `openclaw update` ręcznie.                                          |

Gateway zapisuje także wskazówkę o aktualizacji przy starcie (wyłącz przez `update.checkOnStart: false`).

## Po aktualizacji

<Steps>

### Uruchom doctor

```bash
openclaw doctor
```

Migruje konfigurację, wykonuje audyt zasad DM i sprawdza kondycję gateway. Szczegóły: [Doctor](/pl/gateway/doctor)

### Zrestartuj gateway

```bash
openclaw gateway restart
```

### Zweryfikuj

```bash
openclaw health
```

</Steps>

## Wycofanie zmian

### Przypnij wersję (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Wskazówka: `npm view openclaw version` pokazuje bieżącą opublikowaną wersję.

### Przypnij commit (źródła)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Aby wrócić do najnowszej wersji: `git checkout main && git pull`.

## Jeśli utkniesz

- Uruchom `openclaw doctor` ponownie i uważnie przeczytaj wyjście.
- Dla `openclaw update --channel dev` na checkoutach źródłowych updater automatycznie bootstrapuje `pnpm`, gdy to potrzebne. Jeśli zobaczysz błąd bootstrap `pnpm/corepack`, zainstaluj `pnpm` ręcznie (albo ponownie włącz `corepack`) i uruchom aktualizację jeszcze raz.
- Sprawdź: [Rozwiązywanie problemów](/pl/gateway/troubleshooting)
- Zapytaj na Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Przegląd instalacji](/pl/install) — wszystkie metody instalacji
- [Doctor](/pl/gateway/doctor) — kontrole kondycji po aktualizacjach
- [Migracja](/pl/install/migrating) — przewodniki migracji głównych wersji
