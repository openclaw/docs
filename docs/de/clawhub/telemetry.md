---
read_when:
    - Arbeit an Telemetrie-/Datenschutzkontrollen
    - Fragen dazu, welche Daten erfasst werden
summary: Von der ClawHub-CLI erfasste Installationstelemetrie und wie Sie diese deaktivieren.
x-i18n:
    generated_at: "2026-07-24T04:17:06Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: a02bb1c76fea3105255235f6314ade73f260f692d6eb1b41f8001dc84db6ded7
    source_path: clawhub/telemetry.md
    workflow: 16
---

# Telemetrie

ClawHub verwendet minimale CLI-Telemetrie, um aggregierte Installationszahlen für Skills und Plugins zu berechnen.

## Wann Telemetrie erfasst wird

Telemetrie wird nur gesendet, wenn:

- Sie in der CLI angemeldet sind.
- Sie `clawhub install <slug>` ausführen oder eine authentifizierte Installation von
  `openclaw plugins install clawhub:<package>` abschließen.
- Telemetrie **nicht deaktiviert** ist (siehe „Deaktivieren der Telemetrie“ weiter unten).

Wenn Sie nicht angemeldet sind, werden keine Daten übermittelt.

## Welche Daten wir erfassen

Nachdem ein Skill oder Plugin installiert und der zugehörige lokale Installationsdatensatz gespeichert wurde, sendet die CLI
nach Möglichkeit ein einzelnes Installationsereignis.

Das Ereignis enthält:

- Den Slug des installierten Skills oder den kanonischen Paketnamen des Plugins.
- `version`: die installierte Version, sofern bekannt.

### Welche Daten wir _nicht_ erfassen

- Keine Ordnerpfade oder aus Ordnern abgeleiteten Bezeichner.
- Keine Dateiinhalte.
- Keine Protokolle einzelner Ausführungen, Prompts oder sonstigen CLI-Ausgaben.

## Installationszahlen

Für Skills verwaltet ClawHub:

- `installsAllTime`: eindeutige Benutzer, die mindestens eine CLI-Installation des Skills gemeldet haben.
- `installsCurrent`: eindeutige Benutzer, die eine Installation gemeldet und ihre
  Telemetriedaten nicht gelöscht haben.

Für Plugins zählt ClawHub die erste erfolgreiche Installation, die von jedem Benutzer für jedes Paket gemeldet wird.
Wiederholte Installationen und Aktualisierungen aktualisieren die aufgezeichnete Version, ohne die aggregierte
Installationszahl zu erhöhen.

## Transparenz und Benutzerkontrollen

Für alle sind nur **aggregierte Installationszähler** sichtbar.

Beim Löschen Ihres Kontos werden auch Ihre Telemetriedaten gelöscht und ihr Beitrag aus den
Installationszählern entfernt.

## Deaktivieren der Telemetrie

Setzen Sie die Umgebungsvariable:

```bash
export CLAWHUB_DISABLE_TELEMETRY=1
```

Wenn diese Variable gesetzt ist, sendet die CLI keine Installationstelemetrie.
