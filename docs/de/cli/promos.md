---
read_when:
    - Sie möchten ein kostenloses Aktionsangebot für ein Modell von ClawHub ausprobieren
    - Sie konfigurieren einen Provider über eine Aktion statt über das Onboarding.
summary: CLI-Referenz für `openclaw promos` (Aktionsangebote für Modelle auflisten und beanspruchen)
title: Werbeaktionen
x-i18n:
    generated_at: "2026-07-12T01:33:20Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: 779eab2e9500b7376fabf9accb333e83ff5f84b085d51b7d551b5507b1e73adb
    source_path: cli/promos.md
    workflow: 16
---

# `openclaw promos`

Entdecken und beanspruchen Sie auf ClawHub veröffentlichte Aktionsangebote für Modelle. Beim Beanspruchen einer
Aktion wird der Provider konfiguriert (Authentifizierung und Plugin, falls erforderlich) und die
Modelle der Aktion werden registriert — ohne das Onboarding erneut auszuführen und ohne
Ihr Standardmodell zu ändern, sofern Sie dies nicht ausdrücklich wünschen.

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

Listet derzeit aktive Aktionen mit ihren Modellen, dem vorgeschlagenen
Standardmodell, der verbleibenden Zeit und dem exakten Befehl zum Beanspruchen auf. `--json` gibt die
unverarbeiteten Nutzdaten aus.

## `openclaw promos claim <slug>`

Beansprucht eine aktive Aktion:

1. Ruft die Aktion von ClawHub ab und überprüft, ob sie innerhalb ihres Gültigkeitszeitraums liegt.
2. Validiert den Provider, die Authentifizierungsmethode und die angegebenen Plugin-Pakete der Aktion
   anhand Ihrer installierten OpenClaw-Version. Unbekannte IDs oder nicht übereinstimmende Pakete werden
   abgelehnt — eine Aktion kann die CLI niemals dazu veranlassen, etwas auszuführen, dessen Ausführung sie nicht bereits
   unterstützt.
3. Verwendet Ihre vorhandenen Provider-Anmeldedaten, sofern verfügbar. Andernfalls
   führt der Befehl Sie durch den normalen Authentifizierungsablauf des Providers (wobei zuerst die Registrierungs-URL der Aktion
   für einen kostenlosen Schlüssel ausgegeben wird). `--api-key <key>` schließt die API-Schlüssel-Authentifizierung ohne
   Eingabeaufforderungen ab und entspricht dabei den nicht interaktiven Flags von `openclaw onboard`; um den
   Schlüssel nicht in der Befehlszeile anzugeben, exportieren Sie stattdessen die Umgebungsvariable des Providers
   (beispielsweise `OPENROUTER_API_KEY`) — vorhandene Anmeldedaten aus Umgebungsvariablen werden
   automatisch erkannt und es ist kein Flag erforderlich.
4. Registriert die Modelle der Aktion mit ihren Aliasnamen. Vorhandene Aliasnamen werden
   niemals überschrieben.
5. Bietet an, das vorgeschlagene Modell der Aktion als Ihr Standardmodell festzulegen —
   `--set-default` überspringt die Nachfrage; andernfalls bleiben Ihre Standardeinstellungen
   unverändert.

Wenn der Gültigkeitszeitraum der Aktion endet, stellt der Provider die kostenlosen Modelle nicht mehr bereit;
Ihre Konfiguration und Anmeldedaten bleiben unverändert. Sie können jederzeit mit
`openclaw models set <model>` zurückwechseln.

## Passive Erkennung in `models list`

`openclaw models list` zeigt Aktionen auch an, ohne dass Sie ClawHub
direkt abfragen:

- Aktive Angebote, deren Modelle Sie noch nicht konfiguriert haben, erscheinen unterhalb der Tabelle in einer
  Gruppe „Über Aktion verfügbar“, jeweils mit dem zugehörigen Befehl zum
  Beanspruchen.
- Modelle, die Sie über `promos claim` registriert haben, tragen ein `promo`-Tag, das
  nach Ablauf des Angebotszeitraums zu `promo ended` wechselt.
- Beim erstmaligen Erkennen eines neuen Angebots verweist ein einmaliger Hinweis auf
  `openclaw promos list`. Angebote, die Sie bereits aufgelistet oder beansprucht haben, werden nie
  erneut angekündigt.

Dabei wird eine lokal zwischengespeicherte Kopie des von ClawHub bereitgestellten Aktionsfeeds gelesen
(die normalerweise einmal täglich durch eine bedingte Anfrage aktualisiert wird oder früher, wenn der
zwischengespeicherte Snapshot abläuft; Fehler bei der Aktualisierung werden stillschweigend übersprungen). Eine Aktualisierung veralteter
Daten wartet höchstens 2,5 Sekunden und verhindert niemals die Auflistung. Die Ausgaben von `--json` und
`--plain` bleiben maschinenlesbar: keine Aktionsabschnitte oder Hinweise.
Beim Beanspruchen erfolgt stets eine erneute Validierung über die Live-API von ClawHub, sodass ein vorzeitig zurückgezogenes Angebot
abgelehnt wird, selbst wenn es in einer zwischengespeicherten Kopie noch angezeigt wird.
