---
read_when:
    - Sie möchten, dass ein Agent dem Benutzer eine strukturierte Frage stellt
    - Sie beantworten oder debuggen eine ask_user-Eingabeaufforderung
    - Sie benötigen das `ask_user`-Schema, das Zeitlimit oder das Kanalverhalten
summary: Wie ask_user einen Agenten-Turn für eine strukturierte menschliche Entscheidung pausiert
title: Benutzer fragen
x-i18n:
    generated_at: "2026-07-24T04:43:56Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 32
    provider: openai
    source_hash: 32556314a34c26054c3aabfdd8ecc474cf85196e5cc71adb833face596edbd24
    source_path: tools/ask-user.md
    workflow: 16
---

`ask_user` ermöglicht es dem Agenten, dem Menschen eine bis drei strukturierte Fragen zu stellen und
auf die Antworten zu warten. Das Tool ist für Entscheidungen vorgesehen, die tatsächlich dem Benutzer obliegen,
nicht für routinemäßige Bestätigungen oder Informationen, die der Agent aus der Anfrage,
dem Code oder einer sinnvollen Standardeinstellung ableiten kann.

Das Tool ist nur in der Hauptsitzung verfügbar. Subagenten und andere nicht primäre
Ausführungen erhalten es nicht.

## Eine Frage beantworten

Sie können über jede unterstützte Konversationsoberfläche antworten:

- Die Web-Control-UI dockt ein Fragenpanel direkt über dem Eingabefeld an. Bei
  Eingabeaufforderungen mit mehreren Fragen zeigt das Panel jeweils eine Frage an und führt
  durch eine kurze Schrittanzeige. Nach der Beantwortung wird das Panel geschlossen und im Chat
  verbleibt nur eine kompakte Zusammenfassung der Antworten.
- Telegram, Discord und Slack stellen native Schaltflächen für eine Eingabeaufforderung
  mit einer einzelnen Frage und Einfachauswahl dar.
- Eine Klartextantwort funktioniert auf jedem Kanal. Antworten Sie mit einer Zahl, einer Optionsbezeichnung
  oder Ihrer eigenen Antwort.

OpenClaw aktiviert immer eine Freitextantwort vom Typ **Sonstiges**. Der Agent darf der erstellten Optionsliste
keine Option `Other` hinzufügen.

## Plattformverhalten

Antworten funktionieren auf jeder unterstützten Konversationsoberfläche. Die Web-Control-UI verwendet eine
angedockte Schrittanzeige, die im ausgeklappten Zustand das Eingabefeld ersetzt; beim Einklappen wird
das vollständige Eingabefeld unter einer schmalen Fragenleiste wiederhergestellt. iOS, macOS und Android zeigen
Inline-Karten an; mehrere Fragen bleiben bewusst als berührungsfreundliches
Darstellungsmuster gestapelt. Jede Plattform behält die Zusammenfassung von Fragen und Antworten ohne
zeitgesteuertes Entfernen in der aktiven Chat-Chronik bei, und **Überspringen** ist überall verfügbar.

Eingabeaufforderungen, die keine nativen Schaltflächen verwenden können, einschließlich solcher mit mehreren Fragen und
Mehrfachauswahl, werden auf Kanälen als lesbarer Text dargestellt. Die Control UI
behält die vollständige strukturierte Schrittanzeige bei.

## Zeitüberschreitung und keine Antwort

Die standardmäßige Zeitüberschreitung beträgt 900 Sekunden. `timeoutSeconds` wird auf den Bereich
von 30 bis 3600 Sekunden begrenzt.

Wenn die Frage abläuft oder abgebrochen wird, bevor eine Antwort eingeht, gibt das Tool
`status: "no_answer"` zurück. Der Agent fährt dann nach bestem Ermessen fort.
Eine abgebrochene Agentenausführung bricht die ausstehende Gateway-Frage ab.

## Tool-Schema

```ts
{
  questions: Array<{
    id: string; // eindeutiger Antwortschlüssel in snake_case
    header: string; // kurze Bezeichnung; auf 12 Zeichen gekürzt
    question: string; // ein Satz
    options: Array<{
      label: string;
      description?: string;
    }>; // 2-4 Optionen
    multiSelect?: boolean;
  }>; // 1-3 Fragen
  timeoutSeconds?: number; // Ganzzahl; Standardwert 900, begrenzt auf 30-3600
}
```

Mit `multiSelect: true` kann der Benutzer mehr als eine Option auswählen. Die Antwortwerte
werden für jede Frage als Array zurückgegeben.

Beispiel für ein beantwortetes Ergebnis:

```json
{
  "status": "answered",
  "answers": {
    "answers": {
      "deploy_target": ["Staging (Recommended)"]
    }
  }
}
```

## Modellhinweise

Der für das Modell bestimmte Vertrag weist den Agenten an:

- nur zu fragen, wenn er bei einer Entscheidung blockiert ist, die tatsächlich dem Benutzer obliegt;
- eine Frage zu bevorzugen und höchstens drei zu verwenden;
- die empfohlene Option an die erste Stelle zu setzen und ihrer Bezeichnung `(Recommended)` anzuhängen;
- eine erstellte Option `Other` wegzulassen, da Freitext automatisch hinzugefügt wird;
- nach `no_answer` nach bestem Ermessen fortzufahren.

Der Agent sollte `ask_user` nicht verwenden, um zu fragen, ob er fortfahren darf, oder um
seinen eigenen Plan bestätigen zu lassen.
