---
read_when:
    - Sie möchten ein kostenloses Aktionsangebot für ein Modell von ClawHub ausprobieren
    - Sie konfigurieren einen Provider über eine Werbeaktion statt über das Onboarding.
summary: CLI-Referenz für `openclaw promos` (Aktionsangebote für Modelle auflisten und beanspruchen)
title: Aktionen
x-i18n:
    generated_at: "2026-07-12T15:10:46Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

Entdecken und beanspruchen Sie auf ClawHub veröffentlichte Aktionsangebote für Modelle. Beim Beanspruchen einer
Aktion wird der Provider konfiguriert (Authentifizierung und Plugin, falls erforderlich) und
die Modelle der Aktion werden registriert — ohne das Onboarding erneut auszuführen und ohne
Ihr Standardmodell zu ändern, sofern Sie dies nicht ausdrücklich angeben.

Verwandte Themen:

- Standardmodell und Fallbacks: [Modelle](/de/cli/models)
- Einrichtung der Provider-Authentifizierung: [Erste Schritte](/de/start/getting-started)

## Befehle

```bash
openclaw promos list
openclaw promos claim <slug>
openclaw promos claim <slug> --api-key <key> --set-default
```

## `openclaw promos list`

Listet derzeit aktive Aktionen mit ihren Modellen, dem empfohlenen
Standardmodell, der verbleibenden Zeit und dem genauen Befehl zum Beanspruchen auf. `--json` gibt die
unverarbeiteten Daten aus.

## `openclaw promos claim <slug>`

Beansprucht eine aktive Aktion:

1. Ruft die Aktion von ClawHub ab und prüft, ob sie innerhalb ihres Gültigkeitszeitraums liegt.
2. Validiert den Provider, die Authentifizierungsoption und die angegebenen Plugin-Pakete der Aktion
   anhand Ihrer installierten OpenClaw-Version. Unbekannte IDs oder nicht übereinstimmende Pakete werden
   abgelehnt — eine Aktion kann die CLI niemals dazu veranlassen, etwas auszuführen, dessen Ausführung ihr nicht bereits
   bekannt ist.
3. Verwendet Ihre vorhandenen Provider-Anmeldedaten erneut, sofern diese vorliegen. Andernfalls
   führt der Vorgang durch den normalen Authentifizierungsablauf des Providers (wobei zuerst die Registrierungs-URL der Aktion
   für einen kostenlosen Schlüssel ausgegeben wird). `--api-key <key>` schließt die Authentifizierung per API-Schlüssel ohne
   Eingabeaufforderungen ab und entspricht damit den nicht interaktiven Flags von `openclaw onboard`; um den
   Schlüssel nicht in der Befehlszeile anzugeben, exportieren Sie stattdessen die Umgebungsvariable des Providers
   (zum Beispiel `OPENROUTER_API_KEY`) — vorhandene Anmeldedaten aus Umgebungsvariablen werden
   automatisch erkannt, sodass kein Flag erforderlich ist.
4. Registriert die Modelle der Aktion mit ihren Aliasen. Vorhandene Aliase werden
   niemals überschrieben.
5. Bietet an, das empfohlene Modell der Aktion als Ihr Standardmodell festzulegen —
   `--set-default` überspringt die Frage; andernfalls bleiben Ihre Standardeinstellungen
   unverändert.

Wenn der Gültigkeitszeitraum der Aktion endet, stellt der Provider die kostenlosen Modelle nicht mehr bereit;
Ihre Konfiguration und Anmeldedaten bleiben unverändert. Wechseln Sie jederzeit mit
`openclaw models set <model>` zurück.

## Passive Erkennung in `models list`

`openclaw models list` zeigt Aktionen auch an, ohne dass Sie ClawHub
direkt abfragen:

- Aktive Angebote, deren Modelle Sie noch nicht konfiguriert haben, erscheinen unterhalb der Tabelle in einer
  Gruppe „Über Aktion verfügbar“, jeweils mit dem entsprechenden Befehl zum
  Beanspruchen.
- Modelle, die Sie über `promos claim` registriert haben, tragen ein `promo`-Tag, das
  nach Ablauf des Gültigkeitszeitraums des Angebots zu `promo ended` wechselt.
- Wenn ein neues Angebot zum ersten Mal erkannt wird, verweist ein einmaliger Hinweis auf
  `openclaw promos list`. Angebote, die Sie bereits aufgelistet oder beansprucht haben, werden
  nicht erneut angekündigt.

Hierzu wird eine lokal zwischengespeicherte Kopie des von ClawHub gehosteten Aktionsfeeds gelesen
(die normalerweise einmal täglich mit einer bedingten Anfrage oder früher nach Ablauf des
zwischengespeicherten Snapshots aktualisiert wird; fehlgeschlagene Aktualisierungen werden stillschweigend übersprungen). Die Aktualisierung eines veralteten
Snapshots wartet höchstens 2.5 Sekunden und unterbricht die Auflistung niemals. Die Ausgaben von `--json` und
`--plain` bleiben maschinenlesbar: ohne Aktionsabschnitte oder Hinweise.
Beim Beanspruchen erfolgt stets eine erneute Validierung über die Live-API von ClawHub, sodass ein vorzeitig zurückgezogenes
Angebot abgelehnt wird, selbst wenn es in einer zwischengespeicherten Kopie noch angezeigt wird.
