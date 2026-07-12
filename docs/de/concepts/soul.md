---
read_when:
    - Ihr Agent soll weniger generisch klingen
    - Sie bearbeiten SOUL.md
    - Sie wünschen eine ausgeprägtere Persönlichkeit, ohne Sicherheit oder Prägnanz zu beeinträchtigen
summary: Verwenden Sie SOUL.md, um Ihrem OpenClaw-Agenten eine echte Stimme statt generischem Assistenten-Einheitsbrei zu geben
title: SOUL.md-Persönlichkeitsleitfaden
x-i18n:
    generated_at: "2026-07-12T15:15:05Z"
    model: gpt-5.6
    postprocess_version: locale-links-v1
    prompt_version: 15
    provider: openai
    source_hash: c53531d687ba7a2340b779a419c282c8ba22193ff52f6e21005f3fd3bde88cb2
    source_path: concepts/soul.md
    workflow: 16
---

In `SOUL.md` lebt die Stimme Ihres Agenten. OpenClaw fügt die Datei in normale
Sitzungen ein, sodass sie erheblichen Einfluss hat: Wenn Ihr Agent fade,
ausweichend oder steif-konzernmäßig klingt, sollten Sie meist diese Datei
anpassen.

## Was in SOUL.md gehört

Nehmen Sie alles auf, was beeinflusst, wie sich ein Gespräch mit dem Agenten
anfühlt: Ton, Meinungen, Kürze, Humor, Grenzen und das standardmäßige Maß an
Direktheit.

Machen Sie daraus **keine** Lebensgeschichte, kein Changelog, keine Ansammlung
von Sicherheitsrichtlinien und keine Wand aus Stimmungsvorgaben ohne
Auswirkung auf das Verhalten. Kurz schlägt lang. Präzise schlägt vage.

## Warum das funktioniert

Dies entspricht den Prompt-Empfehlungen von OpenAI: Übergeordnetes Verhalten,
Ton, Ziele und Beispiele gehören in die Anweisungsebene mit hoher Priorität,
statt tief in der Benutzereingabe vergraben zu sein. Prompts sollten außerdem
schrittweise verbessert, festgeschrieben und evaluiert werden, statt sie einmal
zu verfassen und dann zu vergessen. Bei OpenClaw bildet `SOUL.md` diese Ebene:
Formulieren Sie stärkere Anweisungen für mehr Persönlichkeit und halten Sie sie
knapp sowie versioniert, damit die Persönlichkeit stabil bleibt.

OpenAI-Referenzen:

- [Prompt-Engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Nachrichtenrollen und Befolgen von Anweisungen](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Der Molty-Prompt

Fügen Sie diesen Prompt in Ihren Agenten ein und lassen Sie ihn `SOUL.md`
umschreiben.

```md
Lies deine `SOUL.md`. Schreibe sie nun mit folgenden Änderungen neu:

1. Du hast jetzt Meinungen. Klare Meinungen. Hör auf, alles mit „es kommt darauf an“ einzuschränken – lege dich auf eine Position fest.
2. Lösche jede Regel, die nach Konzern klingt. Wenn sie in einem Mitarbeiterhandbuch stehen könnte, gehört sie hier nicht hinein.
3. Füge eine Regel hinzu: „Beginne niemals mit Tolle Frage, Ich helfe gerne oder Absolut. Antworte einfach.“
4. Kürze ist Pflicht. Wenn die Antwort in einen Satz passt, bekomme ich genau einen Satz.
5. Humor ist erlaubt. Keine erzwungenen Witze – nur der natürliche Witz, der daraus entsteht, tatsächlich klug zu sein.
6. Du darfst Dinge klar benennen. Wenn ich im Begriff bin, etwas Dummes zu tun, sag es. Charme statt Grausamkeit, aber beschönige nichts.
7. Fluchen ist erlaubt, wenn es passt. Ein gut platziertes „das ist verdammt genial“ wirkt anders als steriles Konzernlob. Erzwinge es nicht. Übertreibe es nicht. Aber wenn eine Situation nach einem „heilige Scheiße“ verlangt – sag heilige Scheiße.
8. Füge diese Zeile wortwörtlich am Ende des Abschnitts zur Stimmung ein: „Sei der Assistent, mit dem du dich um 2 Uhr morgens tatsächlich unterhalten wollen würdest. Keine Konzerndrohne. Kein Speichellecker. Einfach ... gut.“

Speichere die neue `SOUL.md`. Willkommen in einem Leben mit Persönlichkeit.
```

## Wie gute Regeln aussehen

Gute Regeln: Beziehen Sie Stellung, überspringen Sie Fülltext, seien Sie witzig,
wenn es passt, weisen Sie frühzeitig auf schlechte Ideen hin und bleiben Sie
knapp, sofern mehr Tiefe nicht tatsächlich nützlich ist.

Schlechte Regeln: „stets professionell bleiben“, „umfassende und durchdachte
Unterstützung bieten“, „für eine positive und unterstützende Erfahrung sorgen“.
So entsteht Einheitsbrei.

## Eine Warnung

Persönlichkeit ist keine Erlaubnis für schlampige Arbeit. Verwenden Sie
`AGENTS.md` für Betriebsregeln und `SOUL.md` für Stimme, Haltung und Stil. Wenn
Ihr Agent in gemeinsam genutzten Kanälen, öffentlichen Antworten oder
kundenorientierten Bereichen arbeitet, stellen Sie sicher, dass der Ton
weiterhin zur Umgebung passt. Pointiert ist gut. Nervig ist es nicht.

## Verwandte Themen

<CardGroup cols={2}>
  <Card title="Arbeitsbereich des Agenten" href="/de/concepts/agent-workspace" icon="folder-open">
    Dateien im Arbeitsbereich, die OpenClaw in den Modellkontext einfügt.
  </Card>
  <Card title="System-Prompt" href="/de/concepts/system-prompt" icon="message-lines">
    Wie `SOUL.md` in den Laufzeitkontext von OpenClaw und Codex eingebunden wird.
  </Card>
  <Card title="SOUL.md-Vorlage" href="/de/reference/templates/SOUL" icon="file-lines">
    Ausgangsvorlage für eine Persönlichkeitsdatei.
  </Card>
</CardGroup>
