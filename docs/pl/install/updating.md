---
read_when:
    - Aktualizacja OpenClaw
    - Coś psuje się po aktualizacji
summary: Bezpieczna aktualizacja OpenClaw (instalacja globalna lub ze źródeł) oraz strategia wycofania zmian
title: Aktualizacja
x-i18n:
    generated_at: "2026-04-22T04:24:08Z"
    model: gpt-5.4
    provider: openai
    source_hash: 6ab2b515457c64d24c830e2e1678d9fefdcf893e0489f0d99b039db3b877b3c4
    source_path: install/updating.md
    workflow: 15
---

# Aktualizacja

Dbaj o aktualność OpenClaw.

## Zalecane: `openclaw update`

Najszybszy sposób aktualizacji. Wykrywa typ instalacji (npm lub git), pobiera najnowszą wersję, uruchamia `openclaw doctor` i restartuje gateway.

```bash
openclaw update
```

Aby przełączyć kanały lub wskazać konkretną wersję docelową:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # podgląd bez zastosowania
```

`--channel beta` preferuje kanał beta, ale runtime wraca awaryjnie do stable/latest, gdy
tag beta nie istnieje albo jest starszy niż najnowsze wydanie stable. Użyj `--tag beta`,
jeśli chcesz użyć surowego npm dist-tag beta do jednorazowej aktualizacji pakietu.

Zobacz [Development channels](/pl/install/development-channels), aby poznać semantykę kanałów.

## Alternatywa: uruchom instalator ponownie

```bash
curl -fsSL https://openclaw.ai/install.sh | bash
```

Dodaj `--no-onboard`, aby pominąć onboarding. Dla instalacji ze źródeł przekaż `--install-method git --no-onboard`.

## Alternatywa: ręcznie przez npm, pnpm lub bun

```bash
npm i -g openclaw@latest
```

```bash
pnpm add -g openclaw@latest
```

```bash
bun add -g openclaw@latest
```

### Globalne instalacje npm należące do roota

Niektóre konfiguracje npm w Linuksie instalują pakiety globalne w katalogach należących do roota, takich jak
`/usr/lib/node_modules/openclaw`. OpenClaw obsługuje taki układ: zainstalowany
pakiet jest traktowany w runtime jako tylko do odczytu, a runtime dependencies
bundled plugin są przygotowywane w zapisywalnym katalogu runtime zamiast modyfikować
drzewo pakietu.

Dla utwardzonych jednostek systemd ustaw zapisywalny katalog etapowy uwzględniony w
`ReadWritePaths`:

```ini
Environment=OPENCLAW_PLUGIN_STAGE_DIR=/var/lib/openclaw/plugin-runtime-deps
ReadWritePaths=/var/lib/openclaw /home/openclaw/.openclaw /tmp
```

Jeśli `OPENCLAW_PLUGIN_STAGE_DIR` nie jest ustawione, OpenClaw używa `$STATE_DIRECTORY`, gdy
systemd je udostępnia, a następnie wraca awaryjnie do `~/.openclaw/plugin-runtime-deps`.

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

| Kanał    | Zachowanie                                                                                                     |
| -------- | -------------------------------------------------------------------------------------------------------------- |
| `stable` | Czeka `stableDelayHours`, a potem stosuje aktualizację z deterministycznym jitter w obrębie `stableJitterHours` (rozłożone wdrożenie). |
| `beta`   | Sprawdza co `betaCheckIntervalHours` (domyślnie: co godzinę) i stosuje od razu.                               |
| `dev`    | Brak automatycznego stosowania. Użyj `openclaw update` ręcznie.                                                |

Gateway zapisuje też wskazówkę o aktualizacji przy uruchomieniu (wyłącz przez `update.checkOnStart: false`).

## Po aktualizacji

<Steps>

### Uruchom doctor

```bash
openclaw doctor
```

Migruje konfigurację, audytuje polityki DM i sprawdza kondycję gateway. Szczegóły: [Doctor](/pl/gateway/doctor)

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

Wskazówka: `npm view openclaw version` pokazuje aktualnie opublikowaną wersję.

### Przypnij commit (źródła)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Aby wrócić do najnowszej wersji: `git checkout main && git pull`.

## Jeśli utkniesz

- Uruchom ponownie `openclaw doctor` i uważnie przeczytaj wynik.
- Dla `openclaw update --channel dev` w checkoutach ze źródeł updater automatycznie bootstrapuje `pnpm`, gdy jest to potrzebne. Jeśli widzisz błąd bootstrapowania pnpm/corepack, zainstaluj `pnpm` ręcznie (albo ponownie włącz `corepack`) i uruchom aktualizację ponownie.
- Sprawdź: [Troubleshooting](/pl/gateway/troubleshooting)
- Zapytaj na Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Install Overview](/pl/install) — wszystkie metody instalacji
- [Doctor](/pl/gateway/doctor) — kontrole kondycji po aktualizacjach
- [Migrating](/pl/install/migrating) — przewodniki migracji głównych wersji
