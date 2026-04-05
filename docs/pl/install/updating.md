---
read_when:
    - Aktualizujesz OpenClaw
    - Coś przestało działać po aktualizacji
summary: Bezpieczna aktualizacja OpenClaw (instalacja globalna lub ze źródeł) oraz strategia rollbacku
title: Aktualizowanie
x-i18n:
    generated_at: "2026-04-05T13:58:30Z"
    model: gpt-5.4
    provider: openai
    source_hash: b40429d38ca851be4fdf8063ed425faf4610a4b5772703e0481c5f1fb588ba58
    source_path: install/updating.md
    workflow: 15
---

# Aktualizowanie

Utrzymuj OpenClaw na bieżąco.

## Zalecane: `openclaw update`

Najszybszy sposób aktualizacji. Wykrywa typ instalacji (npm lub git), pobiera najnowszą wersję, uruchamia `openclaw doctor` i restartuje gateway.

```bash
openclaw update
```

Aby przełączyć kanały lub wskazać konkretną wersję:

```bash
openclaw update --channel beta
openclaw update --tag main
openclaw update --dry-run   # podgląd bez stosowania zmian
```

`--channel beta` preferuje beta, ale runtime wraca do stable/latest, gdy
brakuje tagu beta lub jest on starszy niż najnowsze wydanie stable. Użyj `--tag beta`,
jeśli chcesz surowy npm dist-tag beta dla jednorazowej aktualizacji pakietowej.

Semantykę kanałów opisano w [Development channels](/install/development-channels).

## Alternatywa: uruchom ponownie instalator

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

| Kanał    | Zachowanie                                                                                                         |
| -------- | ------------------------------------------------------------------------------------------------------------------ |
| `stable` | Czeka `stableDelayHours`, a następnie stosuje aktualizację z deterministycznym jitterem w zakresie `stableJitterHours` (rozłożone wdrożenie). |
| `beta`   | Sprawdza co `betaCheckIntervalHours` (domyślnie: co godzinę) i stosuje natychmiast.                               |
| `dev`    | Bez automatycznego stosowania. Używaj ręcznie `openclaw update`.                                                   |

Gateway zapisuje także wskazówkę o aktualizacji przy starcie (wyłącz przez `update.checkOnStart: false`).

## Po aktualizacji

<Steps>

### Uruchom doctor

```bash
openclaw doctor
```

Migruje config, wykonuje audyt polityk DM i sprawdza kondycję gateway. Szczegóły: [Doctor](/gateway/doctor)

### Zrestartuj gateway

```bash
openclaw gateway restart
```

### Zweryfikuj

```bash
openclaw health
```

</Steps>

## Rollback

### Przypnij wersję (npm)

```bash
npm i -g openclaw@<version>
openclaw doctor
openclaw gateway restart
```

Wskazówka: `npm view openclaw version` pokazuje bieżącą opublikowaną wersję.

### Przypnij commit (ze źródeł)

```bash
git fetch origin
git checkout "$(git rev-list -n 1 --before=\"2026-01-01\" origin/main)"
pnpm install && pnpm build
openclaw gateway restart
```

Aby wrócić do najnowszej wersji: `git checkout main && git pull`.

## Jeśli utkniesz

- Uruchom ponownie `openclaw doctor` i uważnie przeczytaj wynik.
- Sprawdź: [Troubleshooting](/gateway/troubleshooting)
- Zapytaj na Discord: [https://discord.gg/clawd](https://discord.gg/clawd)

## Powiązane

- [Install Overview](/install) — wszystkie metody instalacji
- [Doctor](/gateway/doctor) — kontrole kondycji po aktualizacjach
- [Migrating](/install/migrating) — przewodniki migracji między głównymi wersjami
