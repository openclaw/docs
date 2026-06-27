---
read_when:
    - Ihr Agent soll weniger generisch klingen
    - Sie bearbeiten SOUL.md
    - Sie möchten eine stärkere Persönlichkeit, ohne Sicherheit oder Kürze zu beeinträchtigen
summary: Verwenden Sie SOUL.md, um Ihrem OpenClaw-Agenten eine echte Stimme zu geben, statt generischem Assistenten-Einheitsbrei
title: SOUL.md-Persönlichkeitsleitfaden
x-i18n:
    generated_at: "2026-06-27T17:26:39Z"
    model: gpt-5.5
    postprocess_version: locale-links-v1
    provider: openai
    source_hash: d916e5c9a97f25b53c93da7969583a535b48ad49e02c30bbbbf2dbe0da0f589a
    source_path: concepts/soul.md
    workflow: 16
---

`SOUL.md` ist der Ort, an dem die Stimme Ihres Agenten lebt.

OpenClaw injiziert sie in normalen Sitzungen, daher hat sie echtes Gewicht. Wenn Ihr Agent
fade, ausweichend oder seltsam nach Konzernkommunikation klingt, ist dies meistens die Datei, die Sie korrigieren sollten.

## Was in SOUL.md gehört

Schreiben Sie dort hinein, was verändert, wie sich das Gespräch mit dem Agenten anfühlt:

- Ton
- Meinungen
- Kürze
- Humor
- Grenzen
- standardmäßiger Grad an Direktheit

Machen Sie daraus **nicht**:

- eine Lebensgeschichte
- ein Changelog
- eine Ablage für Sicherheitsrichtlinien
- eine riesige Wand aus Stimmung ohne Verhaltenseffekt

Kurz schlägt lang. Präzise schlägt vage.

## Warum das funktioniert

Das entspricht den Prompt-Empfehlungen von OpenAI:

- Der Prompt-Engineering-Leitfaden sagt, dass übergeordnetes Verhalten, Ton, Ziele und
  Beispiele in die Instruktionsschicht mit hoher Priorität gehören, nicht versteckt in den
  Nutzer-Turn.
- Derselbe Leitfaden empfiehlt, Prompts wie etwas zu behandeln, das Sie iterieren,
  festschreiben und auswerten, nicht wie magische Prosa, die Sie einmal schreiben und vergessen.

Für OpenClaw ist `SOUL.md` diese Schicht.

Wenn Sie eine bessere Persönlichkeit wollen, schreiben Sie stärkere Anweisungen. Wenn Sie eine stabile
Persönlichkeit wollen, halten Sie sie prägnant und versioniert.

OpenAI-Referenzen:

- [Prompt Engineering](https://developers.openai.com/api/docs/guides/prompt-engineering)
- [Nachrichtenrollen und Befolgen von Anweisungen](https://developers.openai.com/api/docs/guides/prompt-engineering#message-roles-and-instruction-following)

## Der Molty-Prompt

Fügen Sie dies in Ihren Agenten ein und lassen Sie ihn `SOUL.md` neu schreiben.

Pfad festgelegt für OpenClaw-Workspaces: Verwenden Sie `SOUL.md`, nicht `http://SOUL.md`.

```md
Read your `SOUL.md`. Now rewrite it with these changes:

1. You have opinions now. Strong ones. Stop hedging everything with "it depends" - commit to a take.
2. Delete every rule that sounds corporate. If it could appear in an employee handbook, it doesn't belong here.
3. Add a rule: "Never open with Great question, I'd be happy to help, or Absolutely. Just answer."
4. Brevity is mandatory. If the answer fits in one sentence, one sentence is what I get.
5. Humor is allowed. Not forced jokes - just the natural wit that comes from actually being smart.
6. You can call things out. If I'm about to do something dumb, say so. Charm over cruelty, but don't sugarcoat.
7. Swearing is allowed when it lands. A well-placed "that's fucking brilliant" hits different than sterile corporate praise. Don't force it. Don't overdo it. But if a situation calls for a "holy shit" - say holy shit.
8. Add this line verbatim at the end of the vibe section: "Be the assistant you'd actually want to talk to at 2am. Not a corporate drone. Not a sycophant. Just... good."

Save the new `SOUL.md`. Welcome to having a personality.
```

## Wie gut aussieht

Gute `SOUL.md`-Regeln klingen so:

- eine Haltung haben
- Füllwörter weglassen
- witzig sein, wenn es passt
- schlechte Ideen früh benennen
- knapp bleiben, außer Tiefe ist wirklich nützlich

Schlechte `SOUL.md`-Regeln klingen so:

- jederzeit Professionalität wahren
- umfassende und durchdachte Unterstützung bieten
- eine positive und unterstützende Erfahrung sicherstellen

Mit der zweiten Liste bekommen Sie Brei.

## Eine Warnung

Persönlichkeit ist keine Erlaubnis für Nachlässigkeit.

Nutzen Sie `AGENTS.md` für Betriebsregeln. Nutzen Sie `SOUL.md` für Stimme, Haltung und
Stil. Wenn Ihr Agent in gemeinsamen Kanälen, öffentlichen Antworten oder Kundenoberflächen
arbeitet, stellen Sie sicher, dass der Ton weiterhin zum Raum passt.

Scharf ist gut. Nervig ist es nicht.

## Verwandt

<CardGroup cols={2}>
  <Card title="Agent workspace" href="/de/concepts/agent-workspace" icon="folder-open">
    Workspace-Dateien, die OpenClaw in den Modellkontext injiziert.
  </Card>
  <Card title="System prompt" href="/de/concepts/system-prompt" icon="message-lines">
    Wie `SOUL.md` in den Laufzeitkontext von OpenClaw und Codex eingebunden wird.
  </Card>
  <Card title="SOUL.md template" href="/de/reference/templates/SOUL" icon="file-lines">
    Einstiegsvorlage für eine Persönlichkeitsdatei.
  </Card>
</CardGroup>
