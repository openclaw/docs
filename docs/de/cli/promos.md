---
read_when:
    - Sie möchten ein kostenloses Aktionsangebot für ein Modell von ClawHub ausprobieren
    - Sie konfigurieren einen Provider im Rahmen einer Aktion statt über das Onboarding.
summary: CLI-Referenz für `openclaw promos` (Aktionsangebote für Modelle auflisten und beanspruchen)
title: Werbeaktionen
x-i18n:
    generated_at: "2026-07-24T03:43:52Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

Entdecken und beanspruchen Sie auf ClawHub veröffentlichte Modellaktionen. Beim Beanspruchen einer
Aktion wird der Provider konfiguriert (Authentifizierung und Plugin, falls erforderlich) und die
Modelle der Aktion werden registriert — ohne das Onboarding erneut auszuführen und ohne
Ihr Standardmodell zu ändern, sofern Sie dies nicht wünschen.

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
Standardmodell, der verbleibenden Zeit und dem exakten Befehl zum Beanspruchen auf. `--json` gibt die unverarbeiteten
Nutzdaten aus.

## `openclaw promos claim <slug>`

Beansprucht eine aktive Aktion:

1. Ruft die Aktion von ClawHub ab und überprüft, ob sie innerhalb ihres Gültigkeitszeitraums liegt.
2. Validiert den Provider, die Authentifizierungsoption und die deklarierten Plugin-Pakete der Aktion
   anhand Ihrer installierten OpenClaw-Version. Unbekannte IDs oder nicht übereinstimmende Pakete werden
   abgelehnt — eine Aktion kann die CLI niemals dazu veranlassen, etwas auszuführen, dessen
   Ausführung sie nicht bereits unterstützt.
3. Verwendet Ihre vorhandenen Provider-Anmeldedaten erneut, sofern diese verfügbar sind. Andernfalls wird
   der reguläre Authentifizierungsablauf des Providers durchlaufen (wobei zuerst die Registrierungs-URL der Aktion
   für einen kostenlosen Schlüssel ausgegeben wird). `--api-key <key>` schließt die API-Schlüssel-Authentifizierung ohne
   Eingabeaufforderungen ab, entsprechend den nicht interaktiven Flags von `openclaw onboard`; um den
   Schlüssel nicht in der Befehlszeile anzugeben, exportieren Sie stattdessen die Umgebungsvariable des Providers
   (zum Beispiel `OPENROUTER_API_KEY`) — vorhandene Anmeldedaten aus der Umgebung werden
   automatisch erkannt, sodass kein Flag erforderlich ist.
4. Registriert die Modelle der Aktion mit ihren Aliasnamen. Vorhandene Aliasnamen werden
   niemals überschrieben.
5. Bietet an, das empfohlene Modell der Aktion als Ihr Standardmodell festzulegen —
   `--set-default` überspringt die Frage; andernfalls werden Ihre Standardeinstellungen
   nicht geändert.

Wenn der Gültigkeitszeitraum der Aktion endet, stellt der Provider die kostenlosen Modelle nicht mehr bereit;
Ihre Konfiguration und Ihre Anmeldedaten bleiben unverändert. Wechseln Sie jederzeit mit
`openclaw models set <model>` zurück.

## Passive Erkennung in `models list`

`openclaw models list` zeigt Aktionen auch an, ohne dass Sie ClawHub
direkt abfragen:

- Aktive Angebote, deren Modelle Sie nicht konfiguriert haben, erscheinen in einer
  Gruppe „Über Aktion verfügbar“ unterhalb der Tabelle, jeweils mit dem zugehörigen Befehl
  zum Beanspruchen.
- Modelle, die Sie über `promos claim` registriert haben, tragen die Kennzeichnung `promo`, die
  nach Ablauf des Gültigkeitszeitraums des Angebots zu `promo ended` wechselt.
- Wenn ein neues Angebot erstmals erkannt wird, verweist ein einmaliger Hinweis auf
  `openclaw promos list`. Angebote, die Sie bereits aufgelistet oder beansprucht haben, werden nicht
  erneut angekündigt.

Hierbei wird eine lokal zwischengespeicherte Kopie des von ClawHub bereitgestellten Aktions-Feeds gelesen
(die normalerweise einmal täglich mit einer bedingten Anfrage aktualisiert wird oder früher, wenn der
zwischengespeicherte Snapshot abläuft; Fehler bei der Aktualisierung werden ohne Meldung übersprungen). Eine überfällige
Aktualisierung wartet höchstens 2.5 Sekunden und verhindert niemals die Auflistung. Die Ausgaben von `--json` und
`--plain` bleiben maschinenlesbar: Sie enthalten keine Aktionsabschnitte oder Hinweise.
Beim Beanspruchen erfolgt stets eine erneute Validierung über die Live-API von ClawHub, sodass ein vorzeitig zurückgezogenes Angebot
abgelehnt wird, selbst wenn es in einer zwischengespeicherten Kopie noch angezeigt wird.
